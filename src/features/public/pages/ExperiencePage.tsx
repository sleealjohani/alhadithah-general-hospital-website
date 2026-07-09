import { PageHero } from "../../../components/ui/PageHero";
import { PublicForm } from "../components/PublicForm";
import { tx } from "../../../utils/i18n";

export function ExperiencePage() {
  return (
    <>
      <PageHero
        eyebrow={tx("تجربة المستفيد", "Beneficiary Experience")}
        title={tx("شاركنا ملاحظتك", "Share Your Feedback")}
        description={tx(
          "نموذج آمن للملاحظات العامة. لا تطلب البوابة بيانات طبية حساسة.",
          "A safe form for general feedback. The portal does not request sensitive medical information."
        )}
      />
      <section className="section">
        <div className="container split-layout">
          <article className="rich-panel">
            <h2>تحسين الخدمة يبدأ من ملاحظة واضحة</h2>
            <p>
              يتم حفظ الملاحظات في جدول مخصص للمراجعة. لا تظهر المشاركات في الموقع العام ولا يتم
              استخدامها كإحصاءات عامة بدون اعتماد.
            </p>
          </article>
          <PublicForm kind="experience" title={tx("نموذج تجربة المستفيد", "Experience Form")} />
        </div>
      </section>
    </>
  );
}
