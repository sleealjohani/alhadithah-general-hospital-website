import { type FormEvent, useState } from "react";
import { Loader2, Send, Lightbulb, Target } from "lucide-react";
import { usePortal } from "../../../providers/PortalProvider";
import { Icon } from "../../../components/ui/Icon";
import { submitPortalForm, type PortalFormPayload } from "../../../lib/forms";
import { tx } from "../../../utils/i18n";
import type { FormKind, LocalizedText } from "../../../types";

export function PublicForm({ kind, title }: { kind: FormKind; title: LocalizedText }) {
  const { t, notify } = usePortal();
  const [payload, setPayload] = useState<PortalFormPayload>({});
  const [busy, setBusy] = useState(false);

  const update = (key: keyof PortalFormPayload, value: string) => {
    setPayload((current) => ({ ...current, [key]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const result = await submitPortalForm(kind, payload);
    setBusy(false);
    if (result.ok) {
      setPayload({});
      notify(
        result.source === "supabase"
          ? t(tx("تم إرسال النموذج بنجاح.", "Form submitted successfully."))
          : t(tx("تم حفظ النموذج محليًا للمعاينة.", "Saved locally for preview.")),
        "success"
      );
    } else {
      notify(result.message, "error");
    }
  };

  const isInitiative = kind === "initiative";
  const isGoodCatch = kind === "good_catch";

  return (
    <form className="portal-form" onSubmit={onSubmit}>
      <div className="form-header">
        {isGoodCatch ? <Target aria-hidden="true" size={22} /> : isInitiative ? <Lightbulb aria-hidden="true" size={22} /> : <Icon name="Send" />}
        <h2>{t(title)}</h2>
      </div>
      <div className="form-grid">
        <label>
          {t(tx("الاسم", "Name"))}
          <input
            value={payload.name || ""}
            onChange={(event) => update("name", event.target.value)}
            placeholder={t(tx("اختياري", "Optional"))}
          />
        </label>
        <label>
          {t(tx("البريد الإلكتروني", "Email"))}
          <input
            type="email"
            value={payload.email || ""}
            onChange={(event) => update("email", event.target.value)}
            placeholder={t(tx("اختياري", "Optional"))}
          />
        </label>
        <label>
          {t(tx("التصنيف", "Category"))}
          <select value={payload.category || ""} onChange={(event) => update("category", event.target.value)}>
            <option value="">{t(tx("اختر", "Select"))}</option>
            <option value="general">{t(tx("عام", "General"))}</option>
            <option value="service">{t(tx("خدمة", "Service"))}</option>
            <option value="quality">{t(tx("جودة", "Quality"))}</option>
            <option value="other">{t(tx("أخرى", "Other"))}</option>
          </select>
        </label>
        <label>
          {t(tx("القسم المرتبط", "Related department"))}
          <input
            value={payload.department || ""}
            onChange={(event) => update("department", event.target.value)}
            placeholder={t(tx("اختياري", "Optional"))}
          />
        </label>
      </div>
      <label>
        {isInitiative ? t(tx("عنوان المبادرة", "Initiative title")) : t(tx("الموضوع", "Subject"))}
        <input
          required
          value={payload.subject || payload.title || ""}
          onChange={(event) => {
            update("subject", event.target.value);
            update("title", event.target.value);
          }}
        />
      </label>
      {isGoodCatch ? (
        <label>
          {t(tx("الموقع العام للملاحظة", "General observation location"))}
          <input
            value={payload.location || ""}
            onChange={(event) => update("location", event.target.value)}
            placeholder={t(tx("بدون بيانات مرضى", "No patient data"))}
          />
        </label>
      ) : null}
      <label>
        {isInitiative
          ? t(tx("الأثر المتوقع", "Expected impact"))
          : t(tx("الرسالة", "Message"))}
        <textarea
          required
          minLength={10}
          value={payload.message || payload.expectedImpact || ""}
          onChange={(event) => {
            update("message", event.target.value);
            update("expectedImpact", event.target.value);
          }}
          placeholder={t(
            tx(
              "اكتب تفاصيل عامة فقط، بدون معلومات طبية حساسة.",
              "Write general details only, without sensitive medical information."
            )
          )}
        />
      </label>
      <button className="btn btn-primary" disabled={busy} type="submit">
        {busy ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
        {t(tx("إرسال", "Submit"))}
      </button>
    </form>
  );
}
