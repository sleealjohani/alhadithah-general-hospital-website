import { useState } from "react";
import { Award, Heart, Sparkles } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { tx } from "../../utils/i18n";
import type { NursingSpotlight } from "../../lib/supabase/nursing";

/* Deterministic sparkle field — fixed positions so the gold flecks feel placed,
   not random noise, and stay identical between renders. */
const SPARKLES = [
  { top: "10%", left: "12%", size: 12, delay: "0s" },
  { top: "18%", left: "84%", size: 9, delay: "0.6s" },
  { top: "34%", left: "6%", size: 7, delay: "1.2s" },
  { top: "70%", left: "10%", size: 11, delay: "0.3s" },
  { top: "80%", left: "88%", size: 14, delay: "0.9s" },
  { top: "52%", left: "92%", size: 8, delay: "1.5s" },
  { top: "88%", left: "44%", size: 9, delay: "0.45s" },
  { top: "8%", left: "50%", size: 10, delay: "1.1s" }
];

/* A small laurel-and-gem divider — the classic "award / congratulations"
   flourish, drawn in gold to match the Sand accent ramp. */
function LaurelDivider() {
  return (
    <svg className="nom-laurel" viewBox="0 0 220 34" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M104 17 H150" opacity="0.5" />
        <path d="M116 17 q10 -9 22 -7 q-9 6 -22 7Z" fill="currentColor" stroke="none" />
        <path d="M124 17 q9 -11 22 -11 q-8 8 -22 11Z" fill="currentColor" stroke="none" opacity="0.8" />
        <path d="M116 17 q10 9 22 7 q-9 -6 -22 -7Z" fill="currentColor" stroke="none" />
        <path d="M124 17 q9 11 22 11 q-8 -8 -22 -11Z" fill="currentColor" stroke="none" opacity="0.8" />
        <path d="M116 17 H70" opacity="0.5" />
        <path d="M104 17 q-10 -9 -22 -7 q9 6 22 7Z" fill="currentColor" stroke="none" />
        <path d="M96 17 q-9 -11 -22 -11 q8 8 22 11Z" fill="currentColor" stroke="none" opacity="0.8" />
        <path d="M104 17 q-10 9 -22 7 q9 -6 22 -7Z" fill="currentColor" stroke="none" />
        <path d="M96 17 q-9 11 -22 11 q8 -8 22 -11Z" fill="currentColor" stroke="none" opacity="0.8" />
      </g>
      <circle cx="110" cy="17" r="4.5" fill="currentColor" />
      <circle cx="110" cy="17" r="8" stroke="currentColor" strokeWidth="1" opacity="0.55" />
    </svg>
  );
}

/* A gold ECG / heartbeat line — the nursing motif, sitting across the base of
   the card. */
function PulseLine() {
  return (
    <svg className="nom-pulse" viewBox="0 0 400 40" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M0 20 H120 l7 -13 l9 26 l8 -30 l8 34 l7 -17 H400"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NurseOfMonth({ spotlight }: { spotlight: NursingSpotlight }) {
  const { t, locale } = usePortal();
  const [flipped, setFlipped] = useState(false);
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

  const canFlip = achievements.length > 0;
  const toggle = () => canFlip && setFlipped((v) => !v);

  return (
    <div className="nom-stage">
      <div
        className={`nom-flip ${flipped ? "is-flipped" : ""} ${canFlip ? "can-flip" : ""}`}
        role={canFlip ? "button" : undefined}
        tabIndex={canFlip ? 0 : undefined}
        aria-pressed={canFlip ? flipped : undefined}
        aria-label={t(tx("بطاقة ممرض الشهر — للعرض والقلب", "Nurse of the month card — tap or hover to flip"))}
        onClick={toggle}
        onKeyDown={(e) => {
          if (canFlip && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <div className="nom-flip-inner">
          {/* ---- Front ---- */}
          <div className="nom-face nom-front">
            <span className="nom-sheen" aria-hidden="true" />
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
              <span className="nom-halo" aria-hidden="true" />
              <span className="nom-portrait-inner">
                {spotlight.photo_url ? <img src={spotlight.photo_url} alt={name} /> : <span className="nom-initials">{initials}</span>}
              </span>
              <span className="nom-portrait-ring" aria-hidden="true" />
            </div>

            <h3 className="nom-name">{name}</h3>
            {specialty ? <p className="nom-specialty">{specialty}</p> : null}

            <span className="nom-laurel-wrap" aria-hidden="true"><LaurelDivider /></span>

            {message ? <p className="nom-message">{message}</p> : null}

            <span className="nom-pulse-wrap" aria-hidden="true"><PulseLine /></span>

            {canFlip ? (
              <span className="nom-flip-hint">
                <Sparkles size={13} />
                {t(tx("اضغط أو مرّر لعرض إنجازاتها", "Tap or hover to see the achievements"))}
              </span>
            ) : null}
          </div>

          {/* ---- Back ---- */}
          <div className="nom-face nom-back">
            <span className="nom-back-glow" aria-hidden="true" />
            <span className="nom-ribbon nom-ribbon-back">
              <Heart size={15} />
              {t(tx("لماذا تستحق هذا التكريم", "Why she earned it"))}
            </span>
            <h3 className="nom-name nom-name-back">{name}</h3>
            <span className="nom-laurel-wrap nom-laurel-back" aria-hidden="true"><LaurelDivider /></span>
            {achievements.length > 0 ? (
              <ul className="nom-achievements">
                {achievements.map((line, i) => (
                  <li key={i}>
                    <span className="nom-ach-icon"><Award size={14} /></span>
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
    </div>
  );
}
