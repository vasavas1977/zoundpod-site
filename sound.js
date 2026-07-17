/* ============================================================
   ZOUND — ambient sound toggle
   A discreet luxury sound control: off by default (browsers
   block autoplay with audio), fades in/out gently, remembers
   the visitor's choice. If sound was on last visit, it resumes
   on the first interaction anywhere on the page.
   ============================================================ */
(function () {
  "use strict";

  var KEY = "zound-snd";
  var TARGET = 0.32;            // background level — present, never pushy
  var btn = document.getElementById("sndToggle");
  if (!btn) return;

  var audio = null, fadeTimer = null;

  function ensure() {
    if (!audio) {
      audio = new Audio("assets/audio/ambient.mp3");
      audio.loop = true;
      audio.volume = 0;
      audio.preload = "none";
    }
    return audio;
  }

  function fade(to, ms, done) {
    var a = ensure();
    if (fadeTimer) clearInterval(fadeTimer);
    var from = a.volume, steps = Math.max(1, Math.round(ms / 50)), i = 0;
    fadeTimer = setInterval(function () {
      i++;
      a.volume = Math.max(0, Math.min(1, from + (to - from) * (i / steps)));
      if (i >= steps) { clearInterval(fadeTimer); fadeTimer = null; if (done) done(); }
    }, 50);
  }

  function label(on) {
    var th = document.documentElement.lang === "th";
    btn.setAttribute("aria-label", on ? (th ? "ปิดเสียงบรรยากาศ" : "Turn ambient sound off")
                                      : (th ? "เปิดเสียงบรรยากาศ" : "Turn ambient sound on"));
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function start() {
    var a = ensure();
    var p = a.play();
    if (p && p.then) {
      p.then(function () {
        fade(TARGET, 1800);
        btn.classList.add("playing");
        label(true);
        try { localStorage.setItem(KEY, "on"); } catch (e) {}
      }).catch(function () { /* autoplay refused — user can tap the toggle */ });
    }
  }

  function stop() {
    fade(0, 600, function () { ensure().pause(); });
    btn.classList.remove("playing");
    label(false);
    try { localStorage.setItem(KEY, "off"); } catch (e) {}
  }

  btn.addEventListener("click", function () {
    if (btn.classList.contains("playing")) stop(); else start();
  });
  label(false);

  // returning visitor with sound on: resume on first interaction anywhere
  var pref = null;
  try { pref = localStorage.getItem(KEY); } catch (e) {}
  if (pref === "on") {
    var arm = function (e) {
      document.removeEventListener("pointerdown", arm);
      document.removeEventListener("keydown", arm);
      if (e && e.target && btn.contains(e.target)) return; // let the button's own click handle it
      start();
    };
    document.addEventListener("pointerdown", arm);
    document.addEventListener("keydown", arm);
  }
})();
