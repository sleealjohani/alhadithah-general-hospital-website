import { usePortal } from "../../providers/PortalProvider";
import { pageCopy } from "../../data/content";
import type { PortalItem } from "../../types";
import { ItemCard } from "./ItemCard";

export function ContentGrid({ items, elevated = false }: { items: PortalItem[]; elevated?: boolean }) {
  const { t } = usePortal();
  if (items.length === 0) {
    return <p className="empty-state">{t(pageCopy.common.empty)}</p>;
  }
  return (
    <div className="content-grid">
      {items.map((item) => (
        <ItemCard item={item} key={item.id} elevated={elevated} />
      ))}
    </div>
  );
}
