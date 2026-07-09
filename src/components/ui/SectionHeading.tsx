import type { ReactNode } from "react";
import { usePortal } from "../../providers/PortalProvider";
import type { LocalizedText } from "../../types";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: LocalizedText;
  title: LocalizedText;
  description?: LocalizedText;
  action?: ReactNode;
}) {
  const { t } = usePortal();
  return (
    <div className="section-heading">
      <div>
        {eyebrow ? <span className="eyebrow">{t(eyebrow)}</span> : null}
        <h2>{t(title)}</h2>
        {description ? <p>{t(description)}</p> : null}
      </div>
      {action}
    </div>
  );
}
