import { Link } from "react-router-dom";
import { usePortal } from "../../providers/PortalProvider";
import { pageCopy } from "../../data/content";
import { tx } from "../../utils/i18n";
import type { PortalItem } from "../../types";
import { Icon } from "./Icon";

export function ItemCard({ item, elevated = false }: { item: PortalItem; elevated?: boolean }) {
  const { t } = usePortal();
  const content = (
    <>
      <div className="card-icon">
        <Icon name={item.icon} />
      </div>
      <div className="card-meta">
        <span>{t(item.category)}</span>
        {item.badge ? <strong>{t(item.badge)}</strong> : null}
      </div>
      <h3>{t(item.title)}</h3>
      <p>{t(item.description)}</p>
      <span className="card-action">
        {item.url || item.path ? t(tx("فتح", "Open")) : t(pageCopy.common.noOfficialLinks)}
      </span>
    </>
  );

  const className = `info-card ${elevated ? "info-card-elevated" : ""}`;
  if (item.path) {
    return (
      <Link className={className} to={item.path}>
        {content}
      </Link>
    );
  }
  if (item.url) {
    return (
      <a className={className} href={item.url} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }
  return <article className={`${className} is-disabled`}>{content}</article>;
}
