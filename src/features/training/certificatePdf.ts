import { certField, type CertFieldKey, type TrainingConfig } from "../../lib/supabase/attendance";
import type { Bytes } from "../../lib/zip";

/**
 * Renders the certificate to a high-resolution canvas and saves it as a clean
 * A4-landscape PDF — no browser print chrome, URL/date headers, or scaling
 * issues. The canvas mirrors the on-screen overlay: background image (contained)
 * with the configured fields drawn on top at the same relative positions.
 */

const KEYS: CertFieldKey[] = ["name", "employee_number", "course", "duration", "date"];
const AR_RE = /[؀-ۿ]/;

/* Fetch → data URL so cross-origin backgrounds never taint the canvas. */
async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { mode: "cors" });
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawFallbackFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  eyebrow: string,
  sub: string
) {
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#c89a4c";
  ctx.lineWidth = w * 0.004;
  const m = w * 0.04;
  ctx.strokeRect(m, m, w - m * 2, h - m * 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#7a5220";
  ctx.font = `800 ${w * 0.04}px "Janna LT","Poppins",sans-serif`;
  ctx.fillText(eyebrow, w / 2, h * 0.16);
  ctx.fillStyle = "#435a72";
  ctx.font = `700 ${w * 0.022}px "Janna LT","Poppins",sans-serif`;
  ctx.fillText(sub, w / 2, h * 0.23);
}

/**
 * Loads the configured background once. Bulk exports render dozens of sheets
 * from the same image, so fetching and decoding it per certificate would be
 * pure waste — resolve this once and pass it in.
 */
export async function prepareCertificateBackground(
  config: TrainingConfig
): Promise<HTMLImageElement | null> {
  if (!config.cert_bg_url) return null;
  try {
    return await loadImage(await toDataUrl(config.cert_bg_url));
  } catch {
    return null;
  }
}

export type CertificateOpts = {
  rtl: boolean;
  fallbackEyebrow: string;
  fallbackSub: string;
  /* Pass a preloaded background to skip the per-certificate fetch. */
  background?: HTMLImageElement | null;
};

/* Renders one certificate and hands back the PDF bytes. */
export async function renderCertificatePdf(
  config: TrainingConfig,
  values: Record<CertFieldKey, string>,
  opts: CertificateOpts
): Promise<Bytes | null> {
  const W = 2480;
  const H = Math.round((W * 210) / 297); // A4 landscape ratio
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  const img = opts.background === undefined ? await prepareCertificateBackground(config) : opts.background;
  if (img) {
    const s = Math.min(W / img.width, H / img.height);
    const dw = img.width * s;
    const dh = img.height * s;
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  } else {
    drawFallbackFrame(ctx, W, H, opts.fallbackEyebrow, opts.fallbackSub);
  }

  /* Make sure the bundled fonts are ready before measuring/drawing text. */
  try {
    await Promise.all([
      document.fonts.load(`700 60px "Janna LT"`),
      document.fonts.load(`400 40px "Janna LT"`),
      document.fonts.load(`700 60px "Poppins"`)
    ]);
    await document.fonts.ready;
  } catch {
    /* fonts optional */
  }

  ctx.direction = opts.rtl ? "rtl" : "ltr";
  const boxW = 0.9 * W;

  for (const key of KEYS) {
    const f = certField(config, key);
    const text = values[key];
    if (!f.enabled || !text) continue;
    const px = (f.size / 1000) * W;
    const family = AR_RE.test(text) ? '"Janna LT","IBM Plex Sans Arabic",sans-serif' : '"Poppins","Inter",sans-serif';
    ctx.font = `${f.weight} ${px}px ${family}`;
    ctx.fillStyle = f.color;
    ctx.textBaseline = "middle";

    const cx = (f.x / 100) * W;
    const cy = (f.y / 100) * H;
    let align: CanvasTextAlign = "center";
    let drawX = cx;
    if (f.align === "center") {
      align = "center";
      drawX = cx;
    } else if (f.align === "start") {
      align = opts.rtl ? "right" : "left";
      drawX = opts.rtl ? cx + boxW / 2 : cx - boxW / 2;
    } else {
      align = opts.rtl ? "left" : "right";
      drawX = opts.rtl ? cx - boxW / 2 : cx + boxW / 2;
    }
    ctx.textAlign = align;

    const lines = wrapText(ctx, text, boxW);
    const lineH = px * 1.25;
    let y = cy - (lineH * (lines.length - 1)) / 2;
    for (const line of lines) {
      ctx.fillText(line, drawX, y);
      y += lineH;
    }
  }

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 297, 210);
  return new Uint8Array(pdf.output("arraybuffer"));
}

/* Single-certificate download — same renderer, saved straight to disk. */
export async function downloadCertificatePdf(
  config: TrainingConfig,
  values: Record<CertFieldKey, string>,
  opts: CertificateOpts & { filename: string }
): Promise<void> {
  const bytes = await renderCertificatePdf(config, values, opts);
  if (!bytes) return;
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = opts.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
