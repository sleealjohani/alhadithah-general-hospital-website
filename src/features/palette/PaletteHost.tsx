import { lazy, Suspense, useEffect, useState } from "react";

/* Eager part is just this listener; the dialogs and their logic load on
   first use. */
const CommandPalette = lazy(() =>
  import("./CommandPalette").then((m) => ({ default: m.CommandPalette }))
);
const ShortcutsOverlay = lazy(() =>
  import("./ShortcutsOverlay").then((m) => ({ default: m.ShortcutsOverlay }))
);

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

export function PaletteHost() {
  const [open, setOpen] = useState<"palette" | "shortcuts" | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => (current === "palette" ? null : "palette"));
        return;
      }
      if (event.key === "?" && !isEditable(event.target) && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setOpen((current) => (current === "shortcuts" ? null : "shortcuts"));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!open) return null;
  return (
    <Suspense fallback={null}>
      {open === "palette" ? <CommandPalette onClose={() => setOpen(null)} /> : null}
      {open === "shortcuts" ? <ShortcutsOverlay onClose={() => setOpen(null)} /> : null}
    </Suspense>
  );
}
