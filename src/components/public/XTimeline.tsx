import { ExternalLink } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { useXFeedWidget } from "../../hooks/useXFeedWidget";
import { WidgetEmbed } from "./WidgetEmbed";
import { tx } from "../../utils/i18n";

const HANDLE = "AljoufCluster";
const PROFILE_URL = `https://x.com/${HANDLE}`;

type XTimelineProps = { compact?: boolean; card?: boolean };

/**
 * Latest @AljoufCluster posts on the homepage. If an admin has configured an
 * X-feed widget (a paid service embed, stored in the `x_feed_widget` site
 * setting), it renders live inside the card. Otherwise the card shows a clean
 * "follow on X" fallback — it is never blank.
 */
export function XTimeline({ compact = false, card = false }: XTimelineProps) {
  const { t } = usePortal();
  const widget = useXFeedWidget();

  const heading = tx("آخر تحديثات تجمع الجوف الصحي", "Al-Jouf Cluster — latest on X");
  const followLabel = tx("تابع الحساب على منصة إكس", "Follow @AljoufCluster on X");
  const className = ["x-timeline", card ? "info-card x-news-card" : "", compact ? "x-timeline-compact" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={className} aria-label={t(heading)}>
      <div className="x-timeline-head">
        <h2>{t(heading)}</h2>
        <a className="text-link" href={PROFILE_URL} target="_blank" rel="noreferrer">
          @{HANDLE}
          <ExternalLink size={14} />
        </a>
      </div>

      {widget ? (
        <WidgetEmbed html={widget} />
      ) : (
        <div className="x-feed-fallback">
          <p>
            {t(
              tx(
                "لمتابعة آخر التحديثات والصور والفيديو مباشرة، تابع حساب تجمع الجوف الصحي على منصة إكس.",
                "For the latest updates, photos, and video, follow Al-Jouf Health Cluster on X."
              )
            )}
          </p>
          <a className="btn btn-primary" href={PROFILE_URL} target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            {t(followLabel)}
          </a>
        </div>
      )}
    </section>
  );
}
