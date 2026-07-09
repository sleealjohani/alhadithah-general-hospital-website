import { DirectoryPage } from "../components/DirectoryPage";
import { usePublishedItems } from "../../../hooks/usePublishedItems";
import { newsItems } from "../../../data/content";
import { tx } from "../../../utils/i18n";

export function NewsPage() {
  const items = usePublishedItems("news_posts", newsItems);
  return (
    <DirectoryPage
      table="news_posts"
      fallback={items}
      eyebrow={tx("الأخبار والإعلانات", "News & Announcements")}
      title={tx("المحتوى المنشور رسميًا", "Officially Published Content")}
      description={tx(
        "مساحة لأخبار المستشفى وإعلاناته ومبادراته الرسمية.",
        "A space for hospital news, announcements, and official initiatives."
      )}
    />
  );
}
