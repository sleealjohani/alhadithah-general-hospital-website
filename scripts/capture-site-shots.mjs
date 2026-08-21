/**
 * Captures real screenshots of the live site (desktop + mobile) for the
 * presentation deck. Supabase is stubbed with fake Arabic demo data so the
 * appointment screens render fully offline.
 *
 * Usage: node scripts/capture-site-shots.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.DEMO_BASE || "http://localhost:5173";
const OUT = process.env.SHOTS_DIR || "/tmp/site-shots";
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const CLINICS = [
  { id: "c1", name_ar: "العيادة الباطنية", name_en: "Internal Medicine", description_ar: "الفحص والمتابعة العامة" },
  { id: "c2", name_ar: "عيادة الأطفال", name_en: "Pediatrics", description_ar: "من الولادة حتى ١٢ سنة" },
  { id: "c3", name_ar: "عيادة النساء والولادة", name_en: "OB & GYN", description_ar: "متابعة الحمل والفحوصات" },
  { id: "c4", name_ar: "عيادة الأسنان", name_en: "Dental", description_ar: "علاج وتنظيف الأسنان" },
  { id: "c5", name_ar: "عيادة العظام", name_en: "Orthopedics", description_ar: "إصابات المفاصل والعظام" },
  { id: "c6", name_ar: "عيادة الجلدية", name_en: "Dermatology", description_ar: "الأمراض الجلدية والتجميل" }
].map((c) => ({
  ...c,
  description_en: "",
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
  { time: "08:00", free: 1 }, { time: "08:20", free: 1 }, { time: "08:40", free: 1 },
  { time: "09:00", free: 0 }, { time: "09:20", free: 1 }, { time: "09:40", free: 1 },
  { time: "10:00", free: 1 }, { time: "10:20", free: 0 }, { time: "10:40", free: 1 },
  { time: "11:00", free: 1 }
];

const TRACKED = [{
  reference: "HGH-260821-3947",
  full_name: "نورة عبدالله الرشيدي",
  phone: "0551234567",
  national_id: "1078451236",
  nationality: "سعودي",
  clinic_name_ar: "العيادة الباطنية",
  clinic_name_en: "Internal Medicine",
  appointment_date: "2026-08-23",
  appointment_time: "08:20:00",
  status: "approved",
  admin_note: "تم تأكيد موعدك، يرجى إحضار التقارير السابقة إن وجدت.",
  notes: null,
  created_at: "2026-08-21T09:12:00",
  instructions_ar: "الحضور قبل الموعد بـ ١٥ دقيقة مع إحضار بطاقة الهوية.",
  instructions_en: "",
  location_ar: "الدور الأول — جناح العيادات",
  location_en: ""
}];

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 400, height: 860 };

const SPOTLIGHT = {
  id: "s1",
  photo_url: null,
  name: "سلطان عوده الجهني",
  specialty: "مساعد صحي",
  month_label_ar: "ممرض شهر يوليو",
  month_label_en: "Nurse of July",
  message_ar: "كل الشكر على تفانيك وتميّزك في خدمة المرضى.",
  message_en: "",
  achievements_ar: "الالتزام بأعلى معايير سلامة المرضى\nالتفاني في دعم الزملاء والمناوبات الإضافية\nالإنجاز في تحسين رضا المرضى بالقسم",
  achievements_en: "",
  is_active: true
};

const iso = (d, h) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 11) + h + ":00.000Z";
const COURSES = [
  { id: "t1", title_ar: "دورة الإنعاش القلبي الرئوي الأساسي", title_en: "BLS", lecturer_ar: "د. خالد الرويلي",
    starts_at: iso(3, "08:00"), ends_at: iso(3, "12:00"), audience: "both", capacity: 30 },
  { id: "t2", title_ar: "محاضرة مكافحة العدوى", title_en: "Infection Control", lecturer_ar: "أ. منيرة الشراري",
    starts_at: iso(6, "10:00"), ends_at: iso(6, "12:00"), audience: "employees", capacity: 50 },
  { id: "t3", title_ar: "ورشة سلامة المرضى", title_en: "Patient Safety", lecturer_ar: "د. أحمد العنزي",
    starts_at: iso(9, "09:00"), ends_at: iso(9, "13:00"), audience: "both", capacity: 25 }
].map((c) => ({
  ...c, description_ar: "برنامج تدريبي معتمد من إدارة الشؤون الأكاديمية والتدريب.", description_en: "",
  lecturer_en: "", poster_url: null, location_ar: "قاعة التدريب — الدور الثاني", location_en: "",
  register_url: null, status: "published", sort_order: 10, metadata: {}
}));

async function stub(context) {
  await context.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    const json = (body) =>
      route.fulfill({ status: 200, contentType: "application/json",
        headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });
    if (url.includes("appointment_clinics")) return json(CLINICS);
    if (url.includes("rpc/appointment_slots")) return json({ status: "ok", slots: SLOTS });
    if (url.includes("rpc/request_appointment")) return json({ status: "ok", reference: "HGH-260821-3947", id: "demo" });
    if (url.includes("rpc/lookup_appointments")) return json({ status: "ok", items: TRACKED });
    /* maybeSingle() asks for a single object, not an array. */
    if (url.includes("nursing_spotlight")) return json(SPOTLIGHT);
    if (url.includes("training_courses")) return json(COURSES);
    return json([]);
  });
}

/* Scroll a section into view so the capture frames real content, not the hero. */
async function focus(page, selector, offset = 0.12) {
  const el = page.locator(selector).first();
  if ((await el.count()) === 0) return false;
  await el.evaluate((node, off) => {
    const r = node.getBoundingClientRect();
    window.scrollBy({ top: r.top - window.innerHeight * off, behavior: "instant" });
  }, offset).catch(() => {});
  await page.waitForTimeout(900);
  return true;
}

const shot = (page, name) =>
  page.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 84 });

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME });

  /* ---------- Desktop ---------- */
  const dctx = await browser.newContext({ viewport: DESKTOP, locale: "ar-SA" });
  await stub(dctx);
  const d = await dctx.newPage();

  await d.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await d.waitForTimeout(2500);
  await shot(d, "home-desktop");

  // Homepage appointment card in context
  await d.locator(".appointment-cta").scrollIntoViewIfNeeded();
  await d.waitForTimeout(1200);
  await shot(d, "home-appt-card");

  await d.goto(`${BASE}/services`, { waitUntil: "networkidle" });
  await d.waitForTimeout(1800);
  await focus(d, ".section .container", 0.06);
  await shot(d, "services-desktop");

  await d.goto(`${BASE}/nursing`, { waitUntil: "networkidle" });
  await d.waitForTimeout(2400);
  await focus(d, ".nom-section", 0.05);
  await shot(d, "nursing-desktop");

  await d.goto(`${BASE}/training`, { waitUntil: "networkidle" });
  await d.waitForTimeout(2200);
  await focus(d, "#courses", 0.05);
  await shot(d, "training-desktop");

  /* Appointments — booking steps */
  await d.goto(`${BASE}/appointments`, { waitUntil: "networkidle" });
  await d.waitForSelector(".appt-clinic", { timeout: 20000 });
  await d.waitForTimeout(1200);
  /* Small fixed nudge: enough to bring the tabs + clinic grid up without
     pulling the footer into frame (the page is short at this stage). */
  await d.evaluate(() => window.scrollBy(0, 190));
  await d.waitForTimeout(800);
  await shot(d, "appt-clinics");

  await d.locator(".appt-clinic").first().click();
  await d.waitForTimeout(900);
  const sel = d.locator(".appt-step select").first();
  const opts = await d.locator(".appt-step select option").all();
  await sel.selectOption(await opts[1].getAttribute("value"));
  await d.waitForSelector(".appt-slot", { timeout: 20000 });
  await d.waitForTimeout(1000);
  await d.locator(".appt-slot:not(.is-full)").nth(1).click();
  await d.waitForTimeout(900);
  await d.locator(".appt-step").nth(1).scrollIntoViewIfNeeded();
  await d.waitForTimeout(800);
  await shot(d, "appt-slots");

  // Patient form filled
  await d.locator(".appt-grid input").nth(0).fill("نورة عبدالله الرشيدي");
  await d.locator(".appt-grid input").nth(1).fill("1078451236");
  await d.locator(".appt-grid select").first().selectOption({ label: "سعودي" }).catch(() => {});
  await d.locator('.appt-grid input[inputmode="tel"]').fill("0551234567");
  await d.locator(".appt-dob input").fill("1995-03-18");
  await d.waitForTimeout(500);
  await d.locator(".appt-grid").scrollIntoViewIfNeeded();
  await d.waitForTimeout(800);
  await shot(d, "appt-form");

  await d.locator(".appt-submit").click();
  await d.waitForSelector(".appt-ref", { timeout: 20000 });
  await d.waitForTimeout(1500);
  await focus(d, ".appt-success", 0.08);
  await shot(d, "appt-success");

  // Tracking
  await d.goto(`${BASE}/appointments`, { waitUntil: "networkidle" });
  await d.waitForTimeout(1500);
  await d.locator('.appt-tabs button').nth(1).click();
  await d.waitForTimeout(700);
  await d.locator(".appt-lookup-form input").fill("HGH-260821-3947");
  await d.locator('.appt-lookup-form button[type="submit"]').click();
  await d.waitForSelector(".appt-card", { timeout: 20000 });
  await d.waitForTimeout(1500);
  await focus(d, ".appt-lookup-form", 0.06);
  await shot(d, "appt-track");

  await dctx.close();

  /* ---------- Mobile ---------- */
  const mctx = await browser.newContext({
    viewport: MOBILE, locale: "ar-SA", deviceScaleFactor: 2, isMobile: true, hasTouch: true
  });
  await stub(mctx);
  const m = await mctx.newPage();

  await m.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await m.waitForTimeout(2500);
  await shot(m, "home-mobile");

  await m.goto(`${BASE}/appointments`, { waitUntil: "networkidle" });
  await m.waitForSelector(".appt-clinic", { timeout: 20000 });
  await m.waitForTimeout(1500);
  await shot(m, "appt-mobile");

  await m.locator(".appt-clinic").first().click();
  await m.waitForTimeout(900);
  const msel = m.locator(".appt-step select").first();
  const mopts = await m.locator(".appt-step select option").all();
  await msel.selectOption(await mopts[1].getAttribute("value"));
  await m.waitForSelector(".appt-slot", { timeout: 20000 });
  await m.waitForTimeout(1200);
  await m.locator(".appt-slots").scrollIntoViewIfNeeded();
  await m.waitForTimeout(800);
  await shot(m, "appt-mobile-slots");

  await m.goto(`${BASE}/nursing`, { waitUntil: "networkidle" });
  await m.waitForTimeout(2400);
  await focus(m, ".nom-section", 0.04);
  await shot(m, "nursing-mobile");

  await mctx.close();
  await browser.close();

  console.log("SHOTS:", fs.readdirSync(OUT).join(", "));
}

main().catch((e) => { console.error(e); process.exit(1); });
