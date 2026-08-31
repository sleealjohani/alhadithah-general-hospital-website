/**
 * Finishing pass for the appointment demo capture:
 *   • trims the blank head recorded before first paint
 *   • frames the capture inside a realistic desktop browser window
 *     (traffic lights + address bar that flips when the route changes)
 *   • encodes a universally playable MP4
 *
 * Usage: node scripts/finish-appointment-demo.mjs
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DIR = process.env.OUT_DIR || "/tmp/appointment-demo";
/* Playwright's bundled ffmpeg is stripped (no overlay/H.264), so prefer a full
   build when one is present. */
const FF =
  process.env.FFMPEG ||
  "/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2";
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const W = 1280;
const BAR = 68;
const PAD = 26;
const DOMAIN = "had-hos.vercel.app";

const meta = JSON.parse(fs.readFileSync(path.join(DIR, "timeline.json"), "utf8"));
const src = path.join(DIR, "appointment-demo.webm");

/* ---- 1. Render the two address-bar states as PNGs ----------------------- */
const barHtml = (url) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0}
  body{width:${W}px;height:${BAR}px;display:flex;align-items:center;gap:14px;
    padding:0 18px;background:linear-gradient(180deg,#f3f5f8,#e7ebf0);
    border-bottom:1px solid #d3d9e0;
    font-family:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif}
  .dots{display:flex;gap:8px;flex:0 0 auto}
  .dots i{width:12px;height:12px;border-radius:50%;display:block}
  .r{background:#ff5f57}.y{background:#febc2e}.g{background:#28c840}
  .nav{display:flex;gap:14px;color:#8a949f;flex:0 0 auto;font-size:15px}
  .pill{flex:1;display:flex;align-items:center;gap:9px;height:36px;padding:0 15px;
    border-radius:18px;background:#fff;border:1px solid #dbe1e8;
    color:#3c4753;font-size:14px;letter-spacing:.01em}
  .lock{color:#5c7186;flex:0 0 auto}
  .host{color:#8a949f}
  .path{color:#12233a;font-weight:600}
</style></head><body>
  <div class="dots"><i class="r"></i><i class="y"></i><i class="g"></i></div>
  <div class="nav"><span>←</span><span>→</span><span>⟳</span></div>
  <div class="pill">
    <svg class="lock" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
      <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>
    <span><span class="host">${DOMAIN}</span><span class="path">${url}</span></span>
  </div>
</body></html>`;

async function renderBars() {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: W, height: BAR } });
  for (const [name, url] of [["bar-home.png", "/"], ["bar-appt.png", "/appointments"]]) {
    await page.setContent(barHtml(url));
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(DIR, name) });
  }
  await browser.close();
}

/* ---- 2. Compose ---------------------------------------------------------- */
function compose() {
  const head = Math.max(meta.headSeconds - 0.4, 0); // keep a beat before first paint
  const navAt = meta.navSeconds; // seconds into the TRIMMED video
  const out = path.join(DIR, "appointment-demo.mp4");

  const args = [
    "-y",
    "-i", src,
    "-i", path.join(DIR, "bar-home.png"),
    "-i", path.join(DIR, "bar-appt.png"),
    "-filter_complex",
    [
      // trim + reset timestamps
      `[0:v]trim=start=${head.toFixed(2)},setpts=PTS-STARTPTS[v]`,
      // stack a placeholder bar area above the page, then overlay each state
      `[v]pad=iw:ih+${BAR}:0:${BAR}:color=white[padded]`,
      `[padded][1:v]overlay=0:0:enable='lt(t,${navAt.toFixed(2)})'[withhome]`,
      `[withhome][2:v]overlay=0:0:enable='gte(t,${navAt.toFixed(2)})'[framed]`,
      // outer desk background + soft margin
      `[framed]pad=iw+${PAD * 2}:ih+${PAD * 2}:${PAD}:${PAD}:color=0x0e2841[out]`
    ].join(";"),
    "-map", "[out]",
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-r", "25",
    out
  ];
  execFileSync(FF, args, { stdio: ["ignore", "ignore", "pipe"] });
  return out;
}

const t0 = Date.now();
await renderBars();
const out = compose();
console.log("MP4:", out);
console.log("took", ((Date.now() - t0) / 1000).toFixed(1), "s");
