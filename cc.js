/* ============================================================
   ZOUND → Mobile11 Contact Center
   Routes every enquiry CTA into the contact center and mounts the chat
   widget. Both need ZOUND's own tenant key; until PUBLIC_KEY is filled in
   the CTAs fall through to their href (phone / email), so nothing reaches a
   wrong queue and nothing is dead in the meantime.
   To switch on: paste ZOUND's public_widget_key into PUBLIC_KEY below.
   ============================================================ */
(function () {
  "use strict";

  var PUBLIC_KEY = "pk_6dc18c61c18f45f481fa040436e5054a";                                        /* pk_… from the ZOUND tenant */
  var API_URL    = "https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1";
  var ANON_KEY   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXl2YmpsbHNhbnJucHpseWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MzkwNjksImV4cCI6MjA3NDUxNTA2OX0.EVJdlMp1i1chtGKxdQ66ysmC-iAGefvr9JFLlvzaC34";
  var LINE_URL   = "https://line.me/R/ti/p/@zound";

  /* Showroom viewing slots. No opening hours are published on the site, so
     these are an assumption: Mon–Sat, one-hour slots from 10:00 to 18:00,
     Bangkok time. Change SLOT_START/SLOT_END/CLOSED_DAYS to correct them. */
  var SLOT_START  = 10;        /* first slot begins 10:00 */
  var SLOT_END    = 18;        /* last slot ends 18:00 */
  var CLOSED_DAYS = [0];       /* 0 = Sunday */
  var DAYS_AHEAD  = 21;
  var TZ          = "Asia/Bangkok";

  var live = /^pk_/.test(PUBLIC_KEY);

  /* ---------- copy ---------- */
  var T = {
    en: {
      sales:    { t: "Talk to sales", s: "Sales enquiry",
                  l: "Tell us about your floor and we\u2019ll come back to you." },
      viewing:  { t: "Book a viewing", s: "Showroom viewing request",
                  l: "Pick a time that suits you. We\u2019ll call to confirm it and email you the confirmation and directions." },
      question: { t: "Ask a question", s: "Question",
                  l: "Ask us anything \u2014 sizes, acoustics, lead time, installation." },
      quote:    { t: "Get a free consultation", s: "Consultation request",
                  l: "Tell us about your space and we\u2019ll design the quiet around it." },
      name: "Your name", email: "Email", phone: "Phone", msg: "How can we help?",
      send: "Send", sending: "Sending…", close: "Close",
      ok: "Thank you — our team has your message and will come back to you shortly.",
      err: "Sorry, that didn’t send. Please call 1605 or message LINE @zound and we’ll pick it up right away.",
      req: "Please add your name and either an email or a phone number.",
      pickDay: "Pick a day", pickTime: "Pick a time", tz: "Showroom time (Bangkok)",
      needSlot: "Please choose a day and a time for your visit.",
      needBoth: "For a viewing please leave both a phone number and an email \u2014 we call to confirm and send the confirmation by email.",
      okSlot: "Thank you \u2014 we have your request for {s}. Someone will call you shortly to confirm, and a confirmation email is on its way."
    },
    th: {
      sales:    { t: "ปรึกษาฝ่ายขาย", s: "สอบถามฝ่ายขาย",
                  l: "เล่าเรื่องพื้นที่ของคุณให้เราฟัง แล้วเราจะติดต่อกลับไป" },
      viewing:  { t: "นัดชมโชว์รูม", s: "ขอนัดชมโชว์รูม",
                  l: "เลือกเวลาที่คุณสะดวก เราจะโทรยืนยันและส่งอีเมลยืนยันพร้อมแผนที่ให้" },
      question: { t: "สอบถามข้อมูล", s: "คำถาม",
                  l: "ถามได้ทุกเรื่อง ทั้งขนาด ค่าอะคูสติก ระยะเวลาผลิต และการติดตั้ง" },
      quote:    { t: "ขอคำปรึกษาฟรี", s: "ขอคำปรึกษา",
                  l: "เล่าเรื่องพื้นที่ของคุณให้เราฟัง แล้วเราจะออกแบบความเงียบให้พอดี" },
      name: "ชื่อของคุณ", email: "อีเมล", phone: "เบอร์โทร", msg: "ให้เราช่วยเรื่องอะไรดี?",
      send: "ส่ง", sending: "กำลังส่ง…", close: "ปิด",
      ok: "ขอบคุณครับ ทีมงานได้รับข้อความแล้ว และจะติดต่อกลับโดยเร็วที่สุด",
      err: "ขออภัย ส่งไม่สำเร็จ กรุณาโทร 1605 หรือทักไลน์ @zound แล้วเราจะดูแลให้ทันที",
      req: "กรุณากรอกชื่อ และอีเมลหรือเบอร์โทรอย่างน้อยหนึ่งอย่าง",
      pickDay: "เลือกวัน", pickTime: "เลือกเวลา", tz: "เวลาโชว์รูม (กรุงเทพฯ)",
      needSlot: "กรุณาเลือกวันและเวลาที่สะดวกเข้าชม",
      needBoth: "สำหรับนัดชมโชว์รูม กรุณากรอกทั้งเบอร์โทรและอีเมล เพราะเราจะโทรยืนยันและส่งอีเมลยืนยันให้",
      okSlot: "ขอบคุณครับ เราได้รับคำขอเข้าชมวันที่ {s} แล้ว เจ้าหน้าที่จะโทรยืนยันกับคุณเร็ว ๆ นี้ พร้อมส่งอีเมลยืนยันตามไปด้วย"
    }
  };
  function L() { return document.documentElement.lang === "th" ? T.th : T.en; }

  /* ---------- modal ---------- */
  var modal, form, status, intent = "sales";

  function build() {
    if (modal) return;
    var css = document.createElement("style");
    css.textContent =
      ".cc-ov{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;" +
      "background:rgba(20,16,12,.55);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);padding:20px}" +
      ".cc-ov.open{display:flex}" +
      ".cc-box{width:min(460px,100%);max-height:90vh;overflow-y:auto;-webkit-overflow-scrolling:touch;" +
      "overscroll-behavior:contain;background:#F6F2EA;border:1px solid rgba(28,24,19,.12);" +
      "border-radius:18px;padding:clamp(22px,4vw,34px);box-shadow:0 30px 80px -30px rgba(20,16,12,.5)}" +
      ".cc-box h3{font-family:'Fraunces',serif;font-weight:400;font-size:1.6rem;letter-spacing:-.01em;margin:0 0 6px;color:#1C1813}" +
      ".cc-box p.cc-lead{margin:0 0 18px;color:#6F6559;font-size:.92rem;line-height:1.6}" +
      ".cc-f{display:grid;gap:10px}" +
      /* grid and flex children default to min-width:auto, which lets the slot
         grid and the day strip push the dialog wider than its own box */
      ".cc-f>*{min-width:0}.cc-cal,.cc-days,.cc-slots{min-width:0;max-width:100%}" +
      ".cc-f input,.cc-f textarea{font:inherit;font-size:.95rem;color:#1C1813;background:#fff;border:1px solid rgba(28,24,19,.16);" +
      "border-radius:10px;padding:12px 14px;width:100%}" +
      ".cc-f textarea{min-height:104px;resize:vertical}" +
      ".cc-f input:focus,.cc-f textarea:focus{outline:2px solid #B5613F;outline-offset:1px}" +
      ".cc-row{display:flex;gap:10px;align-items:center;margin-top:6px}" +
      ".cc-send{font:inherit;font-weight:500;background:#1C1813;color:#F4EFE7;border:1px solid #1C1813;border-radius:100px;" +
      "padding:12px 26px;cursor:pointer;transition:background .3s,border-color .3s}" +
      ".cc-send:hover{background:#B5613F;border-color:#B5613F}" +
      ".cc-send[disabled]{opacity:.6;cursor:default}" +
      ".cc-x{margin-left:auto;background:none;border:0;color:#6F6559;font:inherit;font-size:.9rem;cursor:pointer;padding:8px}" +
      ".cc-alt{margin-top:16px;padding-top:14px;border-top:1px solid rgba(28,24,19,.12);color:#6F6559;font-size:.85rem;line-height:1.7}" +
      ".cc-alt a{color:#1C1813}" +
      ".cc-st{margin-top:12px;font-size:.9rem;line-height:1.6}" +
      ".cc-st.ok{color:#3F6B45}.cc-st.err{color:#9C3B2E}" +
      ".cc-cal{display:none;margin-bottom:4px}.cc-cal.on{display:block}" +
      ".cc-cal h4{margin:2px 0 8px;font:inherit;font-size:.72rem;font-weight:700;letter-spacing:.14em;" +
      "text-transform:uppercase;color:#6F6559}" +
      ".cc-days{display:flex;gap:6px;overflow-x:auto;padding:2px 2px 8px;scrollbar-width:thin}" +
      ".cc-day{flex:0 0 auto;min-width:58px;padding:8px 6px;border:1px solid rgba(28,24,19,.16);border-radius:10px;" +
      "background:#fff;cursor:pointer;font:inherit;text-align:center;line-height:1.25;transition:background .2s,border-color .2s,color .2s}" +
      ".cc-day small{display:block;font-size:.66rem;letter-spacing:.08em;text-transform:uppercase;color:#6F6559}" +
      ".cc-day b{display:block;font-size:1.02rem;font-weight:500}" +
      ".cc-day:hover{border-color:#B5613F}" +
      ".cc-day.on{background:#1C1813;border-color:#1C1813;color:#F4EFE7}" +
      ".cc-day.on small{color:rgba(244,239,231,.72)}" +
      ".cc-slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:6px;margin-bottom:6px}" +
      ".cc-slot{padding:9px 4px;border:1px solid rgba(28,24,19,.16);border-radius:9px;background:#fff;cursor:pointer;" +
      "font:inherit;font-size:.86rem;transition:background .2s,border-color .2s,color .2s}" +
      ".cc-slot:hover{border-color:#B5613F}" +
      ".cc-slot.on{background:#B5613F;border-color:#B5613F;color:#fff}" +
      ".cc-tz{color:#6F6559;font-size:.76rem;margin:0 0 10px}" +
      ".cc-none{color:#6F6559;font-size:.85rem;margin:0 0 8px}";
    document.head.appendChild(css);

    modal = document.createElement("div");
    modal.className = "cc-ov";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML =
      '<div class="cc-box" data-lenis-prevent tabindex="-1">' +
        '<h3 data-cc-title></h3>' +
        '<p class="cc-lead" data-cc-lead></p>' +
        '<form class="cc-f" novalidate>' +
          '<div class="cc-cal">' +
            '<h4 data-cc-dayhead></h4><div class="cc-days"></div>' +
            '<h4 data-cc-timehead></h4><div class="cc-slots"></div>' +
            '<p class="cc-tz" data-cc-tz></p>' +
          '</div>' +
          '<input name="name" autocomplete="name" required />' +
          '<input name="email" type="email" autocomplete="email" />' +
          '<input name="phone" type="tel" autocomplete="tel" />' +
          '<textarea name="message"></textarea>' +
          '<div class="cc-row"><button class="cc-send" type="submit"></button>' +
          '<button class="cc-x" type="button"></button></div>' +
        '</form>' +
        '<p class="cc-st" role="status" aria-live="polite"></p>' +
        '<div class="cc-alt"></div>' +
      '</div>';
    document.body.appendChild(modal);

    form = modal.querySelector("form");
    status = modal.querySelector(".cc-st");
    modal.querySelector(".cc-x").addEventListener("click", close);
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("open")) close();
    });
    form.addEventListener("submit", submit);
  }


  /* ---------- viewing slots ----------
     A request, not a confirmed booking: there is no availability source, so
     the team confirms. Days and times are computed in Bangkok time so a
     visitor in another timezone is never offered a slot that has passed. */
  var pickedDay = null, pickedHour = null;

  function bkkParts(d) {
    var f = new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", hour12: false, weekday: "short"
    }).formatToParts(d).reduce(function (a, p) { a[p.type] = p.value; return a; }, {});
    return { iso: f.year + "-" + f.month + "-" + f.day, hour: parseInt(f.hour, 10), wd: f.weekday };
  }

  function dayList() {
    var now = new Date(), out = [];
    for (var i = 0; i < DAYS_AHEAD && out.length < 14; i++) {
      var d = new Date(now.getTime() + i * 86400000);
      var p = bkkParts(d);
      var dow = new Date(p.iso + "T12:00:00Z").getUTCDay();
      if (CLOSED_DAYS.indexOf(dow) !== -1) continue;
      var last = SLOT_END - 1;
      if (i === 0 && bkkParts(now).hour >= last) continue;   /* nothing left today */
      out.push({ iso: p.iso, dayNum: p.iso.slice(8), today: i === 0 });
    }
    return out;
  }

  function slotsFor(iso) {
    var out = [], nowP = bkkParts(new Date());
    for (var h = SLOT_START; h < SLOT_END; h++) {
      if (iso === nowP.iso && h <= nowP.hour) continue;        /* already past */
      out.push(h);
    }
    return out;
  }

  function locale() { return document.documentElement.lang === "th" ? "th-TH" : "en-GB"; }

  function wdLabel(iso) {
    /* Thai "short" weekdays are full words (เสาร์, จันทร์) and crowd the chip;
       the narrow form is the usual Thai calendar abbreviation. */
    var th = document.documentElement.lang === "th";
    return new Date(iso + "T12:00:00Z").toLocaleDateString(locale(), {
      weekday: th ? "narrow" : "short", timeZone: "UTC"
    });
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function slotLabel(h) { return pad(h) + ":00\u2013" + pad(h + 1) + ":00"; }

  function slotText() {
    if (!pickedDay || pickedHour === null) return "";
    var d = new Date(pickedDay + "T12:00:00Z");
    var day = d.toLocaleDateString(locale(),
      { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    return day + ", " + slotLabel(pickedHour);
  }

  function renderSlots() {
    var wrap = modal.querySelector(".cc-slots"), d = L();
    wrap.innerHTML = "";
    var hours = pickedDay ? slotsFor(pickedDay) : [];
    if (!hours.length) {
      var p = document.createElement("p");
      p.className = "cc-none"; p.textContent = d.pickDay;
      wrap.appendChild(p); return;
    }
    hours.forEach(function (h) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cc-slot" + (h === pickedHour ? " on" : "");
      b.textContent = slotLabel(h);
      b.addEventListener("click", function () {
        pickedHour = h;
        [].slice.call(wrap.children).forEach(function (o) { o.classList.remove("on"); });
        b.classList.add("on");
        status.textContent = ""; status.className = "cc-st";
      });
      wrap.appendChild(b);
    });
  }

  function renderCal() {
    var cal = modal.querySelector(".cc-cal"), d = L();
    if (intent !== "viewing") { cal.classList.remove("on"); return; }
    cal.classList.add("on");
    modal.querySelector("[data-cc-dayhead]").textContent = d.pickDay;
    modal.querySelector("[data-cc-timehead]").textContent = d.pickTime;
    modal.querySelector("[data-cc-tz]").textContent = d.tz;

    var days = dayList(), wrap = modal.querySelector(".cc-days");
    wrap.innerHTML = "";
    if (pickedDay && !days.some(function (x) { return x.iso === pickedDay; })) {
      pickedDay = null; pickedHour = null;
    }
    if (!pickedDay && days.length) { pickedDay = days[0].iso; }
    days.forEach(function (x) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cc-day" + (x.iso === pickedDay ? " on" : "");
      b.innerHTML = "<small>" + wdLabel(x.iso) + "</small><b>" + x.dayNum + "</b>";
      b.addEventListener("click", function () {
        pickedDay = x.iso; pickedHour = null;
        [].slice.call(wrap.children).forEach(function (o) { o.classList.remove("on"); });
        b.classList.add("on");
        renderSlots();
        status.textContent = ""; status.className = "cc-st";
      });
      wrap.appendChild(b);
    });
    renderSlots();
  }

  function paint() {
    var d = L(), k = d[intent] || d.sales;
    modal.querySelector("[data-cc-title]").textContent = k.t;
    modal.querySelector("[data-cc-lead]").textContent = k.l || d.msg;
    form.name.placeholder = d.name;
    form.email.placeholder = d.email;
    form.phone.placeholder = d.phone;
    form.message.placeholder = d.msg;
    modal.querySelector(".cc-send").textContent = d.send;
    modal.querySelector(".cc-x").textContent = d.close;
    modal.querySelector(".cc-alt").innerHTML =
      '<a href="tel:1605">1605</a> &nbsp;·&nbsp; <a href="' + LINE_URL + '" target="_blank" rel="noopener">LINE @zound</a>' +
      ' &nbsp;·&nbsp; <a href="mailto:contact@zoundpod.com">contact@zoundpod.com</a>';
    status.textContent = ""; status.className = "cc-st";
    renderCal();
  }

  function lenis(on) {
    var l = window.__lenis;
    if (!l) return;
    try { on ? l.start() : l.stop(); } catch (e) {}
  }

  function open(which) {
    intent = which || "sales";
    pickedHour = null;
    build(); paint();
    modal.classList.add("open");
    modal.querySelector(".cc-box").scrollTop = 0;
    lenis(false);
    setTimeout(function () { try { form.name.focus(); } catch (e) {} }, 40);
  }

  function close() {
    if (!modal) return;
    modal.classList.remove("open");
    lenis(true);
  }

  function submit(e) {
    e.preventDefault();
    var d = L(), btn = modal.querySelector(".cc-send");
    var body = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      subject: (d[intent] || d.sales).s,
      message: form.message.value.trim(),
      language: document.documentElement.lang === "th" ? "th" : "en"
    };
    if (!body.name || (!body.email && !body.phone)) {
      status.textContent = d.req; status.className = "cc-st err"; return;
    }
    var slot = "";
    if (intent === "viewing") {
      if (!body.phone || !body.email) {
        status.textContent = d.needBoth; status.className = "cc-st err"; return;
      }
      slot = slotText();
      if (!slot) { status.textContent = d.needSlot; status.className = "cc-st err"; return; }
      body.subject = body.subject + " \u2014 " + slot;
      body.message = "Requested viewing: " + slot + " (" + TZ + ")\n" +
                     "Customer was told: we will call to confirm and send an email confirmation." +
                     (body.message ? "\n\n" + body.message : "");
    }
    btn.disabled = true; btn.textContent = d.sending;
    status.textContent = ""; status.className = "cc-st";
    fetch(API_URL + "/cc-form", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cc-public-key": PUBLIC_KEY,
        "apikey": ANON_KEY,
        "Authorization": "Bearer " + ANON_KEY
      },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (j) {
      status.textContent = (j && j.reply) || (slot ? d.okSlot.replace("{s}", slot) : d.ok);
      status.className = "cc-st ok";
      form.reset();
      try { status.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) {}
    })["catch"](function () {
      status.textContent = d.err; status.className = "cc-st err";
    })["finally"](function () {
      btn.disabled = false; btn.textContent = d.send;
    });
  }

  /* ---------- wire the CTAs ----------
     Only intercepts once a key is configured; otherwise the button keeps its
     own href so phone and email still work. */
  function init() {
    if (!live) return;

    [].slice.call(document.querySelectorAll("[data-cc]")).forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        open(el.getAttribute("data-cc"));
      });
    });

    var s = document.createElement("script");
    s.src = "https://mobile11.com/embed/cc-widget.js";
    s.setAttribute("data-public-key", PUBLIC_KEY);
    s.setAttribute("data-api-url", API_URL);
    s.setAttribute("data-anon-key", ANON_KEY);
    s.setAttribute("data-title", document.documentElement.lang === "th" ? "แชทกับ ZOUND" : "Chat with ZOUND");
    s.setAttribute("data-accent", "#B5613F");
    s.setAttribute("data-line-url", LINE_URL);
    s.defer = true;
    document.body.appendChild(s);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }

  window.ZoundContact = { open: open, close: close, live: live };
})();
