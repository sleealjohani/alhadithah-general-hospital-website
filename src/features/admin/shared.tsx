import { type ReactNode, useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Skeleton } from "../../components/ui/Skeleton";
import { tx } from "../../utils/i18n";
import type { LocalizedText } from "../../types";

/* Shared building blocks for the admin CRUD screens: labeled fields,
   confirmed deletion, busy-aware form actions, table loading rows, and
   status badges. Every screen composes these instead of re-implementing
   the same (previously inconsistent and unsafe) patterns. */

export function Field({
  label,
  children,
  wide = false
}: {
  label: LocalizedText;
  children: ReactNode;
  wide?: boolean;
}) {
  const { t } = usePortal();
  return (
    <label className={wide ? "field-wide" : undefined}>
      {t(label)}
      {children}
    </label>
  );
}

/**
 * Deletion always goes through an explicit confirmation dialog. Returns the
 * dialog element (render it) and a requestDelete to call from row buttons.
 */
export function useDeleteConfirm(onConfirm: (id: string) => void | Promise<void>) {
  const { t } = usePortal();
  const [target, setTarget] = useState<{ id: string; label: string } | null>(null);

  const dialog = target ? (
    <ConfirmDialog
      danger
      title={t(tx("تأكيد الحذف", "Confirm deletion"))}
      description={t(
        tx(
          `سيتم حذف «${target.label}» نهائيًا ولا يمكن التراجع.`,
          `“${target.label}” will be permanently deleted. This cannot be undone.`
        )
      )}
      confirmLabel={t(tx("حذف", "Delete"))}
      onConfirm={() => {
        const id = target.id;
        setTarget(null);
        onConfirm(id);
      }}
      onCancel={() => setTarget(null)}
    />
  ) : null;

  return {
    dialog,
    requestDelete: (id: string, label: string) => setTarget({ id, label })
  };
}

/** Submit + cancel pair; disables against double-submit and shows progress. */
export function CrudFormActions({
  busy,
  editing,
  onCancel,
  createLabel,
  updateLabel
}: {
  busy: boolean;
  editing: boolean;
  onCancel: () => void;
  createLabel?: LocalizedText;
  updateLabel?: LocalizedText;
}) {
  const { t } = usePortal();
  return (
    <>
      <button className="btn btn-primary" disabled={busy} type="submit">
        {busy ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
        {editing
          ? t(updateLabel ?? tx("تحديث", "Update"))
          : t(createLabel ?? tx("إنشاء", "Create"))}
      </button>
      {editing ? (
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
          <X size={18} />
          {t(tx("إلغاء التعديل", "Cancel edit"))}
        </button>
      ) : null}
    </>
  );
}

/** Skeleton body rows while a table loads. */
export function TableLoadingRows({ cols, count = 4 }: { cols: number; count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, rowIndex) => (
        <tr key={rowIndex} aria-hidden="true">
          {Array.from({ length: cols }, (_, colIndex) => (
            <td key={colIndex}>
              <Skeleton variant="text" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

const STATUS_TONES: Record<string, string> = {
  published: "badge-success",
  new: "badge-info",
  draft: "badge-muted",
  in_review: "badge-info",
  closed: "badge-muted",
  archived: "badge-muted"
};

const STATUS_TEXT: Record<string, LocalizedText> = {
  published: tx("منشور", "Published"),
  draft: tx("مسودة", "Draft"),
  archived: tx("مؤرشف", "Archived"),
  new: tx("جديد", "New"),
  in_review: tx("قيد المراجعة", "In review"),
  closed: tx("مغلق", "Closed")
};

export function StatusBadge({ value }: { value: string }) {
  const { t } = usePortal();
  const label = STATUS_TEXT[value];
  return (
    <span className={`badge ${STATUS_TONES[value] ?? "badge-muted"}`}>
      {label ? t(label) : value || "-"}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  const { t } = usePortal();
  return (
    <span className={`badge ${active ? "badge-success" : "badge-muted"}`}>
      {active ? t(tx("مفعّل", "Active")) : t(tx("موقوف", "Inactive"))}
    </span>
  );
}
