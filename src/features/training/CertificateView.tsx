import { useEffect } from "react";
import { Printer, X } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { tx } from "../../utils/i18n";
import { certField, type CertFieldKey, type TrainingConfig } from "../../lib/supabase/attendance";

/**
 * Print-ready certificate. The uploaded background (image/PDF page exported as an
 * image) fills a landscape sheet and the dynamic fields are overlaid at the
 * admin-configured positions. Printing via the browser gives a clean, vector
 * PDF over the background. If no background is set, a branded fallback is drawn.
 */
export function CertificateView({
  config,
  values,
  onClose,
  onPrinted
}: {
  config: TrainingConfig;
  values: Record<CertFieldKey, string>;
  onClose: () => void;
  onPrinted?: () => void;
}) {
  const { t } = usePortal();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const print = () => {
    onPrinted?.();
    window.print();
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
        <button type="button" className="btn btn-primary" onClick={print}>
          <Printer size={16} />
          {t(tx("طباعة / حفظ PDF", "Print / Save PDF"))}
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
                     proportional whether shown on screen or filling a print page. */
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
