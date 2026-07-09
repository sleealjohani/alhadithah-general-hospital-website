import { PageHero } from "../../../components/ui/PageHero";
import { SectionHeading } from "../../../components/ui/SectionHeading";
import { ContentGrid } from "../../../components/ui/ContentGrid";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { identity } from "../../../data/content";
import { tx } from "../../../utils/i18n";
import type { PortalItem } from "../../../types";

export function AboutPage() {
  usePageMeta(
    tx("عن مستشفى الحديثة العام", "About Hadetha General Hospital"),
    tx(
      "تعريف رسمي بالمستشفى وقيمه ومسارات خدماته الرقمية.",
      "An official profile for the hospital, its values, and digital service paths."
    )
  );
  const values: PortalItem[] = [
    {
      id: "trust",
      title: tx("الثقة", "Trust"),
      description: tx("لغة رسمية ومحتوى قابل للتحقق والاعتماد.", "Official language and verifiable content."),
      category: tx("قيمة", "Value"),
      icon: "ShieldCheck"
    },
    {
      id: "clarity",
      title: tx("الوضوح", "Clarity"),
      description: tx("تنظيم الخدمات والنماذج حسب حاجة المستخدم.", "Organizing services and forms by user need."),
      category: tx("قيمة", "Value"),
      icon: "Eye"
    },
    {
      id: "improvement",
      title: tx("التحسين", "Improvement"),
      description: tx("مسارات واضحة للتجربة والجودة والمبادرات.", "Clear paths for experience, quality, and initiatives."),
      category: tx("قيمة", "Value"),
      icon: "Workflow"
    }
  ];

  return (
    <>
      <PageHero
        eyebrow={tx("تعريف مؤسسي", "Institutional Profile")}
        title={tx("عن مستشفى الحديثة العام", "About Hadetha General Hospital")}
        description={tx(
          "تعريف رسمي بالمستشفى وقيمه ومسارات خدماته الرقمية.",
          "An official profile for the hospital, its values, and digital service paths."
        )}
      />
      <section className="section">
        <div className="container split-layout">
          <article className="rich-panel">
            <span className="eyebrow">{identity.cluster.ar}</span>
            <h2>مستشفى الحديثة العام</h2>
            <p>
              بوابة المستشفى مصممة لتكون واجهة رقمية رسمية تخدم المستفيد والزائر والموظف، وتجمع
              المعلومات والروابط والنماذج ومركز المعرفة في مكان واحد ضمن تجربة واضحة وموثوقة.
            </p>
          </article>
          <div className="stacked-cards">
            <article className="mini-card">
              <h3>الرؤية</h3>
              <p>توفير قناة رقمية واضحة وموثوقة لكل ما يحتاجه المستفيد والموظف.</p>
            </article>
            <article className="mini-card">
              <h3>الرسالة</h3>
              <p>تسهيل الوصول للخدمات والمعلومات والنماذج ضمن تجربة مؤسسية حديثة.</p>
            </article>
          </div>
        </div>
      </section>
      <section className="section soft-section">
        <div className="container">
          <SectionHeading title={tx("قيم البوابة", "Portal Values")} />
          <ContentGrid items={values} />
        </div>
      </section>
    </>
  );
}
