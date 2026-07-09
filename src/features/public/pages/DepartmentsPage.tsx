import { DirectoryPage } from "../components/DirectoryPage";
import { usePublishedItems } from "../../../hooks/usePublishedItems";
import { departments } from "../../../data/content";
import { tx } from "../../../utils/i18n";

export function DepartmentsPage() {
  const items = usePublishedItems("departments", departments);
  return (
    <DirectoryPage
      table="departments"
      fallback={items}
      eyebrow={tx("الأقسام", "Departments")}
      title={tx("الأقسام الطبية والإدارية", "Clinical and Administrative Departments")}
      description={tx(
        "تصنيف واضح للأقسام مع مساحة مستقبلية لربط الخدمات والنماذج والأخبار.",
        "Clear department categories with future links to services, forms, and news."
      )}
    />
  );
}
