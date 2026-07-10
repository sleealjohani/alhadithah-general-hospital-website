import { useEffect, useRef, useState } from "react";
import { usePortal } from "../../providers/PortalProvider";
import { lockBodyScroll } from "../../utils/scrollLock";
import { tx } from "../../utils/i18n";

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  /** For destructive operations: the exact text the user must type. */
  challenge?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  challenge,
  danger = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const { t } = usePortal();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState("");
  const armed = !challenge || typed === challenge;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const unlock = lockBodyScroll();
    const focusable = dialogRef.current?.querySelector<HTMLElement>("input, button");
    focusable?.focus();
    return () => {
      unlock();
      opener?.focus?.();
    };
  }, []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== "Tab") return;
    /* Trap focus inside the dialog. */
    const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
      'input, button, [tabindex]:not([tabindex="-1"])'
    );
    if (!nodes?.length) return;
    const list = Array.from(nodes).filter((node) => !node.hasAttribute("disabled"));
    const first = list[0];
    const last = list[list.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="palette-backdrop" onClick={onCancel}>
      <div
        ref={dialogRef}
        className="palette-dialog confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <h2>{title}</h2>
        <p>{description}</p>
        {challenge ? (
          <label className="confirm-challenge">
            {t(tx("اكتب النص التالي للتأكيد:", "Type the following to confirm:"))} <code>{challenge}</code>
            <input value={typed} onChange={(event) => setTyped(event.target.value)} dir="auto" />
          </label>
        ) : null}
        <div className="confirm-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {t(tx("إلغاء", "Cancel"))}
          </button>
          <button
            type="button"
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            disabled={!armed}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
