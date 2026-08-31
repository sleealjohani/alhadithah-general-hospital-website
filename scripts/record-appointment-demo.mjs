/**
 * Records a short Arabic instructional video of the visitor appointment flow,
 * driving the REAL site in a desktop Chromium window. Supabase calls are stubbed
 * with fake Arabic demo data so the recording is reproducible offline.
 *
 * Usage:  node scripts/record-appointment-demo.mjs
 * Output: <OUT_DIR>/appointment-demo.webm (raw page capture)
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.DEMO_BASE || "http://localhost:5173";
const OUT_DIR = process.env.OUT_DIR || "/tmp/appointment-demo";
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const W = 1280;
const H = 800;
const PAUSE = 4000; // 4s hold on every step, as requested

/* ---- Fake Arabic demo data --------------------------------------------- */
const CLINICS = [
  { id: "c1", name_ar: "العيادة الباطنية", name_en: "Internal Medicine", description_ar: "الفحص والمتابعة العامة", description_en: "" },
  { id: "c2", name_ar: "عيادة الأطفال", name_en: "Pediatrics", description_ar: "من الولادة حتى ١٢ سنة", description_en: "" },
  { id: "c3", name_ar: "عيادة النساء والولادة", name_en: "OB & GYN", description_ar: "متابعة الحمل والفحوصات", description_en: "" },
  { id: "c4", name_ar: "عيادة الأسنان", name_en: "Dental", description_ar: "علاج وتنظيف الأسنان", description_en: "" },
  { id: "c5", name_ar: "عيادة العظام", name_en: "Orthopedics", description_ar: "إصابات المفاصل والعظام", description_en: "" },
  { id: "c6", name_ar: "عيادة الجلدية", name_en: "Dermatology", description_ar: "الأمراض الجلدية والتجميل", description_en: "" }
].map((c) => ({
  ...c,
  instructions_ar: "الحضور قبل الموعد بـ ١٥ دقيقة مع إحضار بطاقة الهوية.",
  instructions_en: "",
  location_ar: "الدور الأول — جناح العيادات",
  location_en: "",
  work_days: [0, 1, 2, 3, 4],
  slot_start: "08:00:00",
  slot_end: "14:00:00",
  slot_minutes: 20,
  slot_capacity: 1,
  lead_days: 1,
  horizon_days: 30,
  is_active: true,
  sort_order: 10
}));

const SLOTS = [
  { time: "08:00", free: 1 },
  { time: "08:20", free: 1 },
  { time: "08:40", free: 1 },
  { time: "09:00", free: 0 },
  { time: "09:20", free: 1 },
  { time: "09:40", free: 1 },
  { time: "10:00", free: 1 },
  { time: "10:20", free: 0 },
  { time: "10:40", free: 1 },
  { time: "11:00", free: 1 }
];

const PATIENT = {
  name: "نورة عبدالله الرشيدي",
  id: "1078451236",
  phone: "0551234567",
  dob: "1995-03-18"
};
const REFERENCE = "HGH-260821-3947";

/* ---- Cursor + caption overlay (injected into the page) ------------------ */
const OVERLAY = `
(() => {
  /* addInitScript runs at document-start, before <body> exists — so install
     once the DOM is ready (and re-install after client-side navigations). */
  const install = () => {
  if (window.__demoReady || !document.body) return;
  window.__demoReady = true;

  const style = document.createElement('style');
  style.textContent = \`
    #demo-cursor{position:fixed;left:50%;top:50%;width:26px;height:26px;z-index:2147483647;
      pointer-events:none;transition:left .8s cubic-bezier(.22,1,.36,1),top .8s cubic-bezier(.22,1,.36,1);
      filter:drop-shadow(0 3px 6px rgba(0,0,0,.45))}
    #demo-ripple{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;
      z-index:2147483646;pointer-events:none;background:rgba(46,163,224,.45);
      border:2px solid #2ea3e0;opacity:0;transform:scale(.3)}
    #demo-ripple.go{animation:demoRipple .6s ease-out}
    @keyframes demoRipple{0%{opacity:1;transform:scale(.3)}100%{opacity:0;transform:scale(1.5)}}
    #demo-caption{position:fixed;left:50%;bottom:34px;transform:translateX(-50%) translateY(14px);
      z-index:2147483645;pointer-events:none;max-width:min(860px,88vw);
      display:flex;align-items:center;gap:14px;padding:16px 26px;border-radius:18px;
      background:linear-gradient(180deg,rgba(14,40,65,.97),rgba(9,26,43,.97));
      border:1px solid rgba(244,212,136,.45);box-shadow:0 18px 50px rgba(0,0,0,.4);
      color:#fff;font-family:"Janna LT","IBM Plex Sans Arabic",Tahoma,sans-serif;
      font-size:22px;font-weight:700;line-height:1.6;direction:rtl;text-align:right;
      opacity:0;transition:opacity .35s ease,transform .35s cubic-bezier(.22,1,.36,1)}
    #demo-caption.show{opacity:1;transform:translateX(-50%) translateY(0)}
    #demo-caption .n{flex:0 0 auto;display:grid;place-items:center;width:38px;height:38px;
      border-radius:50%;background:linear-gradient(135deg,#f4d488,#c8901f);color:#12233a;font-size:19px}
  \`;
  document.head.appendChild(style);

  const cur = document.createElement('div');
  cur.id = 'demo-cursor';
  cur.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2l7 18 2.5-7.5L21 10z" fill="#fff" stroke="#12233a" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const rip = document.createElement('div'); rip.id = 'demo-ripple';
  const cap = document.createElement('div'); cap.id = 'demo-caption';
  document.body.append(cur, rip, cap);

  window.__moveCursor = (x, y) => { cur.style.left = x + 'px'; cur.style.top = y + 'px'; };
  window.__clickFx = (x, y) => {
    rip.style.left = x + 'px'; rip.style.top = y + 'px';
    rip.classList.remove('go'); void rip.offsetWidth; rip.classList.add('go');
  };
  window.__say = (n, text) => {
    cap.classList.remove('show');
    setTimeout(() => {
      cap.innerHTML = '<span class="n">' + n + '</span><span>' + text + '</span>';
      cap.classList.add('show');
    }, 180);
  };
  window.__hideCaption = () => cap.classList.remove('show');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();
`;

/* ---- Helpers ------------------------------------------------------------ */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ executablePath: CHROME });

  /* Warm-up pass in a throwaway context so the dev server has compiled both
     routes before the camera rolls — otherwise the video opens on a blank page. */
  const warm = await browser.newContext({ viewport: { width: W, height: H } });
  const warmPage = await warm.newPage();
  await warmPage.goto(`${BASE}/`, { waitUntil: "networkidle" }).catch(() => {});
  await warmPage.goto(`${BASE}/appointments`, { waitUntil: "networkidle" }).catch(() => {});
  await warm.close();

  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    locale: "ar-SA",
    recordVideo: { dir: OUT_DIR, size: { width: W, height: H } }
  });

  /* Stub every Supabase call: appointment data gets fake Arabic content,
     everything else resolves empty so the site renders its static content. */
  await context.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    const json = (body) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify(body)
      });
    if (url.includes("appointment_clinics")) return json(CLINICS);
    if (url.includes("rpc/appointment_slots")) return json({ status: "ok", slots: SLOTS });
    if (url.includes("rpc/request_appointment")) return json({ status: "ok", reference: REFERENCE, id: "demo" });
    if (url.includes("rpc/lookup_appointments")) return json({ status: "ok", items: [] });
    return json([]);
  });

  const page = await context.newPage();
  await page.addInitScript(OVERLAY);

  /* Timeline markers (ms from first paint) so the finishing pass can trim the
     blank head and switch the URL bar exactly when the route changes. */
  const timeline = { recordStart: Date.now(), firstPaint: 0, navigatedAt: 0, steps: [] };
  let stepNo = 0;

  /** Announce a step, glide the cursor to the target, and hold for 4s. */
  async function step(text, selector, action) {
    stepNo += 1;
    await page.evaluate(([n, t]) => window.__say(n, t), [String(stepNo), text]);
    await sleep(900);

    if (selector) {
      const el = page.locator(selector).first();
      /* Park the target in the upper third so the bottom caption never covers
         the thing it is describing. */
      await el
        .evaluate((node) => {
          const r = node.getBoundingClientRect();
          const target = window.innerHeight * 0.34;
          const delta = r.top - target;
          if (Math.abs(delta) > 40) window.scrollBy({ top: delta, behavior: "smooth" });
        })
        .catch(() => {});
      await sleep(900);
      const box = await el.boundingBox();
      if (box) {
        const x = Math.round(box.x + box.width / 2);
        const y = Math.round(box.y + box.height / 2);
        await page.evaluate(([px, py]) => window.__moveCursor(px, py), [x, y]);
        await page.mouse.move(x, y, { steps: 24 });
        await sleep(850);
        if (action !== "hover") {
          await page.evaluate(([px, py]) => window.__clickFx(px, py), [x, y]);
          await sleep(180);
        }
      }
    }
    if (typeof action === "function") await action();
    await sleep(PAUSE);
  }

  /* ---- 1. Homepage ------------------------------------------------------ */
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".appointment-cta", { timeout: 30000 });
  await page.waitForTimeout(1200);
  timeline.firstPaint = Date.now();
  await page.locator(".appointment-cta").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);

  await step("من الصفحة الرئيسية، اضغط على زر «حجز موعد» في بطاقة العيادات", '.appointment-cta a.btn-primary', async () => {
    await page.locator(".appointment-cta a.btn-primary").click();
    timeline.navigatedAt = Date.now();
    await page.waitForTimeout(1800);
  });

  /* ---- 2. Clinic -------------------------------------------------------- */
  await page.waitForSelector(".appt-clinic", { timeout: 15000 });
  await page.waitForTimeout(600);
  await step("اختر العيادة التي ترغب بزيارتها", ".appt-clinic >> nth=0", async () => {
    await page.locator(".appt-clinic").first().click();
    await page.waitForTimeout(700);
  });

  /* ---- 3. Date ---------------------------------------------------------- */
  await step("حدّد اليوم المناسب من قائمة المواعيد المتاحة", ".appt-step select", async () => {
    const options = await page.locator(".appt-step select option").all();
    const value = await options[1].getAttribute("value");
    await page.locator(".appt-step select").selectOption(value);
    await page.waitForTimeout(1200);
  });

  /* ---- 4. Time ---------------------------------------------------------- */
  await page.waitForSelector(".appt-slot", { timeout: 15000 });
  await step("اختر الوقت المناسب من الأوقات المتاحة", ".appt-slot:not(.is-full) >> nth=1", async () => {
    await page.locator(".appt-slot:not(.is-full)").nth(1).click();
    await page.waitForTimeout(800);
  });

  /* ---- 5. Name + ID ----------------------------------------------------- */
  await page.waitForSelector(".appt-grid", { timeout: 15000 });
  await step("اكتب الاسم الكامل ورقم الهوية أو الإقامة", ".appt-grid input >> nth=0", async () => {
    await page.locator(".appt-grid input").nth(0).type(PATIENT.name, { delay: 55 });
    await page.waitForTimeout(500);
    const idBox = await page.locator(".appt-grid input").nth(1).boundingBox();
    if (idBox) {
      const x = Math.round(idBox.x + idBox.width / 2);
      const y = Math.round(idBox.y + idBox.height / 2);
      await page.evaluate(([px, py]) => window.__moveCursor(px, py), [x, y]);
      await page.mouse.move(x, y, { steps: 18 });
      await page.evaluate(([px, py]) => window.__clickFx(px, py), [x, y]);
    }
    await page.locator(".appt-grid input").nth(1).type(PATIENT.id, { delay: 60 });
  });

  /* ---- 6. Nationality + phone ------------------------------------------- */
  await step("اختر الجنسية ثم أدخل رقم الجوال للتواصل معك", ".appt-grid select >> nth=0", async () => {
    await page.locator(".appt-grid select").first().selectOption({ label: "سعودي" }).catch(() => {});
    await page.waitForTimeout(600);
    const ph = page.locator('.appt-grid input[inputmode="tel"]');
    const box = await ph.boundingBox();
    if (box) {
      const x = Math.round(box.x + box.width / 2);
      const y = Math.round(box.y + box.height / 2);
      await page.evaluate(([px, py]) => window.__moveCursor(px, py), [x, y]);
      await page.mouse.move(x, y, { steps: 18 });
      await page.evaluate(([px, py]) => window.__clickFx(px, py), [x, y]);
    }
    await ph.type(PATIENT.phone, { delay: 60 });
  });

  /* ---- 7. Date of birth -------------------------------------------------- */
  await step("أدخل تاريخ الميلاد، ويمكنك التبديل بين التقويم الميلادي والهجري", ".appt-dob input", async () => {
    await page.locator(".appt-dob input").fill(PATIENT.dob);
    await page.waitForTimeout(700);
  });

  /* ---- 8. Submit -------------------------------------------------------- */
  await step("راجع ملخص الطلب ثم اضغط «إرسال طلب الموعد»", ".appt-submit", async () => {
    await page.locator(".appt-submit").click();
    await page.waitForTimeout(2000);
  });

  /* ---- 9. Success -------------------------------------------------------- */
  await page.waitForSelector(".appt-ref", { timeout: 15000 });
  await step("تم إرسال طلبك بنجاح — احتفظ برقم الطلب لمتابعة موعدك أو تعديله لاحقًا", ".appt-ref", "hover");

  await page.evaluate(() => window.__hideCaption());
  await sleep(1500);

  await context.close();
  await browser.close();

  /* Rename the generated capture to a predictable filename. */
  const file = fs.readdirSync(OUT_DIR).find((f) => f.endsWith(".webm"));
  const out = path.join(OUT_DIR, "appointment-demo.webm");
  if (file && path.join(OUT_DIR, file) !== out) fs.renameSync(path.join(OUT_DIR, file), out);

  /* navSeconds = when the route flips, measured from first paint. */
  const meta = {
    headSeconds: (timeline.firstPaint - timeline.recordStart) / 1000,
    navSeconds: (timeline.navigatedAt - timeline.firstPaint) / 1000,
    steps: timeline.steps
  };
  fs.writeFileSync(path.join(OUT_DIR, "timeline.json"), JSON.stringify(meta, null, 2));
  console.log("VIDEO:", out);
  console.log("NAV_SECONDS:", meta.navSeconds.toFixed(2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
