import { type FormEvent, useState } from "react";
import { Loader2, Send, Lightbulb, Target } from "lucide-react";
import { usePortal } from "../../../providers/PortalProvider";
import { Icon } from "../../../components/ui/Icon";
import { submitPortalForm, type PortalFormPayload } from "../../../lib/forms";
import { tx } from "../../../utils/i18n";
import type { FormKind, LocalizedText } from "../../../types";

type FieldName = "email" | "subject" | "message";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PublicForm({ kind, title }: { kind: FormKind; title: LocalizedText }) {
  const { t, notify } = usePortal();
  const [payload, setPayload] = useState<PortalFormPayload>({});
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});

  const update = (key: keyof PortalFormPayload, value: string) => {
    setPayload((current) => ({ ...current, [key]: value }));
  };

  const fieldError = (field: FieldName, value: string): string | undefined => {
    switch (field) {
      case "email":
        return value && !EMAIL_PATTERN.test(value)
          ? t(tx("صيغة البريد الإلكتروني غير صحيحة.", "That email address doesn't look right."))
          : undefined;
      case "subject":
        return value.trim() ? undefined : t(tx("هذا الحقل مطلوب.", "This field is required."));
      case "message":
        return value.trim().length >= 10
          ? undefined
          : t(tx("اكتب ١٠ أحرف على الأقل.", "Write at least 10 characters."));
    }
  };

  /* Validate on blur — not on every keystroke — and clear the error as soon
     as the visitor edits the field again. */
  const validateOnBlur = (field: FieldName, value: string) => {
    setErrors((current) => ({ ...current, [field]: fieldError(field, value) }));
  };

  const clearError = (field: FieldName) => {
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: typeof errors = {
      email: fieldError("email", payload.email || ""),
      subject: fieldError("subject", payload.subject || payload.title || ""),
      message: fieldError("message", payload.message || payload.expectedImpact || "")
    };
    setErrors(nextErrors);
    const firstInvalid = Object.entries(nextErrors).find(([, message]) => message)?.[0];
    if (firstInvalid) {
      const el = event.currentTarget.querySelector<HTMLElement>(`[data-field="${firstInvalid}"]`);
      el?.focus();
      return;
    }
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
    <form className="portal-form" onSubmit={onSubmit} noValidate>
      <div className="form-header">
        {isGoodCatch ? <Target aria-hidden="true" size={22} /> : isInitiative ? <Lightbulb aria-hidden="true" size={22} /> : <Icon name="Send" />}
        <h2>{t(title)}</h2>
      </div>
      <div className="form-grid">
        <label>
          {t(tx("الاسم", "Name"))}
          <input
            value={payload.name || ""}
            autoComplete="name"
            onChange={(event) => update("name", event.target.value)}
            placeholder={t(tx("اختياري", "Optional"))}
          />
        </label>
        <label>
          {t(tx("البريد الإلكتروني", "Email"))}
          <input
            type="email"
            data-field="email"
            autoComplete="email"
            inputMode="email"
            dir="ltr"
            value={payload.email || ""}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "form-error-email" : undefined}
            onChange={(event) => {
              update("email", event.target.value);
              clearError("email");
            }}
            onBlur={(event) => validateOnBlur("email", event.target.value)}
            placeholder={t(tx("اختياري", "Optional"))}
          />
          {errors.email ? (
            <span className="field-error" id="form-error-email">
              {errors.email}
            </span>
          ) : null}
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
          data-field="subject"
          value={payload.subject || payload.title || ""}
          aria-invalid={errors.subject ? true : undefined}
          aria-describedby={errors.subject ? "form-error-subject" : undefined}
          onChange={(event) => {
            update("subject", event.target.value);
            update("title", event.target.value);
            clearError("subject");
          }}
          onBlur={(event) => validateOnBlur("subject", event.target.value)}
        />
        {errors.subject ? (
          <span className="field-error" id="form-error-subject">
            {errors.subject}
          </span>
        ) : null}
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
          data-field="message"
          value={payload.message || payload.expectedImpact || ""}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "form-error-message" : undefined}
          onBlur={(event) => validateOnBlur("message", event.target.value)}
          onChange={(event) => {
            update("message", event.target.value);
            update("expectedImpact", event.target.value);
            clearError("message");
          }}
          placeholder={t(
            tx(
              "اكتب تفاصيل عامة فقط، بدون معلومات طبية حساسة.",
              "Write general details only, without sensitive medical information."
            )
          )}
        />
        {errors.message ? (
          <span className="field-error" id="form-error-message">
            {errors.message}
          </span>
        ) : null}
      </label>
      <button className="btn btn-primary" disabled={busy} type="submit">
        {busy ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
        {t(tx("إرسال", "Submit"))}
      </button>
    </form>
  );
}
