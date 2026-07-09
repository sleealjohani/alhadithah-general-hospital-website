import { PageHero } from "../../../components/ui/PageHero";
import { SectionHeading } from "../../../components/ui/SectionHeading";
import { ContentGrid } from "../../../components/ui/ContentGrid";
import { PublicForm } from "../components/PublicForm";
import { initiatives } from "../../../data/content";
import { tx } from "../../../utils/i18n";

export function InitiativesPage() {
  return (
    <>
      <PageHero
        eyebrow={tx("المبادرات والابتكار", "Initiatives & Innovation")}
        title={tx("إرسال ومتابعة المبادرات", "Submit and Review Initiatives")}
        description={tx(
          "النماذج لا تنشر المشاركات للعامة، بل تحفظها للمراجعة الإدارية.",
          "Forms do not publish submissions publicly; they store them for admin review."
        )}
      />
      <section className="section">
        <div className="container two-column">
          <div>
            <SectionHeading title={tx("المسارات", "Paths")} />
            <ContentGrid items={initiatives} />
          </div>
          <PublicForm kind="initiative" title={tx("نموذج مبادرة", "Initiative Form")} />
        </div>
      </section>
      <section className="section soft-section" id="good-catch">
        <div className="container two-column">
          <div>
            <SectionHeading
              title={tx("Good Catch", "Good Catch")}
              description={tx(
                "استخدم النموذج للملاحظات التحسينية العامة دون إدخال بيانات مرضى أو معلومات حساسة.",
                "Use this form for general improvement observations without patient or sensitive data."
              )}
            />
          </div>
          <PublicForm kind="good_catch" title={tx("نموذج Good Catch", "Good Catch Form")} />
        </div>
      </section>
    </>
  );
}
