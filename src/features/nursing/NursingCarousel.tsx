import { usePortal } from "../../providers/PortalProvider";
import { tx } from "../../utils/i18n";
import type { NursingMedia } from "../../lib/supabase/nursing";

/**
 * Landscape auto-scrolling media carousel that glides to the right. Each slide
 * shows an image or video with its caption overlaid on the media itself. The
 * track is duplicated so the marquee loops seamlessly; hovering pauses it.
 */
export function NursingCarousel({ media }: { media: NursingMedia[] }) {
  const { t } = usePortal();
  if (media.length === 0) return null;

  /* Duplicate the reel so the rightward marquee never shows a seam. */
  const reel = [...media, ...media];

  return (
    <div className="nursing-reel" aria-label={t(tx("لقطات من ميدان التمريض", "Moments from the nursing floor"))}>
      <div className="nursing-reel-track" style={{ ["--reel-count" as string]: media.length }}>
        {reel.map((item, index) => {
          const caption = t(tx(item.caption_ar || item.title_ar || "", item.caption_en || item.title_en || ""));
          return (
            <figure className="nursing-reel-slide" key={`${item.id}-${index}`} aria-hidden={index >= media.length}>
              {item.media_type === "video" ? (
                <video src={item.media_url} muted loop autoPlay playsInline preload="metadata" />
              ) : (
                <img src={item.media_url} alt={caption} loading="lazy" />
              )}
              {caption ? (
                <figcaption className="nursing-reel-caption">
                  <span>{caption}</span>
                </figcaption>
              ) : null}
            </figure>
          );
        })}
      </div>
      <span className="nursing-reel-edge nursing-reel-edge-start" aria-hidden="true" />
      <span className="nursing-reel-edge nursing-reel-edge-end" aria-hidden="true" />
    </div>
  );
}
