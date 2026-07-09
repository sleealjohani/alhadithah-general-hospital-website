import { PageHero } from "../../../components/ui/PageHero";
import { ContentGrid } from "../../../components/ui/ContentGrid";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { reportItems } from "../../../data/content";
import { tx } from "../../../utils/i18n";

export function ReportsPage() {
  usePageMeta(
    tx("تقارير معتمدة فقط", "Approved Reports Only"),
    tx(
      "لا تعرض البوابة أرقامًا أو مؤشرات غير موثقة. التقارير تضاف من الإدارة.",
      "The portal does not show unverified numbers or indicators. Reports are added by admins."
    )
  );
  return (
    <>
      <PageHero
        eyebrow={tx("الإحصاء والتقارير", "Statistics & Reports")}
        title={tx("تقارير معتمدة فقط", "Approved Reports Only")}
        description={tx(
          "لا تعرض البوابة أرقامًا أو مؤشرات غير موثقة. التقارير تضاف من الإدارة.",
          "The portal does not show unverified numbers or indicators. Reports are added by admins."
        )}
      />
      <section className="section">
        <div className="container">
          <ContentGrid items={reportItems} />
        </div>
      </section>
    </>
  );
}
