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

  /* Intents that book a held slot, mapped to the tenant's booking type in the
     contact center. Hours, closed days and capacity live there, not here. */
  var BOOKING_TYPE = { viewing: "showroom_viewing" };

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
      err: "Sorry, that didn’t send. Please call 02-030-3883 or message LINE @zound and we’ll pick it up right away.",
      req: "Please add your name and either an email or a phone number.",
      pickDay: "Pick a day", pickTime: "Pick a time", tz: "Showroom time (Bangkok)",
      needSlot: "Please choose a day and a time for your visit.",
      needBoth: "For a viewing please leave both a phone number and an email \u2014 we call to confirm and send the confirmation by email.",
      loading: "Loading available times\u2026",
      gridErr: "We couldn\u2019t load the calendar just now. Send your details anyway and we\u2019ll call to agree a time \u2014 or call 02-030-3883.",
      noSlots: "No times are open over the next few weeks. Send your details and we\u2019ll call you.",
      full: "Taken",
      taken: "Sorry \u2014 that time has just been taken. Please choose another.",
      slotGone: "That time is no longer available. Please choose another.",
      limited: "We\u2019ve already received several requests from this connection. Please call 02-030-3883 or message LINE @zound.",
      okBooked: "You\u2019re booked in for {s} \u2014 reference {r}. Someone will call you shortly to confirm, and a confirmation email is on its way.",
      refLine: "Your booking reference: {r}",
      unnotified: "If you haven\u2019t heard from us within a working day, call 02-030-3883 and quote {r}.",
      manage: { t: "Your booking", s: "", l: "Change the time or cancel below." },
      lookingUp: "Finding your booking\u2026",
      notFound: "We couldn\u2019t find this booking \u2014 the link may be incomplete. Please call 02-030-3883 or message LINE @zound.",
      refLabel: "Reference",
      mstatus: { requested: "Waiting for our confirmation call", confirmed: "Confirmed", cancelled: "Cancelled",
                 expired: "Expired", completed: "Completed", no_show: "Missed" },
      newTime: "Choose a new time", moveIt: "Move my booking", back: "Back",
      cancelIt: "Cancel booking", cancelAsk: "Cancel this booking? The time will be given to someone else.",
      cancelYes: "Yes, cancel it", keep: "Keep my booking",
      movedOk: "Done \u2014 your booking is now {s}. Someone will call you shortly to confirm it, and we\u2019ve emailed you the new time.",
      cancelOk: "Your booking is cancelled. We\u2019ve emailed you a confirmation.",
      tooLate: "Your visit is too close to change online. Please call 02-030-3883 or message LINE @zound.",
      noChange: "This booking can\u2019t be changed online any more. Call 02-030-3883 if you need anything."
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
      err: "ขออภัย ส่งไม่สำเร็จ กรุณาโทร 02-030-3883 หรือทักไลน์ @zound แล้วเราจะดูแลให้ทันที",
      req: "กรุณากรอกชื่อ และอีเมลหรือเบอร์โทรอย่างน้อยหนึ่งอย่าง",
      pickDay: "เลือกวัน", pickTime: "เลือกเวลา", tz: "เวลาโชว์รูม (กรุงเทพฯ)",
      needSlot: "กรุณาเลือกวันและเวลาที่สะดวกเข้าชม",
      needBoth: "สำหรับนัดชมโชว์รูม กรุณากรอกทั้งเบอร์โทรและอีเมล เพราะเราจะโทรยืนยันและส่งอีเมลยืนยันให้",
      loading: "กำลังโหลดเวลาที่ว่าง\u2026",
      gridErr: "ขออภัย ตอนนี้โหลดปฏิทินไม่ได้ ฝากรายละเอียดไว้ได้เลย แล้วเราจะโทรนัดเวลากับคุณ หรือโทร 02-030-3883",
      noSlots: "ช่วงไม่กี่สัปดาห์ข้างหน้ายังไม่มีเวลาว่าง ฝากรายละเอียดไว้ แล้วเราจะโทรหาคุณ",
      full: "เต็ม",
      taken: "ขออภัย เวลานี้เพิ่งมีคนจองไปแล้ว กรุณาเลือกเวลาอื่น",
      slotGone: "เวลานี้ไม่ว่างแล้ว กรุณาเลือกเวลาอื่น",
      limited: "เราได้รับคำขอจากการเชื่อมต่อนี้หลายครั้งแล้ว กรุณาโทร 02-030-3883 หรือทักไลน์ @zound",
      okBooked: "จองเรียบร้อยแล้วสำหรับ {s} รหัสการจอง {r} เจ้าหน้าที่จะโทรยืนยันกับคุณเร็ว ๆ นี้ พร้อมส่งอีเมลยืนยันตามไปด้วย",
      refLine: "รหัสการจองของคุณ: {r}",
      unnotified: "หากยังไม่ได้รับการติดต่อภายในหนึ่งวันทำการ กรุณาโทร 02-030-3883 แล้วแจ้งรหัส {r}",
      manage: { t: "การจองของคุณ", s: "", l: "เปลี่ยนเวลาหรือยกเลิกได้ด้านล่าง" },
      lookingUp: "กำลังค้นหาการจองของคุณ\u2026",
      notFound: "ไม่พบการจองนี้ ลิงก์อาจไม่ครบ กรุณาโทร 02-030-3883 หรือทักไลน์ @zound",
      refLabel: "รหัส",
      mstatus: { requested: "รอเจ้าหน้าที่โทรยืนยัน", confirmed: "ยืนยันแล้ว", cancelled: "ยกเลิกแล้ว",
                 expired: "หมดอายุ", completed: "เสร็จสิ้น", no_show: "ไม่ได้มาตามนัด" },
      newTime: "เลือกเวลาใหม่", moveIt: "ย้ายการจอง", back: "ย้อนกลับ",
      cancelIt: "ยกเลิกการจอง", cancelAsk: "ยกเลิกการจองนี้? เวลานี้จะเปิดให้คนอื่นจองได้",
      cancelYes: "ใช่ ยกเลิกเลย", keep: "เก็บการจองไว้",
      movedOk: "เรียบร้อย การจองของคุณย้ายไปเป็น {s} แล้ว เจ้าหน้าที่จะโทรยืนยันเร็ว ๆ นี้ และเราได้ส่งอีเมลแจ้งเวลาใหม่ให้แล้ว",
      cancelOk: "ยกเลิกการจองแล้ว เราได้ส่งอีเมลยืนยันให้คุณแล้ว",
      tooLate: "ใกล้เวลานัดเกินกว่าจะเปลี่ยนออนไลน์ได้ กรุณาโทร 02-030-3883 หรือทักไลน์ @zound",
      noChange: "การจองนี้ไม่สามารถเปลี่ยนแปลงออนไลน์ได้แล้ว หากต้องการความช่วยเหลือ โทร 02-030-3883"
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
      ".cc-st{margin-top:12px;font-size:.9rem;line-height:1.6;white-space:pre-line}" +
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
      ".cc-slot[disabled]{opacity:.38;cursor:not-allowed;text-decoration:line-through}" +
      ".cc-slot[disabled]:hover{border-color:rgba(28,24,19,.16)}" +
      ".cc-day.full{opacity:.45}" +
      ".cc-tz{color:#6F6559;font-size:.76rem;margin:0 0 10px}" +
      ".cc-none{color:#6F6559;font-size:.85rem;margin:0 0 8px}" +
      /* manage view: the booking card and its actions replace the contact fields */
      ".cc-ov.managing .cc-f>input,.cc-ov.managing .cc-f>textarea,.cc-ov.managing .cc-f>.cc-row{display:none}" +
      ".cc-sum{background:#fff;border:1px solid rgba(28,24,19,.12);border-radius:12px;padding:14px 16px;margin:0 0 14px;" +
      "display:grid;gap:3px;font-size:.92rem;line-height:1.5}" +
      ".cc-sum b{font-weight:600}.cc-sum span{color:#6F6559}" +
      ".cc-macts{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 6px}" +
      ".cc-ghost{font:inherit;font-weight:500;background:transparent;color:#1C1813;border:1px solid rgba(28,24,19,.25);" +
      "border-radius:100px;padding:11px 22px;cursor:pointer}" +
      ".cc-ghost:hover{border-color:#1C1813}" +
      ".cc-ghost.danger{color:#9C3B2E;border-color:rgba(156,59,46,.4)}";
    document.head.appendChild(css);

    modal = document.createElement("div");
    modal.className = "cc-ov";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML =
      '<div class="cc-box" data-lenis-prevent tabindex="-1">' +
        '<h3 data-cc-title></h3>' +
        '<p class="cc-lead" data-cc-lead></p>' +
        '<div class="cc-manage"></div>' +
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


  /* ---------- appointment slots ----------
     Served by the contact center: cc_booking_slots() returns the open grid
     with the capacity left in each slot, and cc_book() claims one atomically,
     so a slot one customer holds cannot be taken by another. The page renders
     what it is given and computes no availability of its own. */
  var REST = API_URL.replace(/\/functions\/v1\/?$/, "") + "/rest/v1/rpc/";
  var grid = null, gridState = "idle";          /* idle | loading | ready | error */
  var pickedDay = null, pickedSlot = null;      /* pickedSlot: { start, label, end, left } */

  function rpc(fn, args) {
    return fetch(REST + fn, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": ANON_KEY,
        "Authorization": "Bearer " + ANON_KEY
      },
      body: JSON.stringify(args)
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function dayOf(date) {
    return ((grid && grid.days) || []).filter(function (x) { return x.date === date; })[0] || null;
  }
  function hasRoom(day) { return day.slots.some(function (x) { return x.left > 0; }); }

  /* The booking type the calendar shows: the intent's, or the booking being
     rescheduled from a customer's private link. */
  var manage = null;   /* { ref, token, info, rescheduling, confirmingCancel } */
  function calType() {
    if (manage) return manage.rescheduling && manage.info ? manage.info.type.key : null;
    return BOOKING_TYPE[intent] || null;
  }

  function loadGrid() {
    var type = calType();
    if (!type) return;
    gridState = "loading";
    renderCal();
    rpc("cc_booking_slots", { p_public_key: PUBLIC_KEY, p_type: type })
      .then(function (j) {
        if (!j || !j.ok) throw new Error((j && j.reason) || "no grid");
        grid = j;
        gridState = "ready";
        /* keep the customer's choice only if it is still open */
        if (pickedSlot) {
          var day = dayOf(pickedDay), keep = null;
          if (day) keep = day.slots.filter(function (x) { return x.start === pickedSlot.start && x.left > 0; })[0];
          pickedSlot = keep || null;
        }
      })["catch"](function () {
        grid = null;
        gridState = "error";
      })["finally"](function () { renderCal(); });
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

  function slotText() {
    if (!pickedSlot || !pickedDay) return "";
    var day = new Date(pickedDay + "T12:00:00Z").toLocaleDateString(locale(),
      { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    return day + ", " + pickedSlot.label + "–" + pickedSlot.end;
  }

  function note(text) {
    var p = document.createElement("p");
    p.className = "cc-none";
    p.textContent = text;
    return p;
  }

  function renderSlots() {
    var wrap = modal.querySelector(".cc-slots"), d = L();
    wrap.innerHTML = "";
    var day = dayOf(pickedDay);
    if (!day) return;
    day.slots.forEach(function (x) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cc-slot" + (pickedSlot && pickedSlot.start === x.start ? " on" : "");
      b.textContent = x.label + "–" + x.end;
      if (x.left <= 0) {
        b.disabled = true;
        b.title = d.full;
        b.setAttribute("aria-label", x.label + " – " + d.full);
      } else {
        b.addEventListener("click", function () {
          pickedSlot = x;
          [].slice.call(wrap.children).forEach(function (o) { o.classList.remove("on"); });
          b.classList.add("on");
          status.textContent = ""; status.className = "cc-st";
        });
      }
      wrap.appendChild(b);
    });
  }

  function renderCal() {
    if (!modal) return;
    var cal = modal.querySelector(".cc-cal"), d = L();
    if (!calType()) { cal.classList.remove("on"); return; }
    cal.classList.add("on");
    modal.querySelector("[data-cc-dayhead]").textContent = d.pickDay;
    modal.querySelector("[data-cc-timehead]").textContent = d.pickTime;
    modal.querySelector("[data-cc-tz]").textContent = d.tz;

    var days = modal.querySelector(".cc-days"), slots = modal.querySelector(".cc-slots");
    days.innerHTML = "";
    slots.innerHTML = "";
    if (gridState === "loading" || gridState === "idle") { slots.appendChild(note(d.loading)); return; }
    if (gridState === "error" || !grid) { slots.appendChild(note(d.gridErr)); return; }
    if (!grid.days.length) { slots.appendChild(note(d.noSlots)); return; }

    if (!dayOf(pickedDay)) {
      pickedDay = (grid.days.filter(hasRoom)[0] || grid.days[0]).date;
      pickedSlot = null;
    }
    grid.days.forEach(function (x) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cc-day" + (x.date === pickedDay ? " on" : "") + (hasRoom(x) ? "" : " full");
      b.innerHTML = "<small>" + wdLabel(x.date) + "</small><b>" + x.date.slice(8) + "</b>";
      b.addEventListener("click", function () {
        pickedDay = x.date;
        pickedSlot = null;
        [].slice.call(days.children).forEach(function (o) { o.classList.remove("on"); });
        b.classList.add("on");
        renderSlots();
        status.textContent = ""; status.className = "cc-st";
      });
      days.appendChild(b);
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
      '<a href="tel:+6620303883">02-030-3883</a> &nbsp;·&nbsp; <a href="' + LINE_URL + '" target="_blank" rel="noopener">LINE @zound</a>' +
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
    pickedSlot = null;
    manage = null;
    build();
    modal.classList.remove("managing");
    modal.querySelector(".cc-manage").innerHTML = "";
    paint();
    if (BOOKING_TYPE[intent]) loadGrid();
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

  function setStatus(text, kind) {
    status.textContent = text;
    status.className = "cc-st" + (kind ? " " + kind : "");
  }

  function notifyCenter(body) {
    return fetch(API_URL + "/cc-form", {
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
    });
  }

  /* Booking intents claim the slot first and only then notify the contact
     center, carrying the booking reference. If that notification fails after
     a successful claim the slot is still held, so the customer gets their
     reference and a fallback rather than an error. If the calendar itself
     could not load, the request still goes through — flagged for the team as
     having no slot held — because a lead is worth more than a dead form. */
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
    if (!body.name || (!body.email && !body.phone)) { setStatus(d.req, "err"); return; }
    /* where this visitor came from (consent.js); shown to the team as "Lead source" */
    if (window.ZoundTrack && window.ZoundTrack.source) body.source = window.ZoundTrack.source();

    var type = BOOKING_TYPE[intent];
    var booking = !!type && gridState === "ready";
    if (type) {
      var need = (grid && grid.type) || { require_phone: true, require_email: true };
      if ((need.require_phone && !body.phone) || (need.require_email && !body.email)) {
        setStatus(d.needBoth, "err"); return;
      }
    }
    if (booking && !pickedSlot) { setStatus(d.needSlot, "err"); return; }

    var slot = booking ? slotText() : "";
    btn.disabled = true; btn.textContent = d.sending;
    setStatus("");

    var claim = booking
      ? rpc("cc_book", {
          p_public_key: PUBLIC_KEY,
          p_type: type,
          p_starts_at: pickedSlot.start,
          p_name: body.name,
          p_email: body.email,
          p_phone: body.phone,
          p_note: body.message || null,
          p_language: body.language
        }).then(function (j) {
          if (!j || !j.ok) {
            var err = new Error("booking refused");
            err.reason = (j && j.reason) || "unknown";
            throw err;
          }
          return j;
        })
      : Promise.resolve(null);

    claim.then(function (bk) {
      var ref = bk && bk.ref;
      if (bk) {
        body.subject = body.subject + " — " + slot + " — " + ref;
        body.message = "Booking " + ref + " — slot held: " + slot + " (" + grid.type.tz + ")\n" +
                       "Customer was told: we will call to confirm and send an email confirmation." +
                       (body.message ? "\n\n" + body.message : "");
      } else if (type) {
        body.message = "Live calendar unavailable — no slot was held. Please call to agree a time." +
                       (body.message ? "\n\n" + body.message : "");
      }
      return notifyCenter(body).then(function (j) {
        return { ref: ref, reply: j && j.reply };
      }, function (err) {
        if (ref) return { ref: ref, reply: null, unnotified: true };
        throw err;
      });
    }).then(function (res) {
      var msg;
      if (res.ref) {
        msg = res.reply
          ? res.reply + "\n\n" + d.refLine.replace("{r}", res.ref)
          : d.okBooked.replace("{s}", slot).replace("{r}", res.ref);
        if (res.unnotified) msg += "\n\n" + d.unnotified.replace("{r}", res.ref);
      } else {
        msg = res.reply || d.ok;
      }
      setStatus(msg, "ok");
      /* lets consent.js count a booked viewing or a sent enquiry */
      try {
        document.dispatchEvent(new CustomEvent("zound:lead", {
          detail: { kind: res.ref ? "viewing" : "enquiry", intent: intent, ref: res.ref || null }
        }));
      } catch (x) {}
      form.reset();
      pickedSlot = null;
      if (booking) loadGrid();
      try { status.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (x) {}
    })["catch"](function (err) {
      var r = err && err.reason;
      if (r === "taken") {
        setStatus(d.taken, "err"); pickedSlot = null; loadGrid();
      } else if (r === "rate_limited") {
        setStatus(d.limited, "err");
      } else if (r === "contact_required") {
        setStatus(d.needBoth, "err");
      } else if (r) {
        setStatus(d.slotGone, "err"); pickedSlot = null; loadGrid();
      } else {
        setStatus(d.err, "err");
      }
    })["finally"](function () {
      btn.disabled = false; btn.textContent = d.send;
    });
  }


  /* ---------- a customer's own booking: reschedule or cancel ----------
     Opened from the private link in every booking email
     (?bk=<ref>&bt=<token>). The token is checked by the contact center; this
     page only renders what cc_booking_lookup returns and calls
     cc_booking_reschedule_self / cc_booking_cancel_self. */
  function esc(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function whenText(i) {
    var tz = i.type.tz, loc = locale();
    var day = new Intl.DateTimeFormat(loc, { timeZone: tz, weekday: "short", day: "numeric", month: "short", year: "numeric" })
      .format(new Date(i.starts_at));
    var t = new Intl.DateTimeFormat(loc, { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false });
    return day + ", " + t.format(new Date(i.starts_at)) + "–" + t.format(new Date(i.ends_at));
  }

  function button(label, cls, onClick) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  function renderManage(msg) {
    var box = modal.querySelector(".cc-manage"), d = L(), i = manage && manage.info;
    box.innerHTML = "";
    if (!i) { box.appendChild(note(msg || d.lookingUp)); renderCal(); return; }

    var th = document.documentElement.lang === "th";
    var label = (th && i.type.label_th) || i.type.label_en;
    box.innerHTML =
      '<div class="cc-sum"><b>' + esc(label) + "</b><span>" + esc(whenText(i)) + "</span><span>" +
      esc((d.mstatus[i.status] || i.status) + " · " + d.refLabel + " " + i.ref) + "</span></div>";

    var acts = document.createElement("div");
    acts.className = "cc-macts";
    var active = i.status === "requested" || i.status === "confirmed";

    if (manage.rescheduling) {
      acts.appendChild(button(d.moveIt, "cc-send", reschedule));
      acts.appendChild(button(d.back, "cc-ghost", function () {
        manage.rescheduling = false; pickedSlot = null; setStatus(""); renderManage();
      }));
    } else if (manage.confirmingCancel) {
      box.appendChild(note(d.cancelAsk));
      acts.appendChild(button(d.cancelYes, "cc-send", cancelBooking));
      acts.appendChild(button(d.keep, "cc-ghost", function () { manage.confirmingCancel = false; renderManage(); }));
    } else {
      if (i.can_reschedule) {
        acts.appendChild(button(d.newTime, "cc-send", function () {
          manage.rescheduling = true; pickedSlot = null; setStatus(""); renderManage(); loadGrid();
        }));
      }
      if (i.can_cancel) {
        acts.appendChild(button(d.cancelIt, "cc-ghost danger", function () {
          manage.confirmingCancel = true; setStatus(""); renderManage();
        }));
      }
      if (active && !i.can_reschedule && !i.can_cancel) box.appendChild(note(d.tooLate));
      else if (!active) box.appendChild(note(d.noChange));
    }
    box.appendChild(acts);
    renderCal();
  }

  function refreshBooking(then) {
    rpc("cc_booking_lookup", { p_ref: manage.ref, p_token: manage.token })
      .then(function (j) {
        manage.info = j && j.ok ? j : null;
        renderManage(manage.info ? null : L().notFound);
        if (then) then();
      })["catch"](function () { renderManage(L().err); });
  }

  function reschedule() {
    var d = L();
    if (!pickedSlot) { setStatus(d.needSlot, "err"); return; }
    var slot = slotText();
    rpc("cc_booking_reschedule_self", { p_ref: manage.ref, p_token: manage.token, p_starts_at: pickedSlot.start })
      .then(function (j) {
        if (!j || !j.ok) {
          var r = (j && j.reason) || "";
          if (r === "taken") { setStatus(d.taken, "err"); pickedSlot = null; loadGrid(); }
          else if (r === "too_late") { setStatus(d.tooLate, "err"); }
          else { setStatus(d.slotGone, "err"); pickedSlot = null; loadGrid(); }
          return;
        }
        manage.rescheduling = false;
        pickedSlot = null;
        refreshBooking(function () { setStatus(d.movedOk.replace("{s}", slot), "ok"); });
      })["catch"](function () { setStatus(d.err, "err"); });
  }

  function cancelBooking() {
    var d = L();
    rpc("cc_booking_cancel_self", { p_ref: manage.ref, p_token: manage.token })
      .then(function (j) {
        manage.confirmingCancel = false;
        if (!j || !j.ok) {
          setStatus((j && j.reason) === "too_late" ? d.tooLate : d.noChange, "err");
          renderManage();
          return;
        }
        refreshBooking(function () { setStatus(d.cancelOk, "ok"); });
      })["catch"](function () { setStatus(d.err, "err"); });
  }

  function openManage(ref, token) {
    intent = "manage";
    pickedSlot = null;
    manage = { ref: ref, token: token, info: null, rescheduling: false, confirmingCancel: false };
    build();
    modal.classList.add("managing");
    paint();
    modal.classList.add("open");
    modal.querySelector(".cc-box").scrollTop = 0;
    lenis(false);
    renderManage();
    refreshBooking();
  }

  /* ---------- wire the CTAs ----------
     Only intercepts once a key is configured; otherwise the button keeps its
     own href so phone and email still work. */
  function init() {
    if (!live) return;

    var qs = new URLSearchParams(location.search);
    var bk = qs.get("bk"), bt = qs.get("bt");
    if (bk && bt) {
      /* the link works like a key: keep it out of the address bar and history */
      qs.delete("bk");
      qs.delete("bt");
      try {
        var rest = qs.toString();
        history.replaceState(null, "", location.pathname + (rest ? "?" + rest : "") + location.hash);
      } catch (e) {}
      openManage(bk, bt);
    }

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
