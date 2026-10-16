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

  var PUBLIC_KEY = "";                                                         /* pk_… from the ZOUND tenant */
  var API_URL    = "https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1";
  var ANON_KEY   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXl2YmpsbHNhbnJucHpseWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MzkwNjksImV4cCI6MjA3NDUxNTA2OX0.EVJdlMp1i1chtGKxdQ66ysmC-iAGefvr9JFLlvzaC34";
  var LINE_URL   = "https://line.me/R/ti/p/@zound";

  var live = /^pk_/.test(PUBLIC_KEY);

  /* ---------- copy ---------- */
  var T = {
    en: {
      sales:    { t: "Talk to sales", s: "Sales enquiry",
                  l: "Tell us about your floor and we\u2019ll come back to you." },
      viewing:  { t: "Book a viewing", s: "Showroom viewing request",
                  l: "Leave your details and we\u2019ll confirm a time and send directions." },
      question: { t: "Ask a question", s: "Question",
                  l: "Ask us anything \u2014 sizes, acoustics, lead time, installation." },
      quote:    { t: "Get a free consultation", s: "Consultation request",
                  l: "Tell us about your space and we\u2019ll design the quiet around it." },
      name: "Your name", email: "Email", phone: "Phone", msg: "How can we help?",
      send: "Send", sending: "Sending…", close: "Close",
      ok: "Thank you — our team has your message and will come back to you shortly.",
      err: "Sorry, that didn’t send. Please call 1605 or message LINE @zound and we’ll pick it up right away.",
      req: "Please add your name and either an email or a phone number."
    },
    th: {
      sales:    { t: "ปรึกษาฝ่ายขาย", s: "สอบถามฝ่ายขาย",
                  l: "เล่าเรื่องพื้นที่ของคุณให้เราฟัง แล้วเราจะติดต่อกลับไป" },
      viewing:  { t: "นัดชมโชว์รูม", s: "ขอนัดชมโชว์รูม",
                  l: "ฝากรายละเอียดไว้ เราจะยืนยันเวลาและส่งแผนที่ให้" },
      question: { t: "สอบถามข้อมูล", s: "คำถาม",
                  l: "ถามได้ทุกเรื่อง ทั้งขนาด ค่าอะคูสติก ระยะเวลาผลิต และการติดตั้ง" },
      quote:    { t: "ขอคำปรึกษาฟรี", s: "ขอคำปรึกษา",
                  l: "เล่าเรื่องพื้นที่ของคุณให้เราฟัง แล้วเราจะออกแบบความเงียบให้พอดี" },
      name: "ชื่อของคุณ", email: "อีเมล", phone: "เบอร์โทร", msg: "ให้เราช่วยเรื่องอะไรดี?",
      send: "ส่ง", sending: "กำลังส่ง…", close: "ปิด",
      ok: "ขอบคุณครับ ทีมงานได้รับข้อความแล้ว และจะติดต่อกลับโดยเร็วที่สุด",
      err: "ขออภัย ส่งไม่สำเร็จ กรุณาโทร 1605 หรือทักไลน์ @zound แล้วเราจะดูแลให้ทันที",
      req: "กรุณากรอกชื่อ และอีเมลหรือเบอร์โทรอย่างน้อยหนึ่งอย่าง"
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
      ".cc-box{width:min(460px,100%);max-height:90vh;overflow:auto;background:#F6F2EA;border:1px solid rgba(28,24,19,.12);" +
      "border-radius:18px;padding:clamp(22px,4vw,34px);box-shadow:0 30px 80px -30px rgba(20,16,12,.5)}" +
      ".cc-box h3{font-family:'Fraunces',serif;font-weight:400;font-size:1.6rem;letter-spacing:-.01em;margin:0 0 6px;color:#1C1813}" +
      ".cc-box p.cc-lead{margin:0 0 18px;color:#6F6559;font-size:.92rem;line-height:1.6}" +
      ".cc-f{display:grid;gap:10px}" +
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
      ".cc-st.ok{color:#3F6B45}.cc-st.err{color:#9C3B2E}";
    document.head.appendChild(css);

    modal = document.createElement("div");
    modal.className = "cc-ov";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML =
      '<div class="cc-box">' +
        '<h3 data-cc-title></h3>' +
        '<p class="cc-lead" data-cc-lead></p>' +
        '<form class="cc-f" novalidate>' +
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
  }

  function open(which) {
    intent = which || "sales";
    build(); paint();
    modal.classList.add("open");
    setTimeout(function () { try { form.name.focus(); } catch (e) {} }, 40);
  }
  function close() { if (modal) modal.classList.remove("open"); }

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
      status.textContent = (j && j.reply) || d.ok;
      status.className = "cc-st ok";
      form.reset();
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
