import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { usePortal } from "../../providers/PortalProvider";
import { tx } from "../../utils/i18n";

/* Dependency-free image cropper. Shows the picked file with a draggable +
   resizable crop box (optionally locked to an aspect ratio), then renders the
   selected region onto a canvas and hands back a cropped Blob — no external
   libraries, so it works under the Artifact/CSP sandbox and adds no bundle. */

type Rect = { x: number; y: number; w: number; h: number };
type Aspect = { label: string; value: number | null };

const ASPECTS: Aspect[] = [
  { label: "حر", value: null },
  { label: "1:1", value: 1 },
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 }
];

const MIN = 32;

export function ImageCropModal({
  file,
  defaultAspect = null,
  onCancel,
  onCropped,
  onUseOriginal
}: {
  file: File;
  defaultAspect?: number | null;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
  onUseOriginal: () => void;
}) {
  const { t } = usePortal();
  const [src, setSrc] = useState("");
  const [aspect, setAspect] = useState<number | null>(defaultAspect);
  const [rect, setRect] = useState<Rect | null>(null);
  const [disp, setDisp] = useState({ w: 0, h: 0 });
  const natural = useRef({ w: 0, h: 0 });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ mode: "move" | "resize"; sx: number; sy: number; rect: Rect } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  /* Build a centred crop box for the current aspect within the displayed image. */
  const centeredRect = (dw: number, dh: number, ar: number | null): Rect => {
    let w = dw * 0.86;
    let h = dh * 0.86;
    if (ar) {
      if (w / h > ar) w = h * ar;
      else h = w / ar;
    }
    return { x: (dw - w) / 2, y: (dh - h) / 2, w, h };
  };

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    natural.current = { w: img.naturalWidth, h: img.naturalHeight };
    const dw = img.clientWidth;
    const dh = img.clientHeight;
    setDisp({ w: dw, h: dh });
    setRect(centeredRect(dw, dh, aspect));
  };

  const pickAspect = (ar: number | null) => {
    setAspect(ar);
    if (disp.w) setRect(centeredRect(disp.w, disp.h, ar));
  };

  const clamp = (r: Rect): Rect => {
    const w = Math.min(r.w, disp.w);
    const h = Math.min(r.h, disp.h);
    return {
      w,
      h,
      x: Math.max(0, Math.min(r.x, disp.w - w)),
      y: Math.max(0, Math.min(r.y, disp.h - h))
    };
  };

  const startDrag = (mode: "move" | "resize") => (e: React.PointerEvent) => {
    if (!rect) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { mode, sx: e.clientX, sy: e.clientY, rect };
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || !rect) return;
    const dx = e.clientX - drag.current.sx;
    const dy = e.clientY - drag.current.sy;
    const base = drag.current.rect;
    if (drag.current.mode === "move") {
      setRect(clamp({ ...base, x: base.x + dx, y: base.y + dy }));
    } else {
      let w = Math.max(MIN, base.w + dx);
      let h = aspect ? w / aspect : Math.max(MIN, base.h + dy);
      if (base.x + w > disp.w) {
        w = disp.w - base.x;
        if (aspect) h = w / aspect;
      }
      if (base.y + h > disp.h) {
        h = disp.h - base.y;
        if (aspect) w = h * aspect;
      }
      setRect({ ...base, w: Math.max(MIN, w), h: Math.max(MIN, h) });
    }
  };

  const endDrag = () => {
    drag.current = null;
  };

  const apply = () => {
    if (!rect) return;
    const scaleX = natural.current.w / disp.w;
    const scaleY = natural.current.h / disp.h;
    const sx = rect.x * scaleX;
    const sy = rect.y * scaleY;
    const sw = rect.w * scaleX;
    const sh = rect.h * scaleY;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      if (!ctx) return onUseOriginal();
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      const type = file.type === "image/png" ? "image/png" : "image/jpeg";
      canvas.toBlob((blob) => (blob ? onCropped(blob) : onUseOriginal()), type, 0.92);
    };
    img.src = src;
  };

  return (
    <Modal title={t(tx("قص الصورة", "Crop image"))} onClose={onCancel} wide>
      <div className="cropper">
        <div className="cropper-aspects">
          {ASPECTS.map((a) => (
            <button
              key={a.label}
              type="button"
              className={`chip ${aspect === a.value ? "is-active" : ""}`}
              onClick={() => pickAspect(a.value)}
            >
              {a.value === null ? t(tx("حر", "Free")) : a.label}
            </button>
          ))}
        </div>

        <div className="cropper-stage" ref={stageRef} onPointerMove={onMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
          {src ? <img src={src} alt="" className="cropper-img" onLoad={onImgLoad} draggable={false} /> : null}
          {rect ? (
            <div
              className="cropper-box"
              style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
              onPointerDown={startDrag("move")}
            >
              <span className="cropper-grid" aria-hidden="true" />
              <span className="cropper-handle" onPointerDown={startDrag("resize")} />
            </div>
          ) : null}
        </div>

        <p className="cropper-hint muted">
          {t(tx("اسحب المربع لتحريكه، ومن الزاوية لتغيير حجمه.", "Drag the box to move it, and the corner to resize."))}
        </p>

        <div className="cropper-actions">
          <button type="button" className="btn btn-ghost" onClick={onUseOriginal}>
            {t(tx("استخدام الأصلية", "Use original"))}
          </button>
          <button type="button" className="btn btn-primary" onClick={apply}>
            <Check size={16} />
            {t(tx("قص ورفع", "Crop & upload"))}
          </button>
        </div>
      </div>
    </Modal>
  );
}
