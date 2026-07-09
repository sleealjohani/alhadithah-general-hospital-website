import { DirectoryPage } from "../components/DirectoryPage";
import { usePublishedItems } from "../../../hooks/usePublishedItems";
import { knowledgeItems } from "../../../data/content";
import { tx } from "../../../utils/i18n";

export function KnowledgePage() {
  const items = usePublishedItems("knowledge_items", knowledgeItems);
  return (
    <DirectoryPage
      table="knowledge_items"
      fallback={items}
      eyebrow={tx("مركز المعرفة", "Knowledge Center")}
      title={tx("السياسات والأدلة والملفات", "Policies, Guides, and Files")}
      description={tx(
        "مركز قابل للتوسع للسياسات والإجراءات والتعاميم والملفات المعتمدة.",
        "A scalable center for approved policies, procedures, circulars, and files."
      )}
    />
  );
}
