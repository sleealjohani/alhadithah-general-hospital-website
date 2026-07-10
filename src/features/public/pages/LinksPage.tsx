import { DirectoryPage } from "../components/DirectoryPage";
import { usePublishedItems } from "../../../hooks/usePublishedItems";
import { importantLinks } from "../../../data/content";
import { tx } from "../../../utils/i18n";

export function LinksPage() {
  const items = usePublishedItems("important_links", importantLinks);
  return (
    <DirectoryPage
      table="important_links"
      fallback={items}
      eyebrow={tx("النماذج والروابط", "Forms & Links")}
      title={tx("النماذج والروابط المهمة", "Important Forms and Links")}
      description={tx(
        "مساحة منظمة للوصول إلى النماذج والروابط التي يحتاجها المستفيد أو الموظف.",
        "An organized space for forms and links needed by beneficiaries or staff."
      )}
    />
  );
}
