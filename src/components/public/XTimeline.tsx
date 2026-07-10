import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { tx } from "../../utils/i18n";

const HANDLE = "AljoufCluster";
const WIDGET_SRC = "https://platform.twitter.com/widgets.js";

declare global {
  interface Window {
    twttr?: { widgets?: { load?: (el?: HTMLElement) => void } };
  }
}

/**
 * Live updates pulled straight from @AljoufCluster on X. Uses X's official
 * embed widget, so posts (with their images and video) appear and refresh
 * automatically — no API key needed. If the widget script is blocked (strict
 * network/CSP, offline), it degrades to a plain link to the profile.
 */
export function XTimeline() {
  const { t, theme } = usePortal();
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const render = () => window.twttr?.widgets?.load?.(containerRef.current ?? undefined);

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
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <section className="x-timeline" aria-label={t(tx("آخر التحديثات على منصة إكس", "Latest updates on X"))}>
      <div className="x-timeline-head">
        <h2>{t(tx("آخر التحديثات المباشرة", "Live updates"))}</h2>
        <a className="text-link" href={`https://x.com/${HANDLE}`} target="_blank" rel="noreferrer">
          @{HANDLE}
          <ExternalLink size={14} />
        </a>
      </div>
      {failed ? (
        <a className="btn btn-secondary" href={`https://x.com/${HANDLE}`} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          {t(tx("تابع آخر الأخبار على منصة إكس", "Follow the latest on X"))}
        </a>
      ) : (
        <div className="x-timeline-embed" ref={containerRef}>
          <a
            className="twitter-timeline"
            data-height="620"
            data-theme={theme === "dark" ? "dark" : "light"}
            data-chrome="noheader nofooter transparent"
            href={`https://twitter.com/${HANDLE}?ref_src=twsrc%5Etfw`}
          >
            {t(tx("تحديثات من", "Updates from"))} @{HANDLE}
          </a>
        </div>
      )}
    </section>
  );
}
