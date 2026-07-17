/* ============================================================
   ZOUND — ambient music control
   A clearly-labeled "Play music" button in the header. Off by
   default (browsers block autoplay with audio), fades in/out
   gently, remembers the visitor's choice, and shows a live
   equalizer while playing. Playback uses Web Audio for a truly
   gapless loop (an <audio loop> mp3 restarts with an audible
   gap); falls back to <audio> where Web Audio is unavailable.
   ============================================================ */
(function () {
  "use strict";

  var KEY = "zound-snd";
  var SRC = "assets/audio/ambient.mp3";
  var TARGET = 0.32;            // background level — present, never pushy

  // every control on the page (header button, and any legacy corner button)
  var triggers = [].slice.call(document.querySelectorAll(".snd-head, .snd-toggle"));
  if (!triggers.length) return;

  var AC = window.AudioContext || window.webkitAudioContext;
  var playing = false;

  // Web Audio gives a truly gapless loop, but on mobile — especially iOS — it is
  // silenced by the hardware mute switch and unlocks less reliably on a tap. So on
  // mobile we play through an <audio> element instead: it uses the media channel,
  // which ignores the mute switch. (Desktop keeps the gapless Web Audio path.)
  var isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
              (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isMobile = isIOS || /Android/i.test(navigator.userAgent) ||
                 (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  var useWA = !!AC && !isMobile;
  // let iOS Safari 16.4+ route audio through the media channel even with mute on
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}

  /* ---- Web Audio path: gapless loop ---- */
  var ctx = null, gain = null, srcNode = null, buffer = null, loading = null;

  function loadBuffer() {
    if (buffer) return Promise.resolve(buffer);
    if (loading) return loading;
    loading = fetch(SRC)
      .then(function (r) { if (!r.ok) throw new Error("fetch " + r.status); return r.arrayBuffer(); })
      .then(function (ab) {
        return new Promise(function (res, rej) { ctx.decodeAudioData(ab, res, rej); });
      })
      .then(function (buf) { buffer = buf; return buf; });
    return loading;
  }

  function waStart() {
    if (!ctx) { ctx = new AC(); gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination); }
    var resume = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
    return resume.then(loadBuffer).then(function (buf) {
      if (srcNode) { try { srcNode.stop(); } catch (e) {} srcNode.disconnect(); }
      srcNode = ctx.createBufferSource();
      srcNode.buffer = buf;
      srcNode.loop = true;
      // trim mp3 encoder padding at the edges so the loop restart is seamless
      srcNode.loopStart = 0.02;
      srcNode.loopEnd = Math.max(0.1, buf.duration - 0.05);
      srcNode.connect(gain);
      srcNode.start(0, srcNode.loopStart);
      var t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(TARGET, t + 1.8);
    });
  }

  function waStop() {
    if (!ctx || !srcNode) return;
    var t = ctx.currentTime, node = srcNode;
    srcNode = null;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.6);
    setTimeout(function () { try { node.stop(); } catch (e) {} node.disconnect(); }, 700);
  }

  /* ---- <audio> fallback (no Web Audio) ---- */
  var audio = null, fadeTimer = null;
  function ensureAudio() {
    if (!audio) { audio = new Audio(SRC); audio.loop = true; audio.volume = 0; audio.preload = "none"; }
    return audio;
  }
  function fade(to, ms, done) {
    var a = ensureAudio();
    if (fadeTimer) clearInterval(fadeTimer);
    var from = a.volume, steps = Math.max(1, Math.round(ms / 50)), i = 0;
    fadeTimer = setInterval(function () {
      i++;
      a.volume = Math.max(0, Math.min(1, from + (to - from) * (i / steps)));
      if (i >= steps) { clearInterval(fadeTimer); fadeTimer = null; if (done) done(); }
    }, 50);
  }

  /* ---- UI: label + state, in the current language ---- */
  function render() {
    var th = document.documentElement.lang === "th";
    triggers.forEach(function (el) {
      el.classList.toggle("playing", playing);
      el.setAttribute("aria-pressed", playing ? "true" : "false");
      var lbl = playing
        ? (th ? (el.getAttribute("data-stop-th") || "หยุดเพลง") : (el.getAttribute("data-stop-en") || "Pause music"))
        : (th ? (el.getAttribute("data-play-th") || "เปิดเพลง") : (el.getAttribute("data-play-en") || "Play music"));
      el.setAttribute("aria-label", lbl);
      var txt = el.querySelector(".snd-head-txt");
      if (txt) txt.textContent = lbl;
    });
  }

  function markOn()  { playing = true;  render(); try { localStorage.setItem(KEY, "on");  } catch (e) {} }
  function markOff() { playing = false; render(); try { localStorage.setItem(KEY, "off"); } catch (e) {} }

  // <audio> element playback — the mobile-safe path (media channel, ignores mute)
  function elementPlay() {
    var a = ensureAudio();
    a.volume = 0;                       // fade target where supported (iOS ignores → device volume)
    var p = a.play();
    if (p && p.then) p.then(function () { fade(TARGET, 1800); markOn(); }).catch(function () { /* blocked */ });
    else { markOn(); }
  }

  function start() {
    if (useWA) waStart().then(markOn).catch(elementPlay);   // desktop: gapless, fall back to element
    else elementPlay();                                     // mobile: element straight away
  }

  function stop() {
    if (useWA && ctx) waStop(); else fade(0, 600, function () { ensureAudio().pause(); });
    markOff();
  }

  triggers.forEach(function (el) {
    el.addEventListener("click", function () { if (playing) stop(); else start(); });
  });
  render();

  // keep the label in the right language when the visitor switches EN/ไทย
  if (window.MutationObserver) {
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }

  // returning visitor with music on: resume on the first interaction anywhere
  var pref = null;
  try { pref = localStorage.getItem(KEY); } catch (e) {}
  if (pref === "on") {
    var arm = function (e) {
      document.removeEventListener("pointerdown", arm);
      document.removeEventListener("keydown", arm);
      // if they clicked a control, let its own handler run instead
      if (e && e.target && triggers.some(function (tr) { return tr.contains(e.target); })) return;
      start();
    };
    document.addEventListener("pointerdown", arm);
    document.addEventListener("keydown", arm);
  }
})();
