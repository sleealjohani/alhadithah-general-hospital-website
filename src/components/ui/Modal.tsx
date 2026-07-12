import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { lockBodyScroll } from "../../utils/scrollLock";
import { tx } from "../../utils/i18n";

/**
 * Accessible modal dialog: locks body scroll, traps focus, closes on Escape or
 * backdrop click, and restores focus to the opener. Reuses the palette dialog
 * surface for a consistent look.
 */
export function Modal({
  title,
  onClose,
  children,
  wide = false
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const { t } = usePortal();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const unlock = lockBodyScroll();
    dialogRef.current?.querySelector<HTMLElement>("input, textarea, select, button")?.focus();
    return () => {
      unlock();
      opener?.focus?.();
    };
  }, []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
      'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
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
    <div className="palette-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className={`palette-dialog modal-dialog ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t(tx("إغلاق", "Close"))}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
