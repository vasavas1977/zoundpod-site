/* ============================================================
   ZOUND — before/after compare slider
   A range input (keyboard-accessible) drives --pos; pointer
   drag anywhere on the figure moves the divider. No timers,
   no auto-animation, so it is fine under reduced motion.
   ============================================================ */
(function () {
  "use strict";

  function init(el) {
    var range = el.querySelector(".compare-range");
    if (!range) return;

    function setPos(v) {
      var p = Math.max(0, Math.min(100, v));
      el.style.setProperty("--pos", p + "%");
    }
    setPos(parseFloat(range.value));

    // keyboard + native range interaction
    range.addEventListener("input", function () { setPos(parseFloat(range.value)); });

    // click / drag anywhere on the figure
    var dragging = false;
    function fromX(clientX) {
      var r = el.getBoundingClientRect();
      if (r.width <= 0) return;
      var p = ((clientX - r.left) / r.width) * 100;
      range.value = p;
      setPos(p);
    }
    el.addEventListener("pointerdown", function (e) {
      // let the native range thumb keep working too, but drive from x for nicer feel
      dragging = true;
      fromX(e.clientX);
      if (el.setPointerCapture && e.pointerId != null) {
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
      }
    });
    el.addEventListener("pointermove", function (e) { if (dragging) fromX(e.clientX); });
    el.addEventListener("pointerup", function () { dragging = false; });
    el.addEventListener("pointercancel", function () { dragging = false; });
  }

  function boot() {
    [].slice.call(document.querySelectorAll(".compare-slider")).forEach(init);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
