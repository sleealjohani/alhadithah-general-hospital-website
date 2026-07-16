import { Award, Sparkles } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { tx } from "../../utils/i18n";
import type { NursingSpotlight } from "../../lib/supabase/nursing";

/* Deterministic sparkle field — fixed positions so the gold flecks feel placed,
   not random noise, and stay identical between renders. */
const SPARKLES = [
  { top: "8%", left: "10%", size: 14, delay: "0s" },
  { top: "16%", left: "86%", size: 10, delay: "0.6s" },
  { top: "30%", left: "4%", size: 8, delay: "1.2s" },
  { top: "72%", left: "8%", size: 12, delay: "0.3s" },
  { top: "82%", left: "90%", size: 16, delay: "0.9s" },
  { top: "50%", left: "94%", size: 9, delay: "1.5s" },
  { top: "90%", left: "40%", size: 10, delay: "0.45s" },
  { top: "6%", left: "52%", size: 11, delay: "1.1s" }
];

export function NurseOfMonth({ spotlight }: { spotlight: NursingSpotlight }) {
  const { t, locale } = usePortal();
  const name = spotlight.name;
  const specialty = spotlight.specialty || "";
  const monthLabel = t(tx(spotlight.month_label_ar || "", spotlight.month_label_en || ""));
  const message = t(tx(spotlight.message_ar || "", spotlight.message_en || ""));
  const rawAchievements = locale === "ar" ? spotlight.achievements_ar : spotlight.achievements_en;
  const achievements = (rawAchievements || spotlight.achievements_ar || spotlight.achievements_en || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•*\s]+/, "").trim())
    .filter(Boolean);

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <div className="nom-stage">
      <div className="nom-flip" tabIndex={0} aria-label={t(tx("ممرض/ممرضة الشهر", "Nurse of the month"))}>
        {/* ---- Front ---- */}
        <div className="nom-face nom-front">
          <div className="nom-sparkles" aria-hidden="true">
            {SPARKLES.map((s, i) => (
              <span
                key={i}
                className="nom-sparkle"
                style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay }}
              />
            ))}
          </div>
          <span className="nom-ribbon">
            <Award size={15} />
            {monthLabel || t(tx("ممرض الشهر", "Nurse of the Month"))}
          </span>
          <div className="nom-portrait">
            {spotlight.photo_url ? <img src={spotlight.photo_url} alt={name} /> : <span className="nom-initials">{initials}</span>}
            <span className="nom-portrait-ring" aria-hidden="true" />
          </div>
          <h3 className="nom-name">{name}</h3>
          {specialty ? <p className="nom-specialty">{specialty}</p> : null}
          {message ? <p className="nom-message">{message}</p> : null}
          {achievements.length > 0 ? (
            <span className="nom-flip-hint">
              <Sparkles size={13} />
              {t(tx("مرّر المؤشر لعرض إنجازاتها", "Hover to see the achievements"))}
            </span>
          ) : null}
        </div>

        {/* ---- Back ---- */}
        <div className="nom-face nom-back">
          <span className="nom-ribbon nom-ribbon-back">
            <Sparkles size={15} />
            {t(tx("لماذا تستحق هذا التكريم", "Why she earned it"))}
          </span>
          <h3 className="nom-name nom-name-back">{name}</h3>
          {achievements.length > 0 ? (
            <ul className="nom-achievements">
              {achievements.map((line, i) => (
                <li key={i}>
                  <Award size={15} />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="nom-message">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
