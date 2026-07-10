import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  /** Illustration slot; defaults to a neutral inbox glyph. */
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="state-panel state-empty">
      <span className="state-icon" aria-hidden="true">
        {icon ?? <Inbox size={28} />}
      </span>
      <p className="state-title">{title}</p>
      {description ? <p className="state-description">{description}</p> : null}
      {action}
    </div>
  );
}
