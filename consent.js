/* ============================================================
   ZOUND — cookie consent (PDPA) + ad measurement
   Nothing in here sends data anywhere until the visitor accepts.
   Accepting loads the Google Ads tag, the Meta Pixel and the TikTok Pixel
   and counts LINE taps, call taps, sent enquiries and booked viewings.
   Declining loads none of them. The choice is kept in localStorage
   ("zp_consent") and can be changed from "Cookie settings" in the footer.
   A platform whose ID below is empty is simply skipped.
   ============================================================ */
(function () {
  "use strict";

  var CFG = {
    version: 1,
    googleAds: {
      id: "AW-11363342054",                     /* "ZOUNDPOD | …" actions */
      labels: { viewing: "bEp9CLn716MdEOatu6oq", enquiry: "oAa0CN_N2KMdEOatu6oq",
                line: "d-QdCOLN2KMdEOatu6oq", call: "uwlICOXN2KMdEOatu6oq" }
    },
    metaPixel: "393803552640034",               /* "Zoundme's Pixel", Zound ad account */
    tiktokPixel: ""                             /* pixel code */
  };

  var KEY = "zp_consent", SRC_KEY = "zp_src";
  var th = (document.documentElement.lang || "").slice(0, 2) === "th";

  var T = th ? {
    title: "เว็บไซต์นี้ใช้คุกกี้",
    body: "เราใช้คุกกี้ที่จำเป็นเพื่อให้เว็บไซต์ทำงาน และขอความยินยอมจากคุณก่อนใช้คุกกี้ด้านการตลาดของ Google, Meta และ TikTok เพื่อดูว่าโฆษณาใดพาคุณมาพบเรา และแสดงโฆษณาที่ตรงกับคุณมากขึ้น",
    policy: "นโยบายความเป็นส่วนตัว",
    accept: "ยอมรับ",
    decline: "ปฏิเสธ",
    settings: "ตั้งค่าคุกกี้",
    href: "/th/privacy"
  } : {
    title: "This site uses cookies",
    body: "We use essential cookies to make the site work. With your consent we also use marketing cookies from Google, Meta and TikTok, to see which ads bring you to us and to show you more relevant ones.",
    policy: "Privacy policy",
    accept: "Accept",
    decline: "Decline",
    settings: "Cookie settings",
    href: "/privacy"
  };

  /* ---------- stored choice ---------- */
  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "null");
      return v && v.v === CFG.version ? v : null;
    } catch (e) { return null; }
  }
  function save(marketing) {
    var c = { v: CFG.version, marketing: !!marketing, ts: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    return c;
  }

  /* ---------- where this visit came from ----------
     The campaign parameters and referrer of the first page in this browser
     session (a new ad click replaces them). Kept in sessionStorage only and
     sent nowhere on its own: cc.js attaches it to an enquiry the visitor
     chooses to send, so the team sees which ad it came from. */
  var SRC_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
                    "gclid", "gbraid", "wbraid", "fbclid", "ttclid"];
  (function captureSource() {
    try {
      var qs = new URLSearchParams(location.search), got = {}, ad = false;
      SRC_PARAMS.forEach(function (k) { var v = qs.get(k); if (v) { got[k] = v.slice(0, 300); ad = true; } });
      if (!ad && sessionStorage.getItem(SRC_KEY)) return;
      var ref = document.referrer && document.referrer.indexOf(location.origin) !== 0 ? document.referrer : "";
      if (ref) got.referrer = ref.slice(0, 300);
      got.landing = location.pathname;
      sessionStorage.setItem(SRC_KEY, JSON.stringify(got));
    } catch (e) {}
  })();
  /* in the shape the contact center's cc-form accepts as "source" */
  function source() {
    var s = {};
    try { s = JSON.parse(sessionStorage.getItem(SRC_KEY) || "{}") || {}; } catch (e) {}
    var out = {
      page_url: location.href.split("#")[0].slice(0, 600),
      page_path: location.pathname,
      page_title: (document.title || "").slice(0, 200)
    };
    ["referrer", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"]
      .forEach(function (k) { if (s[k]) out[k] = String(s[k]); });
    var host = "";
    try { host = s.referrer ? new URL(s.referrer).hostname.replace(/^www\./, "") : ""; } catch (e) {}
    out.label =
      (s.gclid || s.gbraid || s.wbraid) ? "Google Ads" :
      s.ttclid ? "TikTok ads" :
      s.utm_source ? s.utm_source + (s.utm_medium ? " / " + s.utm_medium : "") :
      s.fbclid ? "Facebook / Instagram" :
      host ? "Referral: " + host : "Direct";
    if (s.landing) out.label += " · landed on " + s.landing;
    return out;
  }

  /* ---------- the tags (loaded only after consent) ---------- */
  var loaded = false;
  function addScript(src) {
    var s = document.createElement("script");
    s.async = true; s.src = src;
    document.head.appendChild(s);
  }
  function loadTags() {
    if (loaded) return;
    loaded = true;

    if (CFG.googleAds.id) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag("consent", "default", {
        ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "denied"
      });
      window.gtag("js", new Date());
      window.gtag("config", CFG.googleAds.id);
      addScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CFG.googleAds.id));
    }

    if (CFG.metaPixel) {
      /* Meta's standard base code, unminified */
      if (!window.fbq) {
        var n = window.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!window._fbq) window._fbq = n;
        n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
        addScript("https://connect.facebook.net/en_US/fbevents.js");
      }
      window.fbq("init", CFG.metaPixel);
      window.fbq("track", "PageView");
    }

    if (CFG.tiktokPixel) {
      /* TikTok's standard base code, unminified */
      var name = "ttq";
      window.TiktokAnalyticsObject = name;
      var ttq = window[name] = window[name] || [];
      ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready",
                     "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
      ttq.setAndDefer = function (t, e) {
        t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); };
      };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function (t) {
        for (var e = ttq._i[t] || [], k = 0; k < ttq.methods.length; k++) ttq.setAndDefer(e, ttq.methods[k]);
        return e;
      };
      ttq.load = function (e, opts) {
        var u = "https://analytics.tiktok.com/i18n/pixel/events.js";
        ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = u;
        ttq._t = ttq._t || {}; ttq._t[e] = +new Date();
        ttq._o = ttq._o || {}; ttq._o[e] = opts || {};
        addScript(u + "?sdkid=" + encodeURIComponent(e) + "&lib=" + name);
      };
      ttq.load(CFG.tiktokPixel);
      ttq.page();
    }
  }

  /* ---------- the events we count ---------- */
  var META_EVENT = { viewing: "Schedule", enquiry: "Lead", line: "Contact", call: "Contact" };
  var TT_EVENT   = { viewing: "SubmitForm", enquiry: "SubmitForm", line: "Contact", call: "Contact" };

  function track(kind) {
    var c = read();
    if (!c || !c.marketing || !loaded) return;
    var label = CFG.googleAds.labels[kind];
    if (window.gtag && CFG.googleAds.id && label) {
      window.gtag("event", "conversion", { send_to: CFG.googleAds.id + "/" + label, transport_type: "beacon" });
    }
    if (window.fbq && CFG.metaPixel) window.fbq("track", META_EVENT[kind], { content_name: kind });
    if (window.ttq && CFG.tiktokPixel) window.ttq.track(TT_EVENT[kind], { content_name: kind });
  }

  /* Taps on LINE and phone links. Buttons that open the booking form also carry
     a tel: href as a fallback (data-cc), so those are not counted as calls. */
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || a.hasAttribute("data-cc")) return;
    var h = a.getAttribute("href") || "";
    if (/^tel:/i.test(h)) track("call");
    else if (/(^|\/\/)(line\.me|lin\.ee)\//i.test(h)) track("line");
  }, true);

  /* cc.js fires this when an enquiry is sent or a viewing is booked */
  document.addEventListener("zound:lead", function (e) {
    track(e.detail && e.detail.kind === "viewing" ? "viewing" : "enquiry");
  });

  /* ---------- the banner ---------- */
  var bar;
  function css() {
    var s = document.createElement("style");
    s.textContent =
      ".zp-cc{position:fixed;left:0;right:0;bottom:0;z-index:2147482000;display:flex;justify-content:center;" +
      "padding:0 max(12px,env(safe-area-inset-right,0px)) calc(12px + env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px));pointer-events:none}" +
      ".zp-cc[hidden]{display:none}" +
      ".zp-box{pointer-events:auto;width:min(720px,100%);background:#F6F2EA;color:#1C1813;border:1px solid rgba(28,24,19,.14);" +
      "border-radius:16px;box-shadow:0 24px 60px -28px rgba(20,16,12,.55);padding:16px 18px;display:grid;gap:12px;" +
      "font:14px/1.55 'Inter','Noto Sans Thai',system-ui,sans-serif}" +
      ".zp-box b{font-weight:600;font-size:15px}" +
      ".zp-box p{margin:0;color:#4a433b}" +
      ".zp-box a{color:#B5613F}" +
      ".zp-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}" +
      ".zp-btn{appearance:none;border:1px solid #1C1813;border-radius:999px;padding:9px 20px;font:inherit;font-weight:600;cursor:pointer;" +
      "background:#1C1813;color:#F6F2EA;min-width:7.5em}" +
      ".zp-btn.zp-ghost{background:transparent;color:#1C1813}" +
      ".zp-btn:focus-visible,.zp-box a:focus-visible{outline:2px solid #B5613F;outline-offset:2px}" +
      ".zp-foot{cursor:pointer}";
    document.head.appendChild(s);
  }
  function buildBar() {
    if (bar) return bar;
    css();
    bar = document.createElement("div");
    bar.className = "zp-cc";
    bar.hidden = true;
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", T.title);
    bar.innerHTML =
      '<div class="zp-box">' +
        "<div><b>" + T.title + "</b>" +
        "<p>" + T.body + ' <a href="' + T.href + '">' + T.policy + "</a></p></div>" +
        '<div class="zp-row">' +
          '<button type="button" class="zp-btn" data-zp="accept">' + T.accept + "</button>" +
          '<button type="button" class="zp-btn zp-ghost" data-zp="decline">' + T.decline + "</button>" +
        "</div>" +
      "</div>";
    bar.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-zp]");
      if (!b) return;
      var yes = b.getAttribute("data-zp") === "accept";
      var before = read();
      save(yes);
      bar.hidden = true;
      if (yes) loadTags();
      /* tags that already ran cannot be unloaded: a reload starts the page clean */
      else if (loaded || (before && before.marketing)) location.reload();
    });
    document.body.appendChild(bar);
    return bar;
  }
  function openBar() { buildBar().hidden = false; }

  /* "Cookie settings" + privacy link in every footer */
  function footerLinks() {
    var f = document.querySelector("footer .foot-meta") || document.querySelector("footer");
    if (!f || f.querySelector("[data-consent-open]")) return;
    var p = document.createElement("a");
    p.href = T.href; p.textContent = T.policy;
    var s = document.createElement("a");
    s.href = "#"; s.className = "zp-foot"; s.textContent = T.settings;
    s.setAttribute("data-consent-open", "");
    f.appendChild(p); f.appendChild(s);
  }
  document.addEventListener("click", function (e) {
    var o = e.target.closest && e.target.closest("[data-consent-open]");
    if (!o) return;
    e.preventDefault();
    openBar();
  });

  function start() {
    footerLinks();
    var c = read();
    if (!c) openBar();
    else if (c.marketing) loadTags();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();

  window.ZoundTrack = { source: source, open: openBar, track: track };
})();
