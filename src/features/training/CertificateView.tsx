import { useEffect, useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { tx } from "../../utils/i18n";
import { certField, type CertFieldKey, type TrainingConfig } from "../../lib/supabase/attendance";
import { downloadCertificatePdf } from "./certificatePdf";

/**
 * Certificate preview + one-click PDF download. The uploaded background
 * (image/PDF page exported as an image) fills a landscape sheet with the dynamic
 * fields overlaid at the admin-configured positions. Download renders the same
 * layout to a high-res canvas and saves a clean A4 PDF — no browser print chrome
 * or scaling issues. A branded fallback is drawn if no background is set.
 */
export function CertificateView({
  config,
  values,
  onClose,
  onDownloaded
}: {
  config: TrainingConfig;
  values: Record<CertFieldKey, string>;
  onClose: () => void;
  onDownloaded?: () => void;
}) {
  const { t, isRtl } = usePortal();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const download = async () => {
    setBusy(true);
    try {
      const safe = (values.name || "certificate").replace(/[^\p{L}\p{N}\-_ ]/gu, "").trim().replace(/\s+/g, "-");
      await downloadCertificatePdf(config, values, {
        rtl: isRtl,
        filename: `certificate-${safe || "attendee"}.pdf`,
        fallbackEyebrow: t(tx("شهادة حضور", "Certificate of Attendance")),
        fallbackSub: t(tx("مستشفى الحديثة العام", "Hadetha General Hospital"))
      });
      onDownloaded?.();
    } finally {
      setBusy(false);
    }
  };

  const keys: CertFieldKey[] = ["name", "employee_number", "course", "duration", "date"];
  const hasBg = Boolean(config.cert_bg_url);

  return (
    <div className="cert-overlay">
      <div className="cert-toolbar">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          <X size={16} />
          {t(tx("إغلاق", "Close"))}
        </button>
        <button type="button" className="btn btn-primary" onClick={download} disabled={busy}>
          {busy ? <Loader2 className="spin" size={16} /> : <Download size={16} />}
          {t(tx("تنزيل الشهادة PDF", "Download certificate (PDF)"))}
        </button>
      </div>

      <div className="cert-print-root">
        <div className={`cert-sheet ${hasBg ? "" : "cert-sheet-fallback"}`}>
          {hasBg ? <img className="cert-bg" src={config.cert_bg_url!} alt="" /> : null}

          {!hasBg ? (
            <div className="cert-fallback-frame">
              <span className="cert-fallback-eyebrow">{t(tx("شهادة حضور", "Certificate of Attendance"))}</span>
              <span className="cert-fallback-sub">{t(tx("مستشفى الحديثة العام", "Hadetha General Hospital"))}</span>
            </div>
          ) : null}

          {keys.map((key) => {
            const f = certField(config, key);
            if (!f.enabled || !values[key]) return null;
            return (
              <span
                key={key}
                className="cert-field"
                style={{
                  left: `${f.x}%`,
                  top: `${f.y}%`,
                  transform: `translate(-50%, -50%)`,
                  /* Size is authored against a 1000px-wide reference; cqw keeps it
                     proportional to the on-screen sheet. */
                  fontSize: `${(f.size / 1000) * 100}cqw`,
                  color: f.color,
                  fontWeight: f.weight,
                  textAlign: f.align,
                  width: "90%"
                }}
              >
                {values[key]}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
