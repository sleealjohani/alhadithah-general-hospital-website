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
      title={tx("روابط مهمة بدون افتراضات", "Important Links Without Assumptions")}
      description={tx(
        "لا تُعرض روابط رسمية افتراضية. يضيف المسؤول الروابط المعتمدة من لوحة التحكم.",
        "No default official URLs are shown. Admins add approved links from the console."
      )}
    />
  );
}
