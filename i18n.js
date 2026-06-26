/* ============================================================
   ZOUND — EN / TH language toggle
   English is captured live from the DOM (never altered).
   Thai is written in an Apple-style register: concise, confident,
   benefit-led. Toggle persists in localStorage. Default: EN.
   ============================================================ */
(function () {
  "use strict";

  var EN_TITLE = document.title;
  var TH_TITLE = "ZOUND — พ็อดกันเสียงสำหรับที่ทำงานยุคใหม่";

  /* Thai strings only — keys map to [data-i18n] in index.html.
     Keys with no entry here simply keep their English baseline. */
  var TH = {
    // nav
    nav_pods: "พ็อด",
    nav_why: "ทำไมต้อง ZOUND",
    nav_perf: "ประสิทธิภาพ",
    nav_contact: "ติดต่อ",
    nav_talk: "ปรึกษาฝ่ายขาย",
    scroll: "เลื่อน",

    // hero
    hero1: "ความเงียบ<br/>ที่ออกแบบมา",
    hero2: "สมาธิ<br/>ที่เหนือระดับ",
    hero3: "พื้นที่ของคุณ<br/>นวัตกรรมของคุณ",

    // manifesto
    mani_eyebrow: "— ห้องส่วนตัวภายในห้อง",
    mani_lead: "ZOUND พ็อด สร้างพื้นที่แห่งความสงบขึ้นกลางออฟฟิศเปิดโล่ง — <em>กันเสียง ระบายอากาศ และประณีตดั่งเฟอร์นิเจอร์ชั้นเลิศ</em> ออกแบบมาเพื่อองค์กรที่ถือว่าสมาธิคือความได้เปรียบ",
    mani_sub: "ค้นพบวิธีใหม่ของการเชื่อมต่อและจดจ่อ",

    // range intro
    range_eyebrow: "VOGUE ซีรีส์",
    range_title: "สี่ขนาด<br/>หนึ่งมาตรฐานความเงียบ",

    // pod S Plus
    pod_s_size: "ขนาด S Plus",
    pod_s_title: "สายส่วนตัว",
    pod_s_desc: "บูธส่วนตัวสำหรับการโทรและประชุมวิดีโอ มุมสงบที่อยู่เคียงข้างคุณทุกที่ทุกเวลา",
    sp_cap_k: "ความจุ", sp_cap_v: "1 คน",
    sp_aco_k: "อะคูสติก", sp_aco_v: "สูงสุด −30 dB",
    sp_ins_k: "ติดตั้ง", sp_ins_v: "45 นาที",

    // pod M
    pod_m_size: "ขนาด M",
    pod_m_title: "ห้องแห่งสมาธิ",
    pod_m_desc: "พ็อดส่วนตัวสำหรับงานที่ต้องใช้สมาธิและการประชุมออนไลน์ ปิดกั้นทุกเสียงรบกวนจากรอบข้าง",
    sm_cap_k: "ความจุ", sm_cap_v: "1 คน",
    sm_set_k: "การจัดวาง", sm_set_v: "โต๊ะ + เก้าอี้ดีไซน์",
    sm_air_k: "อากาศ", sm_air_v: "ระบบระบายอากาศ",

    // pod L / L Plus
    pod_l_size: "ขนาด L · L Plus",
    pod_l_title: "พ็อดประชุม",
    pod_l_desc: "พื้นที่สำหรับ 2–6 คน เพื่อพบปะ นำเสนอ และตัดสินใจ พร้อมจอแสดงผล ที่นั่งเลานจ์ และความเงียบสงบ",
    sl_cap_k: "ความจุ", sl_cap_v: "2–6 คน",
    sl_dis_k: "จอแสดงผล", sl_dis_v: "พร้อมเชื่อมต่อ",
    sl_com_k: "ความสบาย", sl_com_v: "ที่นั่งเลานจ์",

    // why
    why_eyebrow: "ทำไมต้อง ZOUND",
    why_title: "วิศวกรรม<br/>ในทุกเดซิเบล",
    card1_h: "เงียบสนิทถึงแก่น",
    card1_p: "ระบบอะคูสติกที่ออกแบบมาช่วยลดเสียงรบกวนได้สูงสุด 30 เดซิเบล เกาะแห่งความเงียบที่แท้จริง",
    card2_h: "ไม่ต้องก่อสร้าง ไม่ยุ่งยาก",
    card2_p: "ประกอบเสร็จภายในไม่ถึงชั่วโมง ไม่ต้องต่อเติม ไม่ต้องขออนุญาต ไม่หยุดชะงัก",
    card3_k: "โมดูลาร์",
    card3_h: "เคลื่อนย้ายไปกับคุณ",
    card3_p: "ย้ายและปรับเปลี่ยนได้ตามทีมที่เปลี่ยนไป เป็นสินทรัพย์ ไม่ใช่การรีโนเวต",
    card4_h: "วัสดุบริสุทธิ์ ปลอดสารพิษ",
    card4_p: "ไร้ตะปู กาว สาร VOC และกลิ่นสี รีไซเคิลได้ และปลอดภัยต่อการหายใจ",
    card5_k: "อากาศ + แสง",
    card5_h: "ความสบายที่มาพร้อมกัน",
    card5_p: "ระบบระบายอากาศ เซ็นเซอร์ตรวจจับการเคลื่อนไหว และแสงนุ่มนวล ทำให้ทุกช่วงเวลาสดชื่น",
    card6_k: "ดีไซน์",
    card6_h: "ออกแบบมาเพื่อประสิทธิภาพ",
    card6_p: "ดีไซน์ร่วมสมัยระดับพรีเมียม ที่ยกระดับทั้งห้อง และทุกคนในนั้น",

    // stats
    stat1_l: "ลดเสียงรบกวน",
    stat2_u: "นาที", stat2_l: "ในการติดตั้ง",
    stat3_l: "การปล่อยสาร",
    stat4_u: "ขนาด", stat4_l: "หนึ่งซีรีส์",

    // range reveal
    rr_eyebrow: "ครบทั้งซีรีส์",
    rr_title: "เลือกขนาดที่ใช่",
    rr_cta: "ปรึกษาฝ่ายขาย",

    // colour explosion
    col_eyebrow: "VOGUE Series · เจ็ดเฉดสี",
    col_title: "สีของคุณ<br/>ตัวตนของคุณ",
    col_sub: "เจ็ดเฉดสีที่คัดสรรมาอย่างพิถีพิถัน ตั้งแต่โทนเรียบนิ่งไปจนถึงสีที่โดดเด่น เลือกสีที่ใช่สำหรับพื้นที่ของคุณ",

    // contact
    con_eyebrow: "นำความเงียบสู่ออฟฟิศของคุณ",
    con_title: "พื้นที่ของคุณ<br/>นวัตกรรมของคุณ",
    con_talk: "ปรึกษาฝ่ายขาย",
    con_free: "รับคำปรึกษาฟรี",

    // footer
    foot_series: "VOGUE ซีรีส์ · พ็อดออฟฟิศกันเสียง",
    foot_by: "© 2026 ZOUND · โดย 1toAll",

    // nav (catalog rebuild)
    nav_smart: "อัจฉริยะ",
    nav_sus: "ความยั่งยืน",

    // VOGUE specification
    spec_eyebrow: "VOGUE ซีรีส์ · สเปก",
    spec_title: "ห้าขนาด<br/>หนึ่งมาตรฐานความเงียบ",
    spec_sub: "ทุกพ็อด VOGUE กันเสียงได้สูงสุด 32 dB ระบายอากาศในตัว และพร้อมใช้งานทันที เลือกขนาดที่เหมาะกับทีมของคุณ",
    spec_finishes: "เจ็ดเฉดสี",
    spec_foot: "ทุกรุ่นมาพร้อม USB 3.0, USB-C และปลั๊กไฟ พร้อมไฟ LED ดาวน์ไลท์ ปรับหรี่ได้ และไฟแอมเบียนต์",
    cap_1: "1 คน",
    cap_12: "1–2 คน",
    cap_24: "2–4 คน",
    cap_4: "4 คน",
    r_dim: "ขนาด",
    r_wt: "น้ำหนัก",
    r_iso: "กันเสียง",
    r_pwr: "พลังงาน",
    r_air: "ระบายอากาศ",
    r_fur: "เฟอร์นิเจอร์",
    fur_chair: "โต๊ะ + เก้าอี้",
    fur_sofa: "โต๊ะ + โซฟา",
    fur_sofas: "โต๊ะ + โซฟา",

    // Smart & Connected
    smart_eyebrow: "อัจฉริยะและการเชื่อมต่อ",
    smart_title: "พ็อดที่มีสมอง",
    chip_sock: "ปลั๊กยูนิเวอร์แซล",
    chip_radar: "เซ็นเซอร์เรดาร์",
    chip_occ: "ไฟแสดงการใช้งาน",
    chip_air: "อุณหภูมิ · ความชื้น · PM2.5",
    sf1_h: "ควบคุมอัจฉริยะ", sf1_p: "ปรับการระบายอากาศ แสง และอุณหภูมิได้ดั่งใจ",
    sf2_h: "ความเป็นส่วนตัวด้านเสียงขั้นสูง", sf2_p: "กันเสียงได้สูงสุด 32 dB เพื่อสมาธิที่สมบูรณ์",
    sf3_h: "จองห้องล่วงหน้า", sf3_p: "ตรวจสอบสถานะและจองได้ในพริบตา",
    sf4_h: "พื้นผิวอะคูสติก 3 มิติ", sf4_p: "แผ่นร่องดีไซน์พิเศษ ออกแบบมาเพื่อดูดซับเสียง",
    sf5_h: "ระบบ AI อัจฉริยะ", sf5_p: "คาดการณ์และบำรุงรักษาก่อนเกิดปัญหา",
    sf6_h: "จัดการผ่านคลาวด์", sf6_p: "ควบคุมไฟและอุณหภูมิได้จากมือถือ",

    // Ventilation
    air_eyebrow: "ระบบระบายอากาศ · ร่วมกับ Panasonic",
    air_title: "หายใจสดชื่น<br/>ทำงานเฉียบคม",
    air_sub: "พัดลมแบบแรงเหวี่ยงประสิทธิภาพสูงที่พัฒนาร่วมกับ Panasonic ให้การไหลของอากาศสูงสุด 95 m³/h (56 CFM) ที่ 1,700 รอบต่อนาที และควบคุมเสียงให้ต่ำกว่า 40 dB เพื่อพื้นที่ที่สงบและสบาย",
    air_k1: "การไหลของอากาศ",
    air_k2: "ความเร็วพัดลม",
    air_k3: "ระดับเสียง",

    // Air circulation (animated diagram)
    af_eyebrow: "อากาศหมุนเวียน · ร่วมกับ Panasonic",
    af_title: "เข้าทางด้านบน<br/>ออกทางด้านล่าง",
    af_sub: "อากาศบริสุทธิ์ถูกดึงเข้าทางช่องระบายด้านบน หมุนเวียนทั่วทั้งพ็อด และระบายออกที่ฐาน เป็นวงจรต่อเนื่อง ขับเคลื่อนด้วยพัดลมแบบแรงเหวี่ยงประสิทธิภาพสูงที่พัฒนาร่วมกับ <strong>Panasonic</strong>",
    af_in: "อากาศเข้า",
    af_circ: "หมุนเวียน",
    af_out: "ระบายออก",
    af_tag: "พัดลมแรงเหวี่ยง · 95 m³/h · 1,700 rpm · < 40 dB · Panasonic",

    // Stats
    nst1: "ลดเสียงรบกวน",
    nst2: "เสียงก้อง",
    nst3: "การกันเสียง VOGUE",
    nst4: "อากาศบริสุทธิ์",

    // Benefits
    ben_eyebrow: "เปลี่ยนเล็กน้อย ผลลัพธ์ยิ่งใหญ่",
    ben1: "เพิ่มสมาธิ",
    ben2: "เพิ่มประสิทธิภาพ",
    ben3: "ลดข้อผิดพลาด",
    ben4: "ลดความเครียด",
    ben5: "ลดความเหนื่อยล้า",

    // Sustainability
    sus_eyebrow: "ความยั่งยืน",
    sus_title: "คาร์บอนต่ำ<br/>ด้วยการออกแบบ",
    sus_sub: "ZOUND เป็นแบรนด์ห้องเก็บเสียงรายแรกที่เลือกใช้คาร์บอนไฟเบอร์รีไซเคิล ได้รับการรับรอง GREENGUARD Gold ด้านการปล่อยสารเคมีต่ำ ไร้ไม้ ไร้กาว ปลอดฟอร์มาลดีไฮด์ และรีไซเคิลได้ทั้งหมด",
    sus_l1: "ใช้พลังงานต่ำ",
    sus_l2: "คาร์บอนฟุตพรินต์ต่ำ",
    sus_l3: "การทำให้อากาศเป็นกรดต่ำ",
    sus_l4: "ภาวะยูโทรฟิเคชันต่ำ",

    // Reference cases
    ref_eyebrow: "ลูกค้าอ้างอิง",
    ref_title: "ได้รับความไว้วางใจ<br/>จากแบรนด์ชั้นนำทั่วโลก",
    ref_lead: "ตั้งแต่สำนักงานใหญ่ระดับโลก สนามบิน มหาวิทยาลัย ไปจนถึงหน่วยงานราชการ — ZOUND พ็อด ได้รับความไว้วางใจในพื้นที่ทำงานที่ต้องการมาตรฐานสูงทั่วโลก",

    // Contact channels
    ch_call: "โทร",
    ch_web: "เว็บไซต์",

    // FAQ
    faq_eyebrow: "คำถามที่พบบ่อย",
    faq_title: "ไขทุกข้อสงสัยเรื่องความเงียบ",
    faq_q1: "ZOUND พ็อดกันเสียงคืออะไร?",
    faq_a1: "ZOUND พ็อด คือห้องอะคูสติกแบบตั้งอิสระ — ตู้กันเสียงที่ติดตั้งในออฟฟิศแบบเปิดได้ทันที VOGUE Series กันเสียงได้สูงสุด 32&nbsp;dB ทำให้การโทร การประชุมวิดีโอ และงานที่ต้องใช้สมาธิเป็นส่วนตัวโดยไม่ต้องสร้างผนัง แต่ละพ็อดประณีตเหมือนเฟอร์นิเจอร์ชั้นดี และติดตั้งเสร็จในราว 45 นาที",
    faq_q2: "ZOUND พ็อดเงียบแค่ไหน?",
    faq_a2: "VOGUE Series ลดเสียงได้สูงสุด 32&nbsp;dB — ราวกับความต่างระหว่างออฟฟิศที่พลุกพล่านกับห้องสมุดที่เงียบสงบ (STC ≈ 30, ค่าก้องสะท้อน ≈ 0.25&nbsp;วินาที) ภายในจึงเป็นส่วนตัวและเงียบสนิท",
    faq_q3: "มีขนาดอะไรให้เลือกบ้าง?",
    faq_a3: "มี 5 ขนาด — S, S&nbsp;Plus, M, L และ L&nbsp;Plus ตั้งแต่บูธสำหรับหนึ่งคนไปจนถึงห้องประชุมสี่คน มาตรฐานความเงียบเดียวกันทั้งซีรีส์ คุณเลือกขนาดที่ใช่",
    faq_q4: "พ็อดมีระบบระบายอากาศหรือไม่?",
    faq_a4: "มี ทุกพ็อดใช้พัดลมแบบแรงเหวี่ยงที่พัฒนาร่วมกับ Panasonic ดึงอากาศบริสุทธิ์เข้าทางด้านบนและระบายออกที่ฐาน สูงสุด 95&nbsp;m³/h และเสียงต่ำกว่า 40&nbsp;dB อากาศจึงสดชื่นในขณะที่พ็อดยังเงียบสงบ",
    faq_q5: "ZOUND พ็อดเป็นมิตรกับสิ่งแวดล้อมและได้มาตรฐานหรือไม่?",
    faq_a5: "ใช่ ผลิตจากวัสดุมาตรฐาน GREENGUARD&nbsp;Gold (UL&nbsp;2818) และคาร์บอนไฟเบอร์รีไซเคิล ผ่านการทดสอบมาตรฐาน ISO, SGS และ ASTM ปล่อยมลพิษต่ำและทนทาน",
    faq_q6: "ซื้อ ZOUND พ็อดได้ที่ไหน?",
    faq_a6: "ZOUND พ็อด ได้รับความไว้วางใจจากแบรนด์ชั้นนำทั่วโลก จัดจำหน่ายโดย 1toAll ติดต่อฝ่ายขายเพื่อปรึกษา ราคา และระยะเวลาจัดส่ง โทร 1605 / 02-690-3626 หรืออีเมล hello@zoundpod.com"
  };

  var EN = {};               // captured English baseline
  var nodes = [];

  function cache() {
    nodes = [].slice.call(document.querySelectorAll("[data-i18n]"));
    nodes.forEach(function (el) {
      EN[el.getAttribute("data-i18n")] = el.innerHTML;
    });
  }

  function apply(lang) {
    var th = lang === "th";
    document.documentElement.lang = th ? "th" : "en";
    var dict = th ? TH : EN;
    nodes.forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      var v = dict[k];
      if (v == null) v = EN[k];          // fall back to English if no TH entry
      if (v != null && el.innerHTML !== v) el.innerHTML = v;
    });
    document.title = th ? TH_TITLE : EN_TITLE;
    var t = document.getElementById("lang-toggle");
    if (t) {
      [].slice.call(t.querySelectorAll("[data-lang]")).forEach(function (s) {
        s.classList.toggle("active", s.getAttribute("data-lang") === (th ? "th" : "en"));
      });
    }
    try { localStorage.setItem("zound-lang", th ? "th" : "en"); } catch (e) {}
  }

  function init() {
    cache();
    // Initial language: /th/ path or ?lang=th forces Thai (for SEO + shared links);
    // otherwise fall back to the visitor's saved choice, else English.
    var initial = "en";
    try {
      var p = location.pathname.toLowerCase(), q = location.search.toLowerCase();
      if (/(^|\/)th(\/|\.html|$)/.test(p) || /[?&]lang=th/.test(q)) {
        initial = "th";
      } else if (localStorage.getItem("zound-lang") === "th") {
        initial = "th";
      }
    } catch (e) {}
    apply(initial);

    var t = document.getElementById("lang-toggle");
    if (t) {
      [].slice.call(t.querySelectorAll("[data-lang]")).forEach(function (s) {
        s.style.cursor = "pointer";
        s.addEventListener("click", function () { apply(s.getAttribute("data-lang")); });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
