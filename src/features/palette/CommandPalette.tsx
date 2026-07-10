import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CornerDownLeft, SearchIcon } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { lockBodyScroll } from "../../utils/scrollLock";
import { track } from "../../lib/analytics";
import { tx } from "../../utils/i18n";
import { paletteCommands, scoreCommand, type PaletteCommand } from "./commands";

const RECENT_KEY = "hadetha_palette_recent";
const RECENT_MAX = 5;

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const { t, locale, setLocale, theme, setTheme, highContrast, setHighContrast } = usePortal();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  /* Lock the page behind the dialog; restore focus to the opener on close. */
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const unlock = lockBodyScroll();
    inputRef.current?.focus();
    track("palette_open");
    return () => {
      unlock();
      opener?.focus?.();
    };
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) {
      const recent = readRecent();
      const recentCommands = recent
        .map((id) => paletteCommands.find((command) => command.id === id))
        .filter((command): command is PaletteCommand => Boolean(command));
      const rest = paletteCommands.filter((command) => !recent.includes(command.id));
      return [...recentCommands, ...rest];
    }
    return paletteCommands
      .map((command) => ({ command, score: scoreCommand(command, query) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.command);
  }, [query]);

  /* Free-text fallback: hand the query to the site search. */
  const showSearchFallback = query.trim().length > 1;
  const totalCount = results.length + (showSearchFallback ? 1 : 0);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const execute = (index: number) => {
    if (index >= results.length) {
      track("palette_execute", { kind: "search", query });
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
      return;
    }
    const command = results[index];
    if (!command) return;
    const recent = [command.id, ...readRecent().filter((id) => id !== command.id)].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    track("palette_execute", { kind: command.group, id: command.id });

    switch (command.action) {
      case "toggle-theme":
        setTheme(theme === "light" ? "dark" : "light");
        break;
      case "toggle-locale":
        setLocale(locale === "ar" ? "en" : "ar");
        break;
      case "toggle-contrast":
        setHighContrast(!highContrast);
        break;
      default:
        if (command.to) navigate(command.to);
    }
    onClose();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % Math.max(totalCount, 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((current) => (current - 1 + Math.max(totalCount, 1)) % Math.max(totalCount, 1));
        break;
      case "Enter":
        event.preventDefault();
        execute(activeIndex);
        break;
      case "Escape":
        event.preventDefault();
        onClose();
        break;
      case "Tab":
        /* Single-field combobox: keep focus on the input. */
        event.preventDefault();
        break;
    }
  };

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div
        className="palette-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t(tx("لوحة الأوامر", "Command palette"))}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="palette-input-row">
          <SearchIcon size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={totalCount ? `palette-option-${activeIndex}` : undefined}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(tx("انتقل إلى صفحة أو نفّذ إجراء…", "Jump to a page or run an action…"))}
          />
          <kbd>Esc</kbd>
        </div>
        <ul className="palette-list" id="palette-list" role="listbox" ref={listRef}>
          {results.map((command, index) => (
            <li
              key={command.id}
              id={`palette-option-${index}`}
              data-index={index}
              role="option"
              aria-selected={index === activeIndex}
              className={index === activeIndex ? "is-active" : ""}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => execute(index)}
            >
              <span>{t(command.label)}</span>
              <small>
                {command.group === "pages"
                  ? t(tx("صفحة", "Page"))
                  : t(tx("إجراء", "Action"))}
              </small>
            </li>
          ))}
          {showSearchFallback ? (
            <li
              id={`palette-option-${results.length}`}
              data-index={results.length}
              role="option"
              aria-selected={activeIndex === results.length}
              className={activeIndex === results.length ? "is-active" : ""}
              onMouseEnter={() => setActiveIndex(results.length)}
              onClick={() => execute(results.length)}
            >
              <span>
                {t(tx("ابحث في المحتوى عن", "Search content for"))} “{query.trim()}”
              </span>
              <small aria-hidden="true">
                <CornerDownLeft size={13} />
              </small>
            </li>
          ) : null}
          {totalCount === 0 ? (
            <li className="palette-empty" aria-live="polite">
              {t(tx("لا نتائج مطابقة.", "No matching results."))}
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
