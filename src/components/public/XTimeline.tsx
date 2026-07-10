import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { tx } from "../../utils/i18n";

const HANDLE = "AljoufCluster";
const WIDGET_SRC = "https://platform.x.com/widgets.js";
const DAY_MS = 24 * 60 * 60 * 1000;

type XTimelineProps = {
  compact?: boolean;
  card?: boolean;
  days?: number;
};

type XFeedItem = {
  createdAt: string;
  id: string;
  media: Array<{
    expandedUrl: string;
    type: string;
    url: string;
  }>;
  text: string;
  url: string;
};

type XFeedResponse = {
  error?: string;
  isRecentWindow?: boolean;
  isStale?: boolean;
  items?: XFeedItem[];
  source?: string;
  windowDays?: number;
};

declare global {
  interface Window {
    twttr?: { widgets?: { load?: (el?: HTMLElement) => void } };
  }
}

function formatXDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getRecentSearch(days: number) {
  const safeDays = Math.max(1, Math.floor(days));
  const since = formatXDate(new Date(Date.now() - safeDays * DAY_MS));
  const until = formatXDate(new Date(Date.now() + DAY_MS));
  const query = `from:${HANDLE} since:${since} until:${until}`;
  const encodedQuery = encodeURIComponent(query);

  return {
    fallbackHref: `https://x.com/search?q=${encodedQuery}&src=typed_query&f=live`
  };
}

function formatDisplayDate(value: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short"
    }).format(new Date(value));
  } catch {
    return "";
  }
}

/**
 * Live updates pulled straight from @AljoufCluster on X. Uses X's official
 * embed widget, so posts (with their images and video) appear and refresh
 * automatically — no API key needed. If the widget script is blocked (strict
 * network/CSP, offline), it degrades to a plain link to the relevant X view.
 */
export function XTimeline({ compact = false, card = false, days }: XTimelineProps) {
  const { locale, t, theme } = usePortal();
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [feedItems, setFeedItems] = useState<XFeedItem[]>([]);
  const [feedIsRecent, setFeedIsRecent] = useState(true);
  const [feedIsStale, setFeedIsStale] = useState(false);
  const [feedStatus, setFeedStatus] = useState<"idle" | "loading" | "ready" | "empty" | "error">("idle");
  const hasRecentFeed = typeof days === "number" && Number.isFinite(days);
  const shouldUseWidget = !hasRecentFeed || feedStatus === "empty" || feedStatus === "error";
  const recentSearch = hasRecentFeed ? getRecentSearch(days) : null;
  const profileHref = `https://x.com/${HANDLE}`;
  const profileWidgetHref = `https://x.com/${HANDLE}?ref_src=twsrc%5Etfw`;
  const fallbackHref = recentSearch?.fallbackHref ?? profileHref;
  const heading = tx("آخر تحديثات تجمع الجوف الصحي", "Al-Jouf Cluster updates");
  const fallbackLabel = recentSearch
    ? tx("فتح تحديثات آخر 7 أيام على منصة إكس", "Open the last 7 days on X")
    : tx("تابع آخر الأخبار على منصة إكس", "Follow the latest on X");
  const anchorLabel = tx("تحديثات من", "Updates from");

  useEffect(() => {
    if (!shouldUseWidget) return;

    let cancelled = false;
    setFailed(false);
    setLoaded(false);

    const markLoaded = () => {
      if (!cancelled && containerRef.current?.querySelector("iframe")) setLoaded(true);
    };
    const render = () => {
      window.twttr?.widgets?.load?.(containerRef.current ?? undefined);
      window.setTimeout(markLoaded, 500);
    };

    const observer = new MutationObserver(markLoaded);
    if (containerRef.current) observer.observe(containerRef.current, { childList: true, subtree: true });

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${WIDGET_SRC}"]`);
    if (existing) {
      render();
    } else {
      const script = document.createElement("script");
      script.src = WIDGET_SRC;
      script.async = true;
      script.onload = render;
      script.onerror = () => {
        if (!cancelled) setFailed(true);
      };
      document.body.appendChild(script);
    }

    /* If nothing rendered within a few seconds, show the fallback link. */
    const timer = window.setTimeout(() => {
      if (!cancelled && containerRef.current && containerRef.current.querySelector("iframe") === null) {
        setFailed(true);
      }
    }, 6000);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [shouldUseWidget]);

  useEffect(() => {
    if (!hasRecentFeed) {
      setFeedStatus("idle");
      return;
    }

    const safeDays = Math.max(1, Math.floor(days));
    const controller = new AbortController();
    setFeedStatus("loading");

    fetch(`/api/x-feed?days=${safeDays}&limit=${compact ? 4 : 6}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Feed request failed");
        return response.json() as Promise<XFeedResponse>;
      })
      .then((payload) => {
        const items = payload.items || [];
        setFeedItems(items);
        setFeedIsRecent(payload.isRecentWindow !== false);
        setFeedIsStale(payload.isStale === true);
        setFeedStatus(items.length > 0 ? "ready" : "empty");
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFeedItems([]);
        setFeedIsStale(false);
        setFeedStatus("error");
      });

    return () => controller.abort();
  }, [compact, days, hasRecentFeed]);

  const className = [
    "x-timeline",
    compact ? "x-timeline-compact" : "",
    card ? "info-card x-news-card" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const embedTimeline = (
    <div className="x-timeline-embed x-publish-fallback" ref={containerRef}>
      {!loaded ? <div className="x-timeline-loading">{t(tx("تحميل تحديثات تجمع الجوف الصحي...", "Loading Al-Jouf Cluster updates..."))}</div> : null}
      <a
        className="twitter-timeline x-timeline-anchor"
        data-height={compact ? "420" : "620"}
        data-theme={theme === "dark" ? "dark" : "light"}
        href={profileWidgetHref}
      >
        Posts by {HANDLE}
      </a>
    </div>
  );

  return (
    <section className={className} aria-label={t(tx("آخر التحديثات على منصة إكس", "Latest updates on X"))}>
      <div className="x-timeline-head">
        <h2>{t(heading)}</h2>
        <a className="text-link" href={fallbackHref} target="_blank" rel="noreferrer" aria-label={t(fallbackLabel)}>
          @{HANDLE}
          <ExternalLink size={14} />
        </a>
      </div>
      {hasRecentFeed ? (
        <div className="x-feed-panel">
          {feedStatus === "loading" || feedStatus === "idle" ? (
            <div className="x-timeline-loading">
              {t(tx("تحميل تحديثات تجمع الجوف الصحي...", "Loading Al-Jouf Cluster updates..."))}
            </div>
          ) : feedStatus === "ready" ? (
            <>
              {!feedIsRecent ? (
                <p className="x-feed-note">
                  {t(tx("لا توجد تحديثات خلال آخر 7 أيام، لذلك نعرض آخر تحديثات متاحة.", "No updates were found in the last 7 days, so the latest available updates are shown."))}
                </p>
              ) : null}
              {feedIsStale ? (
                <p className="x-feed-note">
                  {t(tx("نعرض آخر نسخة محفوظة حتى تعود تحديثات إكس.", "Showing the latest cached copy until X updates are available again."))}
                </p>
              ) : null}
              <div className="x-feed-list">
                {feedItems.map((item) => (
                  <article className="x-feed-item" key={item.id}>
                    <div className="x-feed-meta">
                      <span>{formatDisplayDate(item.createdAt, locale === "ar" ? "ar-SA" : "en-US")}</span>
                      <a href={item.url} target="_blank" rel="noreferrer" aria-label={t(tx("فتح التغريدة", "Open post"))}>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                    <p>{item.text}</p>
                    {item.media.length > 0 ? (
                      <div className="x-feed-media">
                        {item.media.map((media) => (
                          <a href={media.expandedUrl || item.url} target="_blank" rel="noreferrer" key={media.url}>
                            <img src={media.url} alt="" loading="lazy" />
                            {media.type === "video" ? <span>{t(tx("فيديو", "Video"))}</span> : null}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
              <a className="btn btn-secondary x-feed-action" href={fallbackHref} target="_blank" rel="noreferrer">
                <ExternalLink size={16} />
                {t(fallbackLabel)}
              </a>
            </>
          ) : (
            <div className={failed ? "x-feed-empty" : "x-feed-empty x-feed-empty-embed"}>
              {!failed ? embedTimeline : null}
              <p>{t(tx("تعذر عرض التحديثات داخل الصفحة الآن.", "Updates could not be shown inside the page right now."))}</p>
              <a className="btn btn-secondary" href={fallbackHref} target="_blank" rel="noreferrer">
                <ExternalLink size={16} />
                {t(fallbackLabel)}
              </a>
            </div>
          )}
        </div>
      ) : failed ? (
        <a className="btn btn-secondary" href={fallbackHref} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          {t(fallbackLabel)}
        </a>
      ) : (
        <div className="x-timeline-embed" ref={containerRef}>
          {!loaded ? <div className="x-timeline-loading">{t(tx("تحميل تحديثات الجوف الصحية المباشرة...", "Loading live Al-Jouf Health updates..."))}</div> : null}
          <a
            className="twitter-timeline x-timeline-anchor"
            data-height={compact ? "420" : "620"}
            data-theme={theme === "dark" ? "dark" : "light"}
            data-chrome="noheader nofooter transparent"
            data-tweet-limit={compact ? "5" : "8"}
            href={profileWidgetHref}
          >
            {t(anchorLabel)} @{HANDLE}
          </a>
        </div>
      )}
    </section>
  );
}
