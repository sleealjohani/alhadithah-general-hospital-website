import { useMemo, useState } from "react";
import { Award, Loader2, Search, Sparkles } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { usePortal } from "../../providers/PortalProvider";
import { tx } from "../../utils/i18n";
import { identity } from "../../data/content";
import { eventToCertConfig, lookupCertificate, type CertificateResult } from "../../lib/supabase/certificates";
import { certField, type CertFieldKey } from "../../lib/supabase/attendance";
import { CertificateView } from "./CertificateView";

/**
 * Mobile-first, self-service certificate portal. The employee enters their ID
 * or employee number, a celebratory "thank you" splash plays, and the
 * certificate appears — downloadable as a clean PDF via the shared renderer.
 */
export function CertificateLookupPage() {
  const { t, locale, isRtl } = usePortal();
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CertificateResult | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [showCert, setShowCert] = useState(false);

  usePageMeta(
    tx("شهادات حضور المحاضرات | مستشفى الحديثة العام", "Lecture certificates | Hadetha General Hospital"),
    tx("استخرج شهادة حضورك برقم الهوية أو الرقم الوظيفي.", "Retrieve your attendance certificate using your ID or employee number.")
  );

  const lectureTitle = result ? t(tx(result.title_ar, result.title_en || result.title_ar)) : "";

  const certConfig = useMemo(() => (result ? eventToCertConfig(result) : null), [result]);
  const certValues: Record<CertFieldKey, string> | null = useMemo(() => {
    if (!result) return null;
    const duration = t(tx(result.duration_ar || "", result.duration_en || ""));
    return {
      name: result.full_name,
      employee_number: result.employee_number || "",
      course: lectureTitle,
      duration,
      date: new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", { dateStyle: "long" }).format(
        new Date(result.lecture_date)
      )
    };
  }, [result, lectureTitle, t, locale]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setBusy(true);
    setError("");
    const r = await lookupCertificate(identifier);
    setBusy(false);
    if (!r.data) {
      setError(
        r.error === "not_found"
          ? t(tx("لم نجد شهادة مرتبطة بهذا الرقم. تأكد من الرقم وحاول مجددًا.", "No certificate was found for this number. Check it and try again."))
          : t(tx("تعذّر الاتصال بالخدمة. حاول لاحقًا.", "The service is unavailable. Try again later."))
      );
      return;
    }
    setCelebrate(true);
    window.setTimeout(() => {
      setResult(r.data);
      setCelebrate(false);
    }, 2100);
  };

  const reset = () => {
    setResult(null);
    setIdentifier("");
    setError("");
  };

  return (
    <div className="clp" dir={isRtl ? "rtl" : "ltr"}>
      <header className="clp-header">
        <img src={identity.lockupWhite} alt={t(tx("مستشفى الحديثة العام", "Hadetha General Hospital"))} className="clp-logo" />
        <span>{t(tx("الشؤون الأكاديمية والتدريب", "Academic Affairs & Training"))}</span>
      </header>

      <main className="clp-main">
        {celebrate ? (
          <div className="clp-thanks" role="status">
            <span className="clp-thanks-badge">
              <Award size={64} />
              <span className="clp-thanks-sparks" aria-hidden="true">
                {Array.from({ length: 10 }).map((_, i) => (
                  <i key={i} style={{ ["--i" as string]: i }} />
                ))}
              </span>
            </span>
            <h1>{t(tx("شكرًا لحضورك!", "Thank you for attending!"))}</h1>
            <p>{t(tx("نُقدّر مشاركتك ونتمنى لك دوام التوفيق.", "We appreciate your participation and wish you continued success."))}</p>
          </div>
        ) : !result ? (
          <section className="clp-card">
            <span className="clp-icon">
              <Award size={34} />
            </span>
            <h1>{t(tx("استخرج شهادة حضورك", "Get your attendance certificate"))}</h1>
            <p>{t(tx("أدخل رقم الهوية أو الرقم الوظيفي المسجّل لدى إدارة التدريب.", "Enter the national ID or employee number registered with Training."))}</p>
            <form onSubmit={submit} className="clp-form">
              <label htmlFor="clp-id">{t(tx("رقم الهوية أو الرقم الوظيفي", "National ID or employee number"))}</label>
              <input
                id="clp-id"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                autoComplete="off"
                placeholder={t(tx("اكتب الرقم هنا", "Enter the number"))}
              />
              {error ? <p className="clp-error" role="alert">{error}</p> : null}
              <button className="btn btn-primary clp-submit" disabled={busy || !identifier}>
                {busy ? <Loader2 className="spin" size={18} /> : <Search size={18} />}
                {t(tx("عرض الشهادة", "View certificate"))}
              </button>
            </form>
          </section>
        ) : (
          <section className="clp-result">
            <span className="clp-result-badge">
              <Sparkles size={22} />
            </span>
            <h1>{result.full_name}</h1>
            <p className="clp-result-lead">
              {t(tx("تهانينا! شهادتك عن محاضرة", "Congratulations! Your certificate for"))}
            </p>
            <p className="clp-result-lecture">{lectureTitle}</p>
            <time className="clp-result-date">
              {new Intl.DateTimeFormat(isRtl ? "ar-SA" : "en-GB", { dateStyle: "long" }).format(new Date(result.lecture_date))}
            </time>

            {certConfig && certValues ? (
              <div className="clp-preview" onClick={() => setShowCert(true)}>
                <div className="cert-sheet-mini">
                  <CertMiniPreview config={certConfig} values={certValues} />
                </div>
                <span className="clp-preview-hint">{t(tx("اضغط للعرض والتنزيل", "Tap to view & download"))}</span>
              </div>
            ) : null}

            <div className="clp-actions">
              <button className="btn btn-primary" onClick={() => setShowCert(true)}>
                <Award size={18} />
                {t(tx("عرض وتنزيل الشهادة", "View & download certificate"))}
              </button>
              <button className="btn btn-ghost" onClick={reset}>
                {t(tx("البحث عن شهادة أخرى", "Find another certificate"))}
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="clp-footer">
        {t(tx("مستشفى الحديثة العام — تجمع الجوف الصحي", "Hadetha General Hospital — Al-Jouf Health Cluster"))}
      </footer>

      {showCert && certConfig && certValues ? (
        <CertificateView config={certConfig} values={certValues} onClose={() => setShowCert(false)} />
      ) : null}
    </div>
  );
}

/* Reuses the exact certificate layout at thumbnail scale for the preview. */
function CertMiniPreview({
  config,
  values
}: {
  config: ReturnType<typeof eventToCertConfig>;
  values: Record<CertFieldKey, string>;
}) {
  // Reuse CertificateView's markup indirectly by rendering a static sheet.
  const keys: CertFieldKey[] = ["name", "employee_number", "course", "duration", "date"];
  const hasBg = Boolean(config.cert_bg_url);
  return (
    <div className={`cert-sheet ${hasBg ? "" : "cert-sheet-fallback"}`}>
      {hasBg ? <img className="cert-bg" src={config.cert_bg_url!} alt="" /> : null}
      {!hasBg ? (
        <div className="cert-fallback-frame">
          <span className="cert-fallback-eyebrow">شهادة حضور</span>
          <span className="cert-fallback-sub">مستشفى الحديثة العام</span>
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
              transform: "translate(-50%, -50%)",
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
  );
}
