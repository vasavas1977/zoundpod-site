/* ZOUND — "Learn with ZOUND" explainer: click-to-play YouTube (no YouTube code loads until the visitor asks).
   Plays the Thai or the English cut to match the site language (html[lang], set by i18n.js), swapping the poster
   too; falls back to the Thai cut when a box has no English video. Pauses the site's ambient music while playing. */
(function () {
  "use strict";
  function lang() { return (document.documentElement.lang || "en").slice(0, 2) === "th" ? "th" : "en"; }
  function pick(box, key) {
    var v = lang() === "en" ? box.getAttribute("data-" + key + "-en") : null;
    if (v && v.indexOf("__") === 0) v = null;      // unfilled placeholder: fall back to the Thai cut
    return v || box.getAttribute("data-" + key);
  }
  function syncPoster(box) {
    if (box.classList.contains("playing")) return;
    var img = box.querySelector("img"), src = pick(box, "poster");
    if (img && src && img.getAttribute("src") !== src) img.setAttribute("src", src);
  }
  function play(box) {
    if (box.classList.contains("playing")) return;
    var id = pick(box, "yt");
    if (!id) return;
    if (window.zoundSound && window.zoundSound.pause) window.zoundSound.pause();
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&playsinline=1&modestbranding=1";
    f.title = box.getAttribute("aria-label") || "ZOUND video";
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.allowFullscreen = true;
    box.classList.add("playing");
    box.removeAttribute("role");
    box.innerHTML = "";
    box.appendChild(f);
  }
  var boxes = Array.prototype.slice.call(document.querySelectorAll("[data-yt]"));
  boxes.forEach(function (box) {
    syncPoster(box);
    box.addEventListener("click", function () { play(box); });
    box.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(box); }
    });
  });
  // keep the poster in step when the visitor switches EN / ไทย
  if (window.MutationObserver) {
    new MutationObserver(function () { boxes.forEach(syncPoster); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }
  document.querySelectorAll("[data-learn-play]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var box = document.querySelector(btn.getAttribute("data-learn-play"));
      if (!box) return;
      box.scrollIntoView({ behavior: "smooth", block: "center" });
      play(box);
    });
  });
})();
