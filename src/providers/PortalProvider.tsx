import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Icon } from "../components/ui/Icon";
import { localValue } from "../utils/storage";
import type { Locale, LocalizedText, Theme, Toast } from "../types";

type PortalContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isRtl: boolean;
  t: (value: LocalizedText) => string;
  notify: (message: string, tone?: Toast["tone"]) => void;
};

const PortalContext = createContext<PortalContextValue | null>(null);

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) throw new Error("usePortal must be used inside PortalProvider");
  return context;
}

export function PortalProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => localValue<Locale>("hadetha_locale", "ar"));
  const [theme, setThemeState] = useState<Theme>(() => localValue<Theme>("hadetha_theme", "light"));
  const [toasts, setToasts] = useState<(Toast & { leaving?: boolean })[]>([]);
  /* Per-toast dismissal timers so hovering pauses the countdown. */
  const toastTimers = useRef(new Map<string, { timeout: number; startedAt: number; remaining: number }>());

  const isRtl = locale === "ar";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.dataset.theme = theme;
  }, [isRtl, locale, theme]);

  const dismissToast = useCallback((id: string) => {
    const timer = toastTimers.current.get(id);
    if (timer) window.clearTimeout(timer.timeout);
    toastTimers.current.delete(id);
    /* Mark leaving so the exit transition plays, then drop from state. */
    setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 180);
  }, []);

  const TOAST_DURATION = 4200;

  const notify = useCallback(
    (message: string, tone: Toast["tone"] = "info") => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, message, tone }]);
      const timeout = window.setTimeout(() => dismissToast(id), TOAST_DURATION);
      toastTimers.current.set(id, { timeout, startedAt: Date.now(), remaining: TOAST_DURATION });
    },
    [dismissToast]
  );

  const pauseToast = useCallback((id: string) => {
    const timer = toastTimers.current.get(id);
    if (!timer) return;
    window.clearTimeout(timer.timeout);
    timer.remaining -= Date.now() - timer.startedAt;
  }, []);

  const resumeToast = useCallback(
    (id: string) => {
      const timer = toastTimers.current.get(id);
      if (!timer) return;
      timer.startedAt = Date.now();
      timer.timeout = window.setTimeout(() => dismissToast(id), Math.max(timer.remaining, 400));
    },
    [dismissToast]
  );

  const value = useMemo<PortalContextValue>(
    () => ({
      locale,
      setLocale: (nextLocale) => {
        localStorage.setItem("hadetha_locale", nextLocale);
        setLocaleState(nextLocale);
      },
      theme,
      setTheme: (nextTheme) => {
        localStorage.setItem("hadetha_theme", nextTheme);
        setThemeState(nextTheme);
      },
      isRtl,
      t: (text) => text[locale],
      notify
    }),
    [isRtl, locale, notify, theme]
  );

  return (
    <PortalContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div
            className={`toast toast-${toast.tone} ${toast.leaving ? "is-leaving" : ""}`}
            key={toast.id}
            role="status"
            onMouseEnter={() => pauseToast(toast.id)}
            onMouseLeave={() => resumeToast(toast.id)}
          >
            <Icon name={toast.tone === "success" ? "CheckCircle2" : "MessageSquareText"} />
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast-dismiss"
              onClick={() => dismissToast(toast.id)}
              aria-label={locale === "ar" ? "إغلاق التنبيه" : "Dismiss notification"}
            >
              <Icon name="X" size={15} />
            </button>
            {!toast.leaving && <span className="toast-progress" aria-hidden="true" />}
          </div>
        ))}
      </div>
    </PortalContext.Provider>
  );
}
