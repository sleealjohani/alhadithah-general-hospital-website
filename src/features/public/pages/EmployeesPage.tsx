import { PageHero } from "../../../components/ui/PageHero";
import { ContentGrid } from "../../../components/ui/ContentGrid";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { employeeLinks } from "../../../data/content";
import { tx } from "../../../utils/i18n";

export function EmployeesPage() {
  usePageMeta(
    tx("روابط ونماذج داخلية", "Internal Links and Forms"),
    tx(
      "لا تظهر الملفات الداخلية الحساسة للعامة. يمكن تفعيل الصلاحيات عبر Supabase RLS.",
      "Sensitive internal files are not exposed publicly. Access controls can be enforced with Supabase RLS."
    )
  );
  return (
    <>
      <PageHero
        eyebrow={tx("بوابة الموظفين", "Employee Portal")}
        title={tx("روابط ونماذج داخلية", "Internal Links and Forms")}
        description={tx(
          "لا تظهر الملفات الداخلية الحساسة للعامة. يمكن تفعيل الصلاحيات عبر Supabase RLS.",
          "Sensitive internal files are not exposed publicly. Access controls can be enforced with Supabase RLS."
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
