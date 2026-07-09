import { usePortal } from "../../../providers/PortalProvider";
import { PageHero } from "../../../components/ui/PageHero";
import { usePublishedItems } from "../../../hooks/usePublishedItems";
import { faqs } from "../../../data/content";
import { tx } from "../../../utils/i18n";

export function FaqPage() {
  const { t } = usePortal();
  const items = usePublishedItems("faqs", faqs);
  return (
    <>
      <PageHero
        eyebrow={tx("الأسئلة الشائعة", "FAQ")}
        title={tx("إجابات مختصرة وواضحة", "Short, Clear Answers")}
        description={tx(
          "أسئلة قابلة للإدارة من لوحة التحكم وتدعم البحث والتصنيف.",
          "Questions are manageable from the admin panel and support search and categorization."
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
