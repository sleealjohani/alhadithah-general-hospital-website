import { useEffect, useRef } from "react";
import { usePortal } from "../../providers/PortalProvider";
import { lockBodyScroll } from "../../utils/scrollLock";
import { tx } from "../../utils/i18n";

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], label: tx("فتح لوحة الأوامر", "Open the command palette") },
  { keys: ["?"], label: tx("عرض هذه القائمة", "Show this list") },
  { keys: ["Esc"], label: tx("إغلاق النوافذ المنبثقة", "Close dialogs") },
  { keys: ["Tab"], label: tx("التنقل بين العناصر", "Move between elements") }
];

export function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  const { t } = usePortal();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const unlock = lockBodyScroll();
    closeRef.current?.focus();
    return () => {
      unlock();
      opener?.focus?.();
    };
  }, []);

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div
        className="palette-dialog shortcuts-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t(tx("اختصارات لوحة المفاتيح", "Keyboard shortcuts"))}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape" || event.key === "Tab") {
            event.preventDefault();
            if (event.key === "Escape") onClose();
          }
        }}
      >
        <h2>{t(tx("اختصارات لوحة المفاتيح", "Keyboard shortcuts"))}</h2>
        <dl className="shortcuts-list">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.label.en}>
              <dt>
                {shortcut.keys.map((key) => (
                  <kbd key={key}>{key}</kbd>
                ))}
              </dt>
              <dd>{t(shortcut.label)}</dd>
            </div>
          ))}
        </dl>
        <button ref={closeRef} type="button" className="btn btn-secondary" onClick={onClose}>
          {t(tx("إغلاق", "Close"))}
        </button>
      </div>
    </div>
  );
}
