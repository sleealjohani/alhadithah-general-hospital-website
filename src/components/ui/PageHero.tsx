import type { ReactNode } from "react";
import { usePortal } from "../../providers/PortalProvider";
import { identity } from "../../data/content";
import { BrandWatermark, BrandWave } from "../motion/BrandDecor";
import type { LocalizedText } from "../../types";

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  compact = false
}: {
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  actions?: ReactNode;
  compact?: boolean;
}) {
  const { t } = usePortal();
  return (
    <section className={`page-hero ${compact ? "page-hero-compact" : ""}`}>
      <BrandWatermark src={identity.markWhite} className="page-hero-watermark" />
      <BrandWave src={identity.wave} className="page-hero-wave" />
      <div className="container page-hero-inner">
        <div>
          <span className="eyebrow">{t(eyebrow)}</span>
          <h1>{t(title)}</h1>
          <p>{t(description)}</p>
          {actions ? <div className="hero-actions">{actions}</div> : null}
        </div>
        <div className="hero-identity-card" aria-hidden="true">
          <img src={identity.lockupWhite} alt="" width={300} height={102} />
        </div>
      </div>
    </section>
  );
}
