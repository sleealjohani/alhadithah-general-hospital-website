import { useState } from "react";
import { SkipForward, Star } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { tx } from "../../utils/i18n";

export type Feedback = {
  overall: number | null;
  content: number | null;
  benefit: string;
  recommend: boolean | null;
  comment: string;
};

/* Skippable satisfaction questionnaire shown right before the certificate. */
export function FeedbackDialog({
  onSkip,
  onSubmit
}: {
  onSkip: () => void;
  onSubmit: (fb: Feedback) => void;
}) {
  const { t } = usePortal();
  const [overall, setOverall] = useState<number | null>(null);
  const [content, setContent] = useState<number | null>(null);
  const [benefit, setBenefit] = useState("");
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");

  return (
    <div className="palette-backdrop" onClick={onSkip}>
      <div className="palette-dialog modal-dialog attend-feedback" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{t(tx("رأيك يهمّنا", "Your feedback matters"))}</h2>
        </div>
        <div className="modal-body">
          <p className="muted attend-feedback-intro">
            {t(tx("قيّم تجربتك في الدورة (اختياري — يمكنك التخطي).", "Rate your experience (optional — you can skip)."))}
          </p>

          <Stars label={tx("التقييم العام", "Overall rating")} value={overall} onChange={setOverall} />
          <Stars label={tx("فائدة المحتوى", "Content usefulness")} value={content} onChange={setContent} />

          <label className="attend-fb-field">
            {t(tx("ما مدى استفادتك من الدورة؟", "How much did you benefit?"))}
            <textarea value={benefit} onChange={(e) => setBenefit(e.target.value)} dir="auto" rows={2} />
          </label>

          <div className="attend-fb-field">
            <span>{t(tx("هل توصي بها لزملائك؟", "Would you recommend it?"))}</span>
            <div className="attend-fb-yesno">
              <button type="button" className={`chip ${recommend === true ? "is-active" : ""}`} onClick={() => setRecommend(true)}>
                {t(tx("نعم", "Yes"))}
              </button>
              <button type="button" className={`chip ${recommend === false ? "is-active" : ""}`} onClick={() => setRecommend(false)}>
                {t(tx("لا", "No"))}
              </button>
            </div>
          </div>

          <label className="attend-fb-field">
            {t(tx("ملاحظات إضافية", "Additional comments"))}
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} dir="auto" rows={2} />
          </label>

          <div className="attend-fb-actions">
            <button type="button" className="btn btn-ghost" onClick={onSkip}>
              <SkipForward size={16} />
              {t(tx("تخطّي", "Skip"))}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onSubmit({ overall, content, benefit, recommend, comment })}
            >
              {t(tx("إرسال والمتابعة للشهادة", "Submit & continue"))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stars({
  label,
  value,
  onChange
}: {
  label: ReturnType<typeof tx>;
  value: number | null;
  onChange: (n: number) => void;
}) {
  const { t } = usePortal();
  return (
    <div className="attend-fb-field">
      <span>{t(label)}</span>
      <div className="attend-stars" role="radiogroup" aria-label={t(label)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`attend-star ${value && n <= value ? "is-on" : ""}`}
            aria-label={`${n}`}
            aria-checked={value === n}
            role="radio"
            onClick={() => onChange(n)}
          >
            <Star size={26} />
          </button>
        ))}
      </div>
    </div>
  );
}
