import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { tx } from "../../utils/i18n";

const HANDLE = "AljoufCluster";
const WIDGET_SRC = "https://platform.twitter.com/widgets.js";
const DAY_MS = 24 * 60 * 60 * 1000;

type XTimelineProps = {
  compact?: boolean;
  card?: boolean;
  days?: number;
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

/**
 * Live updates pulled straight from @AljoufCluster on X. Uses X's official
 * embed widget, so posts (with their images and video) appear and refresh
 * automatically — no API key needed. If the widget script is blocked (strict
 * network/CSP, offline), it degrades to a plain link to the relevant X view.
 */
export function XTimeline({ compact = false, card = false, days }: XTimelineProps) {
  const { t, theme } = usePortal();
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const recentSearch = typeof days === "number" && Number.isFinite(days) ? getRecentSearch(days) : null;
  const profileHref = `https://x.com/${HANDLE}`;
  const profileWidgetHref = `https://twitter.com/${HANDLE}?ref_src=twsrc%5Etfw`;
  const fallbackHref = recentSearch?.fallbackHref ?? profileHref;
  const heading = tx("آخر تحديثات تجمع الجوف الصحي", "Al-Jouf Cluster updates");
  const fallbackLabel = recentSearch
    ? tx("فتح تحديثات آخر 7 أيام على منصة إكس", "Open the last 7 days on X")
    : tx("تابع آخر الأخبار على منصة إكس", "Follow the latest on X");
  const anchorLabel = tx("تحديثات من", "Updates from");

  useEffect(() => {
    let cancelled = false;
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
  }, []);

  const className = [
    "x-timeline",
    compact ? "x-timeline-compact" : "",
    card ? "info-card x-news-card" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={className} aria-label={t(tx("آخر التحديثات على منصة إكس", "Latest updates on X"))}>
      <div className="x-timeline-head">
        <h2>{t(heading)}</h2>
        <a className="text-link" href={fallbackHref} target="_blank" rel="noreferrer" aria-label={t(fallbackLabel)}>
          @{HANDLE}
          <ExternalLink size={14} />
        </a>
      </div>
      {failed ? (
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
