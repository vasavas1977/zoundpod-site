/* ZOUND — "Learn with ZOUND" explainer: click-to-play YouTube (no YouTube code loads until the visitor asks).
   Pauses the site's ambient music while the video plays. */
(function () {
  "use strict";
  function play(box) {
    if (box.classList.contains("playing")) return;
    var id = box.getAttribute("data-yt");
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
  document.querySelectorAll("[data-yt]").forEach(function (box) {
    box.addEventListener("click", function () { play(box); });
    box.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(box); }
    });
  });
  document.querySelectorAll("[data-learn-play]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var box = document.querySelector(btn.getAttribute("data-learn-play"));
      if (!box) return;
      box.scrollIntoView({ behavior: "smooth", block: "center" });
      play(box);
    });
  });
})();
