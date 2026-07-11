import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { tx } from "../../utils/i18n";

const HANDLE = "AljoufCluster";
const PROFILE_URL = `https://x.com/${HANDLE}`;

type XMedia = { type: string; url: string; expandedUrl?: string };
type XItem = { id: string; createdAt: string; text: string; url: string; media?: XMedia[] };
type XTimelineProps = { compact?: boolean; card?: boolean; days?: number };

function formatDate(value: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
  } catch {
    return "";
  }
}

/**
 * Latest @AljoufCluster posts on the homepage. Reads the /api/x-feed Vercel
 * function (free X syndication, cached in Supabase). It renders one of three
 * states and is never blank: a loading skeleton, the posts, or a clean
 * "follow on X" card when the feed can't be reached.
 */
export function XTimeline({ compact = false, card = false, days = 7 }: XTimelineProps) {
  const { t, locale } = usePortal();
  const [status, setStatus] = useState<"loading" | "ready" | "empty">("loading");
  const [items, setItems] = useState<XItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    fetch(`/api/x-feed?days=${days}&limit=${compact ? 4 : 6}`, { signal: controller.signal })
      .then((response) => (response.ok ? (response.json() as Promise<{ items?: XItem[] }>) : Promise.reject(new Error("bad_status"))))
      .then((data) => {
        const list = Array.isArray(data.items) ? data.items : [];
        setItems(list);
        setStatus(list.length > 0 ? "ready" : "empty");
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("empty");
      });
    return () => controller.abort();
  }, [compact, days]);

  const heading = tx("آخر تحديثات تجمع الجوف الصحي", "Al-Jouf Cluster — latest on X");
  const followLabel = tx("تابع الحساب على منصة إكس", "Follow @AljoufCluster on X");
  const dateLocale = locale === "ar" ? "ar-SA" : "en-GB";
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

      {status === "loading" ? (
        <div className="x-feed-list" aria-busy="true">
          {Array.from({ length: compact ? 2 : 3 }, (_, i) => (
            <article className="x-feed-item" key={i}>
              <span className="skeleton skeleton-text" />
              <span className="skeleton skeleton-text skeleton-short" />
            </article>
          ))}
        </div>
      ) : status === "ready" ? (
        <div className="x-feed-list">
          {items.map((item) => (
            <article className="x-feed-item" key={item.id}>
              <div className="x-feed-meta">
                <time dateTime={item.createdAt}>{formatDate(item.createdAt, dateLocale)}</time>
                <a href={item.url} target="_blank" rel="noreferrer" aria-label={t(tx("فتح المنشور", "Open post"))}>
                  <ExternalLink size={14} />
                </a>
              </div>
              <p>{item.text}</p>
              {item.media && item.media.length > 0 ? (
                <div className="x-feed-media">
                  {item.media.slice(0, 4).map((media) => (
                    <a href={media.expandedUrl || item.url} target="_blank" rel="noreferrer" key={media.url}>
                      <img src={media.url} alt="" loading="lazy" />
                    </a>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
          <a className="btn btn-secondary x-feed-action" href={PROFILE_URL} target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            {t(followLabel)}
          </a>
        </div>
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
