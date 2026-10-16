/* ============================================================
   SERIES PAGES — SR + Life
   Colour/size swatch switcher and click-to-load YouTube facades.
   Kept deliberately small and dependency-free, like the rest of the site.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- colour + size switcher ----------
     The stage carries data-prefix (asset folder) and the buttons carry the
     colour/size slugs; the image path is <prefix>/<size>-<colour>.webp. */
  function initStage(stage) {
    var img = stage.querySelector("img[data-stage-img]");
    var nameOut = stage.querySelector("[data-stage-name]");
    var prefix = stage.getAttribute("data-prefix");
    /* Swatch paths are built at runtime, so they need the same cache token the
       markup carries — otherwise a corrected render never reaches anyone who
       already loaded the old one. */
    var ver = stage.getAttribute("data-ver");
    var q = ver ? "?v=" + ver : "";
    if (!img || !prefix) return;

    var swatches = [].slice.call(stage.querySelectorAll(".swatch"));
    var sizes = [].slice.call(stage.querySelectorAll(".szbtn"));
    var colour = (stage.querySelector(".swatch.is-on") || swatches[0] || {}).dataset;
    var size = (stage.querySelector(".szbtn.is-on") || sizes[0] || {}).dataset;
    if (!colour || !size) return;
    var cur = { colour: colour.colour, size: size.size, el: stage.querySelector(".swatch.is-on") || swatches[0] };

    function label(el) {
      var th = document.documentElement.lang === "th";
      return (th ? el.getAttribute("data-name-th") : el.getAttribute("data-name-en")) ||
             el.getAttribute("data-name-en") || "";
    }

    function render() {
      var next = prefix + "/" + cur.size + "-" + cur.colour + ".webp" + q;
      /* preload before swapping so the stage never flashes empty */
      var probe = new Image();
      probe.onload = function () { img.src = next; };
      probe.onerror = function () { img.src = next; };   /* let the browser show its own failure */
      probe.src = next;
      if (nameOut && cur.el) nameOut.textContent = label(cur.el);
      var alt = img.getAttribute("data-alt-base");
      if (alt && cur.el) img.alt = alt + " — " + label(cur.el);
    }

    swatches.forEach(function (b) {
      b.addEventListener("click", function () {
        swatches.forEach(function (o) { o.classList.remove("is-on"); o.setAttribute("aria-checked", "false"); });
        b.classList.add("is-on"); b.setAttribute("aria-checked", "true");
        cur.colour = b.getAttribute("data-colour"); cur.el = b;
        render();
      });
    });

    sizes.forEach(function (b) {
      b.addEventListener("click", function () {
        sizes.forEach(function (o) { o.classList.remove("is-on"); o.setAttribute("aria-pressed", "false"); });
        b.classList.add("is-on"); b.setAttribute("aria-pressed", "true");
        cur.size = b.getAttribute("data-size");
        render();
      });
    });

    /* keep the swatch name in the right language when EN/TH is toggled */
    new MutationObserver(function () {
      if (nameOut && cur.el) nameOut.textContent = label(cur.el);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }

  /* ---------- YouTube facade ----------
     The real iframe pulls ~1MB of player before anyone presses play, so the
     thumbnail stands in until it is clicked. */
  function initYouTube(fig) {
    var btn = fig.querySelector(".yt-play");
    var id = fig.getAttribute("data-yt");
    if (!btn || !id) return;
    btn.addEventListener("click", function () {
      var fr = document.createElement("iframe");
      fr.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      fr.title = fig.getAttribute("data-title") || "ZOUND";
      fr.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      fr.allowFullscreen = true;
      fr.loading = "lazy";
      btn.replaceWith(fr);
    });
  }

  function init() {
    [].slice.call(document.querySelectorAll("[data-prefix]")).forEach(initStage);
    [].slice.call(document.querySelectorAll(".yt[data-yt]")).forEach(initYouTube);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
