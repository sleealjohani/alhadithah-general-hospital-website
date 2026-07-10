import type { ReactNode } from "react";
import { usePortal } from "../../providers/PortalProvider";
import { pageCopy } from "../../data/content";
import type { PortalItem } from "../../types";
import { ItemCard } from "./ItemCard";
import { EmptyState } from "./EmptyState";

export function ContentGrid({
  items,
  elevated = false,
  emptyAction
}: {
  items: PortalItem[];
  elevated?: boolean;
  emptyAction?: ReactNode;
}) {
  const { t } = usePortal();
  if (items.length === 0) {
    return <EmptyState title={t(pageCopy.common.empty)} action={emptyAction} />;
  }
  return (
    <div className="content-grid">
      {items.map((item) => (
        <ItemCard item={item} key={item.id} elevated={elevated} />
      ))}
    </div>
  );
}
