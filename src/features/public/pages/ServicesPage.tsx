import { DirectoryPage } from "../components/DirectoryPage";
import { usePublishedItems } from "../../../hooks/usePublishedItems";
import { services } from "../../../data/content";
import { tx } from "../../../utils/i18n";

export function ServicesPage() {
  const items = usePublishedItems("services", services);
  return (
    <DirectoryPage
      table="services"
      fallback={items}
      eyebrow={tx("الخدمات الصحية", "Health Services")}
      title={tx("دليل الخدمات الصحية", "Health Services Directory")}
      description={tx(
        "بطاقات مختصرة قابلة للبحث والتصنيف، مع عدم عرض مواعيد أو أرقام غير معتمدة.",
        "Concise searchable cards without unapproved schedules or phone numbers."
      )}
    />
  );
}
