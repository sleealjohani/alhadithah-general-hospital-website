import { useEffect, useState } from "react";
import { usePortal } from "../../../providers/PortalProvider";
import { SectionHeading } from "../../../components/ui/SectionHeading";
import { ContentGrid } from "../../../components/ui/ContentGrid";
import { fetchPublicHomeSections, type HomeSection } from "../../../lib/supabase/homepageSections";
import { tx } from "../../../utils/i18n";
import type { PortalItem } from "../../../types";

/* Renders the admin-built homepage sections (rich text blocks and card
   grids) in their configured order. Each section's text, image, cards, and
   button are fully managed from the control panel's Homepage Builder. */
export function HomeBuilderSections() {
  const { t } = usePortal();
  const [sections, setSections] = useState<HomeSection[]>([]);

  useEffect(() => {
    let active = true;
    fetchPublicHomeSections().then((rows) => {
      if (active) setSections(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((section) => {
        const title = tx(section.title_ar || "", section.title_en || section.title_ar || "");
        const subtitle = tx(section.subtitle_ar || "", section.subtitle_en || section.subtitle_ar || "");
        const heading = t(title) ? (
          <SectionHeading title={title} description={t(subtitle) ? subtitle : undefined} />
        ) : null;

        if (section.content.type === "cards") {
          const items: PortalItem[] = (section.content.cards || []).map((card, index) => ({
            id: `${section.id}-${index}`,
            title: tx(card.title_ar || "", card.title_en || card.title_ar || ""),
            description: tx(card.description_ar || "", card.description_en || card.description_ar || ""),
            category: tx("", ""),
            icon: "FileText",
            url: card.url || undefined,
            image: card.image_url || undefined
          }));
          return (
            <section className="section" data-reveal key={section.id}>
              <div className="container">
                {heading}
                <ContentGrid items={items} />
              </div>
            </section>
          );
        }

        // rich
        const body = t(tx(section.content.body_ar || "", section.content.body_en || section.content.body_ar || ""));
        const buttonLabel = t(
          tx(
            section.content.button_label_ar || "",
            section.content.button_label_en || section.content.button_label_ar || ""
          )
        );
        return (
          <section className="section" data-reveal key={section.id}>
            <div className="container">
              <div className={`home-rich ${section.content.image_url ? "home-rich-split" : ""}`}>
                <div className="home-rich-copy">
                  {heading}
                  {body ? <p style={{ whiteSpace: "pre-wrap" }}>{body}</p> : null}
                  {buttonLabel && section.content.button_url ? (
                    <a
                      className="btn btn-primary"
                      href={section.content.button_url}
                      target={section.content.button_url.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                    >
                      {buttonLabel}
                    </a>
                  ) : null}
                </div>
                {section.content.image_url ? (
                  <div className="home-rich-media">
                    <img src={section.content.image_url} alt="" loading="lazy" />
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
