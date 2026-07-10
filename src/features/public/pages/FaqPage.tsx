import { usePortal } from "../../../providers/PortalProvider";
import { PageHero } from "../../../components/ui/PageHero";
import { usePublishedItems } from "../../../hooks/usePublishedItems";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { faqs } from "../../../data/content";
import { tx } from "../../../utils/i18n";

export function FaqPage() {
  const { t } = usePortal();
  usePageMeta(
    tx("إجابات مختصرة وواضحة", "Short, Clear Answers"),
    tx(
      "إجابات مختصرة تساعدك على الوصول للخدمة أو المعلومة المناسبة.",
      "Short answers that help you reach the right service or information."
    )
  );
  const items = usePublishedItems("faqs", faqs);
  return (
    <>
      <PageHero
        eyebrow={tx("الأسئلة الشائعة", "FAQ")}
        title={tx("إجابات مختصرة وواضحة", "Short, Clear Answers")}
        description={tx(
          "إجابات مختصرة تساعدك على الوصول للخدمة أو المعلومة المناسبة.",
          "Short answers that help you reach the right service or information."
        )}
      />
      <section className="section">
        <div className="container faq-list">
          {items.map((item) => (
            <details key={item.id} className="faq-item">
              <summary>{t(item.title)}</summary>
              <p>{t(item.description)}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
