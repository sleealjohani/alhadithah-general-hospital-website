import { PageHero } from "../../../components/ui/PageHero";
import { ContentGrid } from "../../../components/ui/ContentGrid";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { departments, initiatives, knowledgeItems } from "../../../data/content";
import { tx } from "../../../utils/i18n";

export function QualityPage() {
  usePageMeta(
    tx("مسارات الجودة والتحسين", "Quality and Improvement Paths"),
    tx(
      "صفحة تجمع السياسات والمبادرات وروابط OVR و Good Catch عند اعتمادها.",
      "A page for policies, initiatives, OVR, and Good Catch links once approved."
    )
  );
  return (
    <>
      <PageHero
        eyebrow={tx("الجودة وسلامة المرضى", "Quality & Patient Safety")}
        title={tx("مسارات الجودة والتحسين", "Quality and Improvement Paths")}
        description={tx(
          "صفحة تجمع السياسات والمبادرات وروابط OVR و Good Catch عند اعتمادها.",
          "A page for policies, initiatives, OVR, and Good Catch links once approved."
        )}
      />
      <section className="section">
        <div className="container">
          <ContentGrid items={[departments[3], initiatives[1], knowledgeItems[0]]} />
        </div>
      </section>
    </>
  );
}
