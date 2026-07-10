import { PageHero } from "../../../components/ui/PageHero";
import { ContentGrid } from "../../../components/ui/ContentGrid";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { employeeLinks } from "../../../data/content";
import { tx } from "../../../utils/i18n";

export function EmployeesPage() {
  usePageMeta(
    tx("روابط ونماذج داخلية", "Internal Links and Forms"),
    tx(
      "مسار مخصص للموظفين للوصول إلى النماذج والروابط والأدلة الداخلية.",
      "A staff path for internal forms, links, and guides."
    )
  );
  return (
    <>
      <PageHero
        eyebrow={tx("بوابة الموظفين", "Employee Portal")}
        title={tx("روابط ونماذج داخلية", "Internal Links and Forms")}
        description={tx(
          "مسار مخصص للموظفين للوصول إلى النماذج والروابط والأدلة الداخلية.",
          "A staff path for internal forms, links, and guides."
        )}
      />
      <section className="section">
        <div className="container">
          <ContentGrid items={employeeLinks} />
        </div>
      </section>
    </>
  );
}
