/* ============================================================
   PRISM — scroll engine
   Multiple canvas frame-sequence scrub sections + scroll reveals + counters
   ============================================================ */
/* How many of a sequence's frames this visitor downloads.
   - Every device: the poster frame at once, the rest of a sequence only once its section is within
     ~1.5 screens (a cold visit used to fetch all 1,338 frames, ~93 MB, as the page was scrolled).
   - Only every Nth frame is ever requested: every 2nd on desktop, every 4th on a phone (narrow screen),
     every 6th with Save-Data or a 2G/3G connection. The canvas draws the closest frame it has, so the
     scrub still moves smoothly; it just steps through half, a quarter or a sixth of the pictures. */
function frameStep() {
  const c = navigator.connection || {};
  if (c.saveData || /(^|-)[23]g$/.test(c.effectiveType || "")) return 6;
  if (window.matchMedia && window.matchMedia("(max-width: 820px)").matches) return 4;
  return 2;
}

function initScrub(cfg) {
  const section = document.querySelector(cfg.section);
  const canvas  = section.querySelector("canvas");
  const ctx     = canvas.getContext("2d", { alpha: false });
  const lines   = [...section.querySelectorAll(".reveal-line")];
  const bgFill  = cfg.bg || "#0a0a12";
  const step    = frameStep();
  const images = [];
  let painted = false;                            // has the canvas shown a frame yet?
  let framesRequested = false;
  let current = -1;
  function loadFrame(i) {
    if (images[i]) return images[i];
    const img = new Image();
    img.onload = () => {
      const at = current < 0 ? 0 : current;
      if (!painted || Math.abs(i - at) < step) draw(at);   // a nearer frame than the one on screen has arrived
    };
    img.src = cfg.framePath(i + 1);
    images[i] = img;
    return img;
  }
  /* every step-th frame, and the last so the end of the sequence is exact */
  function loadAllFrames() {
    if (framesRequested) return;
    framesRequested = true;
    for (let i = 0; i < cfg.frameCount; i++) if (i % step === 0 || i === cfg.frameCount - 1) loadFrame(i);
  }
  loadFrame(0);
  /* the loaded frame closest to the one asked for */
  function nearest(index) {
    for (let d = 0; d <= step * 2; d++) {
      for (const i of d ? [index - d, index + d] : [index]) {
        const img = images[i];
        if (img && img.complete && img.naturalWidth) return img;
      }
    }
    return null;
  }
  function draw(index) {
    const img = nearest(index);
    if (!img) return;
    painted = true;
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    const ir = img.naturalWidth / img.naturalHeight, cr = cw / ch;
    let dw, dh, dx, dy;
    if (ir > cr) { dh = ch; dw = ch * ir; dx = (cw - dw) / 2; dy = 0; }
    else         { dw = cw; dh = cw / ir; dx = 0; dy = (ch - dh) / 2; }
    ctx.fillStyle = bgFill; ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = canvas.clientWidth  * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(current < 0 ? 0 : current);
  }
  function update() {
    const rect = section.getBoundingClientRect();
    /* pull the frames in once the section is within ~1.5 screens. Driven off the rAF rect
       rather than IntersectionObserver so there is no second code path that can silently fail
       and strand the poster frame. */
    const vh = window.innerHeight || 800;
    const near = vh * 1.5;
    if (rect.bottom > -near && rect.top < window.innerHeight + near) loadAllFrames();
    if (rect.bottom < -window.innerHeight || rect.top > window.innerHeight) return;
    const scrollable = rect.height - window.innerHeight;
    const p = Math.min(Math.max(-rect.top / scrollable, 0), 1);
    const idx = Math.min(cfg.frameCount - 1, Math.floor(p * (cfg.frameCount - 1)));
    if (idx !== current) { current = idx; draw(idx); }
    for (const el of lines) {
      const a = parseFloat(el.dataset.in), b = parseFloat(el.dataset.out);
      const mid = (a + b) / 2, half = (b - a) / 2;
      let o = 1 - Math.abs(p - mid) / half;
      o = Math.max(0, Math.min(1, o));
      el.style.opacity = o.toFixed(3);
      el.style.transform = `translateY(${(1 - o) * 30}px)`;
    }
  }
  window.addEventListener("resize", resize);
  resize();
  return { update, resize };
}

function animateCount(el) {
  const target = parseFloat(el.dataset.count), suffix = el.dataset.suffix || "";
  const dur = 1500, t0 = performance.now();
  function step(t) {
    const k = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - k, 3);
    el.textContent = (target % 1 === 0 ? Math.round(target*eased) : (target*eased).toFixed(1)) + suffix;
    if (k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

document.addEventListener("DOMContentLoaded", () => {
  const scrubs = (window.SCRUB_SECTIONS || [])
    .filter(c => document.querySelector(c.section))
    .map(initScrub);

  const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
  window.__lenis = lenis;
  function raf(t) { lenis.raf(t); scrubs.forEach(s => s.update()); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  // Reveal once a quarter of the element is on screen — or, for an element
  // taller than four screens (the comparison table stacked on a phone), once
  // it fills a quarter of the screen: its own 25% can never fit in view, so a
  // ratio-only rule left it invisible forever.
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const screen = e.rootBounds ? e.rootBounds.height : window.innerHeight;
      if (e.intersectionRatio < 0.25 && e.intersectionRect.height < screen * 0.25) return;
      e.target.classList.add("in");
      if (e.target.classList.contains("stat-num")) animateCount(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: [0, 0.02, 0.05, 0.1, 0.15, 0.2, 0.25] });
  document.querySelectorAll(".reveal, .stat-num").forEach((el) => io.observe(el));

  lenis.on("scroll", ({ scroll }) => {
    document.querySelectorAll(".scroll-hint").forEach(h => h.style.opacity = scroll > 60 ? "0" : "1");
  });
});
