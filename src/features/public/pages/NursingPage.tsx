import { PageHero } from "../../../components/ui/PageHero";
import { ContentGrid } from "../../../components/ui/ContentGrid";
import { departments, employeeLinks, knowledgeItems } from "../../../data/content";
import { tx } from "../../../utils/i18n";

export function NursingPage() {
  return (
    <>
      <PageHero
        eyebrow={tx("التمريض", "Nursing")}
        title={tx("بوابة التمريض", "Nursing Portal")}
        description={tx(
          "مساحة مهيأة لإعلانات التمريض والأدلة والنماذج بعد اعتمادها.",
          "A prepared area for nursing announcements, guides, and forms after approval."
        )}
      />
      <section className="section">
        <div className="container">
          <ContentGrid items={[departments[2], employeeLinks[2], knowledgeItems[1]]} />
        </div>
      </section>
    </>
  );
}
