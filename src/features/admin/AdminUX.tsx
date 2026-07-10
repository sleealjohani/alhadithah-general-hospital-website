import type { ReactNode } from "react";
import { ChevronDown, Info, Sparkles } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import type { LocalizedText } from "../../types";
import { tx } from "../../utils/i18n";

type TextLike = LocalizedText | string;

function textValue(value: TextLike | undefined, t: (text: LocalizedText) => string) {
  if (!value) return "";
  return typeof value === "string" ? value : t(value);
}

export function AdminHelpPanel({
  title,
  description,
  items
}: {
  title: TextLike;
  description?: TextLike;
  items?: TextLike[];
}) {
  const { t } = usePortal();

  return (
    <aside className="admin-help-panel">
      <div className="admin-help-icon" aria-hidden="true">
        <Info size={18} />
      </div>
      <div>
        <h3>{textValue(title, t)}</h3>
        {description ? <p>{textValue(description, t)}</p> : null}
        {items?.length ? (
          <ul>
            {items.map((item, index) => (
              <li key={index}>{textValue(item, t)}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}

export function AdminEditorPanel({
  title,
  description,
  impact,
  editing,
  children
}: {
  title: TextLike;
  description?: TextLike;
  impact?: TextLike;
  editing?: boolean;
  children: ReactNode;
}) {
  const { t } = usePortal();

  return (
    <details
      className="admin-panel admin-editor-panel"
      key={editing ? "editing" : "creating"}
      open={editing ? true : undefined}
    >
      <summary>
        <span>
          <strong>{editing ? t(tx("تعديل السجل المحدد", "Edit selected record")) : textValue(title, t)}</strong>
          {description ? <small>{textValue(description, t)}</small> : null}
        </span>
        <ChevronDown size={18} aria-hidden="true" />
      </summary>
      {impact ? (
        <div className="admin-impact-note">
          <Sparkles size={17} aria-hidden="true" />
          <span>{textValue(impact, t)}</span>
        </div>
      ) : null}
      {children}
    </details>
  );
}

export function AdminField({
  label,
  help,
  wide,
  children
}: {
  label: TextLike;
  help?: TextLike;
  wide?: boolean;
  children: ReactNode;
}) {
  const { t } = usePortal();

  return (
    <label className={wide ? "admin-field admin-field-wide" : "admin-field"}>
      <span>{textValue(label, t)}</span>
      {children}
      {help ? <small>{textValue(help, t)}</small> : null}
    </label>
  );
}

export function AdminFormActions({ children }: { children: ReactNode }) {
  return <div className="admin-form-actions">{children}</div>;
}
