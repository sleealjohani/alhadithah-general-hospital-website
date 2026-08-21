/**
 * Records short looping screen-capture clips of the live site for the
 * presentation deck. Each clip is its own Playwright context (one video per
 * context), driven through a real interaction so the deck shows the product
 * moving rather than a still.
 *
 * Supabase is stubbed with Arabic demo data so the clips are reproducible.
 *
 * Usage: node scripts/record-deck-clips.mjs
 * Output: /tmp/deck-clips/<name>/*.webm  + timing metadata
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.DEMO_BASE || "http://localhost:5173";
const OUT = process.env.CLIPS_DIR || "/tmp/deck-clips";
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 400, height: 860 };

/* ---- Arabic demo data --------------------------------------------------- */
const CLINICS = [
  { id: "c1", name_ar: "العيادة الباطنية", name_en: "Internal Medicine", description_ar: "الفحص والمتابعة العامة" },
  { id: "c2", name_ar: "عيادة الأطفال", name_en: "Pediatrics", description_ar: "من الولادة حتى ١٢ سنة" },
  { id: "c3", name_ar: "عيادة النساء والولادة", name_en: "OB & GYN", description_ar: "متابعة الحمل والفحوصات" },
  { id: "c4", name_ar: "عيادة الأسنان", name_en: "Dental", description_ar: "علاج وتنظيف الأسنان" },
  { id: "c5", name_ar: "عيادة العظام", name_en: "Orthopedics", description_ar: "إصابات المفاصل والعظام" },
  { id: "c6", name_ar: "عيادة الجلدية", name_en: "Dermatology", description_ar: "الأمراض الجلدية والتجميل" }
].map((c) => ({
  ...c, description_en: "",
  instructions_ar: "الحضور قبل الموعد بـ ١٥ دقيقة مع إحضار بطاقة الهوية.", instructions_en: "",
  location_ar: "الدور الأول — جناح العيادات", location_en: "",
  work_days: [0, 1, 2, 3, 4], slot_start: "08:00:00", slot_end: "14:00:00",
  slot_minutes: 20, slot_capacity: 1, lead_days: 1, horizon_days: 30, is_active: true, sort_order: 10
}));

const SLOTS = [
  { time: "08:00", free: 1 }, { time: "08:20", free: 1 }, { time: "08:40", free: 1 },
  { time: "09:00", free: 0 }, { time: "09:20", free: 1 }, { time: "09:40", free: 1 },
  { time: "10:00", free: 1 }, { time: "10:20", free: 0 }, { time: "10:40", free: 1 }, { time: "11:00", free: 1 }
];

const TRACKED = [{
  reference: "HGH-260821-3947", full_name: "نورة عبدالله الرشيدي", phone: "0551234567",
  national_id: "1078451236", nationality: "سعودي",
  clinic_name_ar: "العيادة الباطنية", clinic_name_en: "Internal Medicine",
  appointment_date: "2026-08-23", appointment_time: "08:20:00", status: "approved",
  admin_note: "تم تأكيد موعدك، يرجى إحضار التقارير السابقة إن وجدت.", notes: null,
  created_at: "2026-08-21T09:12:00",
  instructions_ar: "الحضور قبل الموعد بـ ١٥ دقيقة مع إحضار بطاقة الهوية.", instructions_en: "",
  location_ar: "الدور الأول — جناح العيادات", location_en: ""
}];

const SPOTLIGHT = {
  id: "s1", photo_url: null, name: "سلطان عوده الجهني", specialty: "مساعد صحي",
  month_label_ar: "ممرض شهر يوليو", month_label_en: "Nurse of July",
  message_ar: "كل الشكر على تفانيك وتميّزك في خدمة المرضى.", message_en: "",
  achievements_ar: "الالتزام بأعلى معايير سلامة المرضى\nالتفاني في دعم الزملاء والمناوبات الإضافية\nالإنجاز في تحسين رضا المرضى بالقسم",
  achievements_en: "", is_active: true
};

async function stub(context) {
  await context.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    const json = (body) => route.fulfill({ status: 200, contentType: "application/json",
      headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });
    if (url.includes("appointment_clinics")) return json(CLINICS);
    if (url.includes("rpc/appointment_slots")) return json({ status: "ok", slots: SLOTS });
    if (url.includes("rpc/request_appointment")) return json({ status: "ok", reference: "HGH-260821-3947", id: "d" });
    if (url.includes("rpc/lookup_appointments")) return json({ status: "ok", items: TRACKED });
    if (url.includes("nursing_spotlight")) return json(SPOTLIGHT);
    return json([]);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Smoothly scroll by `dy` over `ms` so the clip reads as a human scroll. */
async function glide(page, dy, ms = 2600) {
  await page.evaluate(async ([d, t]) => {
    const start = window.scrollY, t0 = performance.now();
    await new Promise((res) => {
      const tick = (now) => {
        const p = Math.min((now - t0) / t, 1);
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOutQuad
        window.scrollTo(0, start + d * e);
        p < 1 ? requestAnimationFrame(tick) : res();
      };
      requestAnimationFrame(tick);
    });
  }, [dy, ms]);
}

/** Runs one clip in a fresh recording context and reports its blank head. */
async function record(browser, name, viewport, fn) {
  const dir = path.join(OUT, name);
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({
    viewport, locale: "ar-SA",
    recordVideo: { dir, size: viewport },
    ...(viewport === MOBILE ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true } : {})
  });
  await stub(ctx);
  const page = await ctx.newPage();
  const t0 = Date.now();
  const marker = { firstPaint: 0 };
  await fn(page, marker);
  await sleep(600);
  await ctx.close();

  const file = fs.readdirSync(dir).find((f) => f.endsWith(".webm"));
  const out = path.join(dir, "raw.webm");
  if (file && path.join(dir, file) !== out) fs.renameSync(path.join(dir, file), out);
  const head = ((marker.firstPaint || t0) - t0) / 1000;
  console.log(`${name}\thead=${head.toFixed(2)}s`);
  return { name, head };
}

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME });

  /* Warm the routes so the recordings don't open on a blank compile. */
  const warm = await browser.newContext({ viewport: DESKTOP });
  const wp = await warm.newPage();
  for (const p of ["/", "/appointments", "/nursing"]) {
    await wp.goto(BASE + p, { waitUntil: "networkidle" }).catch(() => {});
  }
  await warm.close();

  const meta = [];

  /* 1 — Homepage: hero into the content, a slow living scroll. */
  meta.push(await record(browser, "home", DESKTOP, async (page, m) => {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForSelector(".appointment-cta", { timeout: 30000 });
    await sleep(1200);
    m.firstPaint = Date.now();
    await sleep(1400);
    await glide(page, 620, 3000);
    await sleep(900);
    await glide(page, 640, 3000);
    await sleep(1100);
  }));

  /* 2 — Booking: pick clinic, pick day, pick time. */
  meta.push(await record(browser, "booking", DESKTOP, async (page, m) => {
    await page.goto(`${BASE}/appointments`, { waitUntil: "networkidle" });
    await page.waitForSelector(".appt-clinic", { timeout: 30000 });
    await page.evaluate(() => window.scrollTo(0, 470));
    await sleep(1200);
    m.firstPaint = Date.now();
    await sleep(900);
    const c = page.locator(".appt-clinic").nth(0);
    await c.hover(); await sleep(500);
    await c.click(); await sleep(1100);
    await glide(page, 240, 1400);
    const sel = page.locator(".appt-step select").first();
    const opts = await page.locator(".appt-step select option").all();
    await sel.selectOption(await opts[1].getAttribute("value"));
    await page.waitForSelector(".appt-slot", { timeout: 20000 });
    await sleep(1300);
    const s = page.locator(".appt-slot:not(.is-full)").nth(1);
    await s.hover(); await sleep(500);
    await s.click(); await sleep(1500);
  }));

  /* 3 — Details then submit: the confirmation actually appears. */
  meta.push(await record(browser, "submit", DESKTOP, async (page, m) => {
    await page.goto(`${BASE}/appointments`, { waitUntil: "networkidle" });
    await page.waitForSelector(".appt-clinic", { timeout: 30000 });
    await page.locator(".appt-clinic").first().click();
    await sleep(500);
    const sel = page.locator(".appt-step select").first();
    const opts = await page.locator(".appt-step select option").all();
    await sel.selectOption(await opts[1].getAttribute("value"));
    await page.waitForSelector(".appt-slot", { timeout: 20000 });
    await page.locator(".appt-slot:not(.is-full)").nth(1).click();
    await page.waitForSelector(".appt-grid", { timeout: 20000 });
    await page.evaluate(() => {
      const el = document.querySelector(".appt-grid");
      window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 150);
    });
    await sleep(1000);
    m.firstPaint = Date.now();
    await sleep(600);
    await page.locator(".appt-grid input").nth(0).type("نورة عبدالله الرشيدي", { delay: 55 });
    await sleep(300);
    await page.locator(".appt-grid input").nth(1).type("1078451236", { delay: 55 });
    await sleep(300);
    await page.locator(".appt-grid select").first().selectOption({ label: "سعودي" }).catch(() => {});
    await sleep(250);
    await page.locator('.appt-grid input[inputmode="tel"]').type("0551234567", { delay: 55 });
    await sleep(500);
    const btn = page.locator(".appt-submit");
    await btn.scrollIntoViewIfNeeded();
    await btn.hover(); await sleep(500);
    await btn.click();
    await page.waitForSelector(".appt-ref", { timeout: 20000 });
    await sleep(2200);
  }));

  /* 4 — Tracking: search by reference, the status card lands. */
  meta.push(await record(browser, "track", DESKTOP, async (page, m) => {
    await page.goto(`${BASE}/appointments`, { waitUntil: "networkidle" });
    await page.waitForSelector(".appt-tabs", { timeout: 30000 });
    await page.evaluate(() => window.scrollTo(0, 500));
    await sleep(1000);
    m.firstPaint = Date.now();
    await sleep(600);
    await page.locator(".appt-tabs button").nth(1).click();
    await sleep(900);
    await page.locator(".appt-lookup-form input").type("HGH-260821-3947", { delay: 62 });
    await sleep(500);
    await page.locator('.appt-lookup-form button[type="submit"]').click();
    await page.waitForSelector(".appt-card", { timeout: 20000 });
    await sleep(800);
    await glide(page, 200, 1300);
    await sleep(1600);
  }));

  /* 5 — Nursing: the Nurse of the Month card flips. */
  meta.push(await record(browser, "nursing", DESKTOP, async (page, m) => {
    await page.goto(`${BASE}/nursing`, { waitUntil: "networkidle" });
    await page.waitForSelector(".nom-flip", { timeout: 30000 });
    await page.evaluate(() => {
      const el = document.querySelector(".nom-section");
      window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 40);
    });
    await sleep(1300);
    m.firstPaint = Date.now();
    await sleep(1300);
    await page.locator(".nom-flip").hover();
    await sleep(2600);
    await page.mouse.move(60, 60);
    await sleep(2400);
  }));

  /* 6 — Mobile: the same portal in the hand. */
  meta.push(await record(browser, "mobile", MOBILE, async (page, m) => {
    await page.goto(`${BASE}/appointments`, { waitUntil: "networkidle" });
    await page.waitForSelector(".appt-clinic", { timeout: 30000 });
    await sleep(1200);
    m.firstPaint = Date.now();
    await sleep(900);
    await glide(page, 520, 2400);
    await sleep(600);
    await page.locator(".appt-clinic").first().click();
    await sleep(1100);
    await glide(page, 380, 1800);
    await sleep(1400);
  }));

  await browser.close();
  fs.writeFileSync(path.join(OUT, "clips.json"), JSON.stringify(meta, null, 2));
  console.log("DONE");
}

main().catch((e) => { console.error(e); process.exit(1); });
