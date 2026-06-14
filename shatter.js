/* ============================================================
   ZOUND — RANGE REVEAL · shatter-to-assemble
   Self-contained vanilla module. Does NOT create a Lenis instance.
   Builds a seam-free COLS x ROWS tile grid that scatters at the
   section start and locks into ONE razor-sharp image at the end.
   Runs its OWN rAF loop, reading the section rect each frame
   (rect-based progress, identical math to the existing engine).

   PERFORMANCE-FIRST. Animates only transform / filter / opacity.
   - 40 tiles (8x5): "many fragments" while under the blur/layer budget.
   - blur finishes EARLY (gone by 50% of each tile's window) and is capped.
   - will-change is promoted only while a tile is moving and RELEASED
     once it locks, so the compositor never holds 40 standing layers.
   - zero per-frame layout reads (single cached getBoundingClientRect),
     batched style writes, sub-pixel transforms, translateZ GPU layers.
   ============================================================ */
(function () {
  "use strict";

  /* ---- config ---- */
  var COLS = 8;             // horizontal tiles
  var ROWS = 5;             // vertical tiles   (8x5 = 40 fragments)
  var IMG_SRC = "assets/pods-lineup.jpg";

  // tuning
  var SCATTER_VW   = 55;    // max horizontal fling, in vw
  var SCATTER_VH   = 55;    // max vertical fling, in vh
  var MAX_ROT      = 40;    // ± degrees at p=0
  var MAX_SCALE    = 1.18;  // scale at p=0
  var HOME_SCALE   = 1.004; // tiny rest overlap (~0.4%) so adjacent GPU layers
                            // overlap by a sub-pixel and never show AA hairlines
  var MAX_BLUR     = 12;    // px blur at p=0 (softer so scattered fragments stay legible)
  var MIN_OPACITY  = 0.55;  // opacity at p=0 — fragments clearly visible from the start
  var STAGGER_MAX  = 0.45;  // last tiles start at 45% of the timeline
  var BLUR_DONE_AT = 0.5;   // a tile's blur reaches 0 at 50% of ITS window
  var COPY_START   = 0.6;   // overlay copy begins fading in here
  var COPY_SPAN    = 0.34;  // ...and is fully in by 0.94

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* deterministic pseudo-random in [0,1) seeded by integers (no Math.random
     so the scatter is stable every frame & every reload) */
  function rand(c, r, salt) {
    var s = Math.sin((c + 1) * 127.1 + (r + 1) * 311.7 + salt * 74.7) * 43758.5453;
    return s - Math.floor(s);
  }

  /* easeOutQuint — long, smooth deceleration into the locked state */
  function easeOutQuint(t) {
    var u = 1 - t;
    return 1 - u * u * u * u * u;
  }

  function boot() {
    var section = document.getElementById("range-reveal");
    if (!section) return;
    var stage = section.querySelector(".range-grid");
    var overlay = section.querySelector(".range-overlay");
    if (!stage) return;

    var COLS1 = COLS > 1 ? COLS - 1 : 1;   // guard divide-by-zero
    var ROWS1 = ROWS > 1 ? ROWS - 1 : 1;
    var bgSizeX = (COLS * 100);            // % — full image scaled across grid
    var bgSizeY = (ROWS * 100);

    /* probe the image so a missing file never throws; we still build the
       grid (tiles inherit the bg via CSS) but flag a fallback class so the
       dark stage + overlay copy still read as a finished section. */
    var probe = new Image();
    probe.onerror = function () { section.classList.add("range-noimg"); };
    probe.src = IMG_SRC;

    var tiles = [];   // { el, hx, hy, srot, delay, span, parked }

    var frag = document.createDocumentFragment();
    var cx = (COLS - 1) / 2, cy = (ROWS - 1) / 2;
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var el = document.createElement("div");
        el.className = "range-tile";

        // ---- seam-free placement (see bgPositionFormula) ----
        var bgPosX = (c / COLS1) * 100;
        var bgPosY = (r / ROWS1) * 100;
        var st = el.style;
        st.left = (c / COLS * 100) + "%";
        st.top = (r / ROWS * 100) + "%";
        st.width = (100 / COLS) + "%";
        st.height = (100 / ROWS) + "%";
        st.backgroundImage = "url(" + IMG_SRC + ")";
        st.backgroundSize = bgSizeX + "% " + bgSizeY + "%";
        st.backgroundPosition = bgPosX + "% " + bgPosY + "%";

        // ---- deterministic scatter vector (stable across frames/reloads) ----
        var ang = rand(c, r, 1.0) * Math.PI * 2;          // direction
        var mag = 0.55 + rand(c, r, 2.0) * 0.45;          // 0.55..1.0 of max
        var hx = Math.cos(ang) * SCATTER_VW * mag;        // vw
        var hy = Math.sin(ang) * SCATTER_VH * mag;        // vh
        var srot = (rand(c, r, 3.0) * 2 - 1) * MAX_ROT;   // ± deg

        // ---- center-out wave (CENTER-FIRST) ----
        // normalized distance from grid center -> start delay. Center-first
        // because the focal pods sit mid-frame: the product locks in first and
        // the image fills outward under the rising headline, while the cheapest
        // region to mask with blur (the periphery) lands last.
        var dx = (c - cx) / (cx || 1);
        var dy = (r - cy) / (cy || 1);
        var dist = Math.sqrt(dx * dx + dy * dy) / Math.SQRT2; // 0..1
        var delay = dist * STAGGER_MAX;

        tiles.push({
          el: el, hx: hx, hy: hy, srot: srot,
          delay: delay, span: 1 - delay, parked: false
        });
        frag.appendChild(el);
      }
    }
    stage.appendChild(frag);

    /* ---- raf (graceful no-rAF fallback) ---- */
    var raf = (typeof requestAnimationFrame === "function")
      ? requestAnimationFrame.bind(window)
      : function (cb) { return setTimeout(function () { cb(Date.now()); }, 16); };

    function applyTile(tl, p) {
      var local = tl.span <= 0 ? 1 : clamp((p - tl.delay) / tl.span, 0, 1);
      var e = easeOutQuint(local);
      var inv = 1 - e;

      var x = tl.hx * inv;                  // vw
      var y = tl.hy * inv;                  // vh
      var rot = tl.srot * inv;             // deg
      var scale = HOME_SCALE + (MAX_SCALE - HOME_SCALE) * inv;
      var op = MIN_OPACITY + (1 - MIN_OPACITY) * e;

      // blur finishes EARLY — reaches 0 at BLUR_DONE_AT of this tile's window
      var be = easeOutQuint(clamp(local / BLUR_DONE_AT, 0, 1));
      var blur = MAX_BLUR * (1 - be);

      var s = tl.el.style;
      s.transform =
        "translate3d(" + x.toFixed(3) + "vw," + y.toFixed(3) + "vh,0) " +
        "rotate(" + rot.toFixed(3) + "deg) " +
        "scale(" + scale.toFixed(4) + ")";
      s.opacity = op.toFixed(4);

      if (local >= 1) {
        // LOCKED: crisp, full, and release the GPU layer so 40 promoted
        // tiles don't sit in VRAM at rest. (Idempotent via `parked`.)
        if (!tl.parked) {
          s.filter = "none";
          s.willChange = "auto";
          tl.parked = true;
        }
      } else {
        if (tl.parked) { s.willChange = "transform, opacity, filter"; tl.parked = false; }
        s.filter = blur < 0.06 ? "none" : "blur(" + blur.toFixed(3) + "px)";
      }
    }

    /* ---- frame loop: single cached rect read, batched writes ---- */
    var lastP = -1;
    function update() {
      var rect = section.getBoundingClientRect();           // the ONLY layout read
      var vh = window.innerHeight || document.documentElement.clientHeight;

      // fully offscreen: skip all work this frame
      if (rect.bottom < -vh || rect.top > vh) { raf(update); return; }

      var scrollable = rect.height - vh;
      var p = scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 1;

      if (p !== lastP) {
        lastP = p;
        for (var i = 0; i < tiles.length; i++) applyTile(tiles[i], p);

        // overlay copy driven by the SAME progress (no IntersectionObserver)
        if (overlay) {
          var oe = easeOutQuint(clamp((p - COPY_START) / COPY_SPAN, 0, 1));
          overlay.style.opacity = oe.toFixed(3);
          overlay.style.transform = "translateY(" + ((1 - oe) * 28).toFixed(2) + "px)";
          overlay.style.pointerEvents = oe > 0.5 ? "auto" : "none";
        }
      }
      raf(update);
    }

    // paint the shattered start state immediately (zero pop on first frame)
    for (var j = 0; j < tiles.length; j++) applyTile(tiles[j], 0);
    if (overlay) {
      overlay.style.opacity = "0";
      overlay.style.transform = "translateY(28px)";
      overlay.style.pointerEvents = "none";
    }

    raf(update);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
