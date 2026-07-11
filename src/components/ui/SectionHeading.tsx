import type { ReactNode } from "react";
import { usePortal } from "../../providers/PortalProvider";
import { RevealText } from "../motion/RevealText";
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
        <RevealText as="h2" text={t(title)} />
        {description ? <p>{t(description)}</p> : null}
      </div>
      {action}
    </div>
  );
}
