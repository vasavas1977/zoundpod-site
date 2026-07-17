/* ============================================================
   ZOUND — ambient sound toggle
   A discreet luxury sound control: off by default (browsers
   block autoplay with audio), fades in/out gently, remembers
   the visitor's choice. Playback uses Web Audio for a truly
   gapless loop (an <audio loop> mp3 restarts with an audible
   gap); falls back to <audio> where Web Audio is unavailable.
   ============================================================ */
(function () {
  "use strict";

  var KEY = "zound-snd";
  var SRC = "assets/audio/ambient.mp3";
  var TARGET = 0.32;            // background level — present, never pushy
  var btn = document.getElementById("sndToggle");
  if (!btn) return;

  var AC = window.AudioContext || window.webkitAudioContext;

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

  function label(on) {
    var th = document.documentElement.lang === "th";
    btn.setAttribute("aria-label", on ? (th ? "ปิดเสียงบรรยากาศ" : "Turn ambient sound off")
                                      : (th ? "เปิดเสียงบรรยากาศ" : "Turn ambient sound on"));
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function markOn()  { btn.classList.add("playing");    label(true);  try { localStorage.setItem(KEY, "on");  } catch (e) {} }
  function markOff() { btn.classList.remove("playing"); label(false); try { localStorage.setItem(KEY, "off"); } catch (e) {} }

  function start() {
    if (AC) {
      waStart().then(markOn).catch(function () {
        // decode/HTTP failed — fall back to the <audio> element
        var p = ensureAudio().play();
        if (p && p.then) p.then(function () { fade(TARGET, 1800); markOn(); }).catch(function () {});
      });
    } else {
      var p = ensureAudio().play();
      if (p && p.then) p.then(function () { fade(TARGET, 1800); markOn(); }).catch(function () {});
    }
  }

  function stop() {
    if (AC && ctx) waStop(); else fade(0, 600, function () { ensureAudio().pause(); });
    markOff();
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
