import {
  createContext,
  type FormEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate
} from "react-router-dom";
import {
  Accessibility,
  BadgePlus,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  FlaskConical,
  HeartPulse,
  Home,
  Images,
  Languages,
  LayoutDashboard,
  Library,
  Lightbulb,
  ListChecks,
  Loader2,
  LockKeyhole,
  LogIn,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareText,
  Microscope,
  Moon,
  Network,
  Newspaper,
  Pill,
  Plus,
  QrCode,
  Save,
  ScanLine,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Siren,
  Stethoscope,
  Sun,
  TableProperties,
  Target,
  Trash2,
  UploadCloud,
  UserCog,
  Workflow,
  X,
  Zap,
  type LucideIcon
} from "lucide-react";
import {
  allPublicContent,
  contentTables,
  departments,
  employeeLinks,
  faqs,
  identity,
  importantLinks,
  initiatives,
  knowledgeItems,
  navItems,
  newsItems,
  quickAccess,
  reportItems,
  roleLabels,
  services,
  tx,
  type FormKind,
  type Locale,
  type LocalizedText,
  type PortalItem
} from "./lib/data";
import { createQrDataUrl, exportRowsToExcel } from "./lib/exports";
import { readLocalSubmissions, submitPortalForm, type PortalFormPayload } from "./lib/forms";
import {
  fetchPublishedContent,
  getCurrentAdminSession,
  supabase,
  supabaseUrl,
  type AdminSession,
  type PublicContentRow
} from "./lib/supabase";

type Theme = "light" | "dark";

type Toast = {
  id: string;
  tone: "success" | "error" | "info";
  message: string;
};

type PortalContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;
  fontScale: number;
  setFontScale: (value: number) => void;
  isRtl: boolean;
  t: (value: LocalizedText) => string;
  notify: (message: string, tone?: Toast["tone"]) => void;
};

const PortalContext = createContext<PortalContextValue | null>(null);

const icons: Record<string, LucideIcon> = {
  Accessibility,
  BadgePlus,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  FlaskConical,
  HeartPulse,
  Home,
  Images,
  LayoutDashboard,
  Library,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  Megaphone,
  MessageSquareText,
  Microscope,
  Network,
  Newspaper,
  Pill,
  Plus,
  QrCode,
  ScanLine,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Siren,
  Stethoscope,
  TableProperties,
  Target,
  UploadCloud,
  UserCog,
  Workflow,
  Zap
};

const pageCopy = {
  common: {
    noOfficialLinks: tx("لا يوجد رابط رسمي معتمد حاليًا.", "No approved official link is available yet."),
    editable: tx("قابل للإدارة من لوحة التحكم", "Manageable from the admin panel"),
    empty: tx("لا يوجد محتوى منشور حاليًا.", "No published content is available yet.")
  },
  hero: {
    eyebrow: tx("بوابة رقمية رسمية", "Official Digital Portal"),
    title: tx("مستشفى الحديثة العام", "Hadetha General Hospital"),
    description: tx(
      "منصة عربية أولًا، ثنائية اللغة، تجمع الخدمات العامة، مركز المعرفة، النماذج، المبادرات، وتواصل المستفيد في تجربة واضحة قابلة للنشر.",
      "An Arabic-first bilingual portal for public services, knowledge, forms, initiatives, and beneficiary communication in a deployable experience."
    )
  }
};

const journeySteps = [
  {
    title: tx("يدخل المستخدم", "User enters"),
    text: tx("واجهة واضحة تحدد المسار المناسب مباشرة.", "A clear interface identifies the right path immediately."),
    icon: "Home"
  },
  {
    title: tx("يختار المسار", "Chooses a path"),
    text: tx("خدمات، موظفين، معرفة، تواصل، أو مبادرات.", "Services, employees, knowledge, contact, or initiatives."),
    icon: "ListChecks"
  },
  {
    title: tx("يتخذ إجراء", "Takes action"),
    text: tx("فتح رابط، إرسال نموذج، البحث عن ملف، أو قراءة إعلان.", "Open a link, submit a form, find a file, or read an announcement."),
    icon: "Zap"
  },
  {
    title: tx("تتابع الإدارة", "Admin follows up"),
    text: tx("تظهر الطلبات والمحتوى داخل لوحة التحكم مع صلاحيات واضحة.", "Submissions and content appear in the admin console with clear roles."),
    icon: "LayoutDashboard"
  }
];

function usePortal() {
  const context = useContext(PortalContext);
  if (!context) throw new Error("usePortal must be used inside PortalProvider");
  return context;
}

function useScrollReveal() {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!items.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -60px 0px" }
    );

    items.forEach((item, index) => {
      item.style.setProperty("--reveal-delay", `${Math.min(index * 55, 280)}ms`);
      observer.observe(item);
    });

    return () => observer.disconnect();
  });
}

function localValue<T extends string | number | boolean>(key: string, fallback: T): T {
  const value = localStorage.getItem(key);
  if (value === null) return fallback;
  if (typeof fallback === "number") return Number(value) as T;
  if (typeof fallback === "boolean") return (value === "true") as T;
  return value as T;
}

function PortalProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => localValue<Locale>("hadetha_locale", "ar"));
  const [theme, setThemeState] = useState<Theme>(() => localValue<Theme>("hadetha_theme", "light"));
  const [highContrast, setHighContrastState] = useState<boolean>(() =>
    localValue<boolean>("hadetha_high_contrast", false)
  );
  const [reduceMotion, setReduceMotionState] = useState<boolean>(() =>
    localValue<boolean>("hadetha_reduce_motion", false)
  );
  const [fontScale, setFontScaleState] = useState<number>(() =>
    localValue<number>("hadetha_font_scale", 1)
  );
  const [toasts, setToasts] = useState<Toast[]>([]);

  const isRtl = locale === "ar";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.contrast = highContrast ? "high" : "normal";
    document.documentElement.dataset.motion = reduceMotion ? "reduced" : "full";
    document.documentElement.style.setProperty("--font-scale", String(fontScale));
  }, [fontScale, highContrast, isRtl, locale, reduceMotion, theme]);

  const notify = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }, []);

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
      highContrast,
      setHighContrast: (value) => {
        localStorage.setItem("hadetha_high_contrast", String(value));
        setHighContrastState(value);
      },
      reduceMotion,
      setReduceMotion: (value) => {
        localStorage.setItem("hadetha_reduce_motion", String(value));
        setReduceMotionState(value);
      },
      fontScale,
      setFontScale: (value) => {
        const nextValue = Math.min(1.18, Math.max(0.92, value));
        localStorage.setItem("hadetha_font_scale", String(nextValue));
        setFontScaleState(nextValue);
      },
      isRtl,
      t: (text) => text[locale],
      notify
    }),
    [fontScale, highContrast, isRtl, locale, notify, reduceMotion, theme]
  );

  return (
    <PortalContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div className={`toast toast-${toast.tone}`} key={toast.id}>
            <Icon name={toast.tone === "success" ? "CheckCircle2" : "MessageSquareText"} />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </PortalContext.Provider>
  );
}

function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const Component = icons[name] || CircleHelp;
  return <Component aria-hidden="true" size={size} strokeWidth={2} />;
}

function mapRowToItem(row: PublicContentRow): PortalItem {
  return {
    id: row.id,
    title: tx(row.title_ar, row.title_en || row.title_ar),
    description: tx(row.description_ar || "", row.description_en || row.description_ar || ""),
    category: tx(row.category_ar || "عام", row.category_en || row.category_ar || "General"),
    icon: row.icon || "FileText",
    path: row.path || undefined,
    url: row.url || undefined,
    status: row.status === "published" ? "published" : "draft",
    updatedAt: row.updated_at || row.created_at || undefined
  };
}

function displayRowValue(row: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function usePublishedItems(table: string, fallback: PortalItem[]) {
  const [items, setItems] = useState(fallback);

  useEffect(() => {
    let active = true;
    fetchPublishedContent(table).then((rows) => {
      if (active && rows.length > 0) setItems(rows.map(mapRowToItem));
    });
    return () => {
      active = false;
    };
  }, [fallback, table]);

  return items;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/links" element={<LinksPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/initiatives" element={<InitiativesPage />} />
        <Route path="/experience" element={<ExperiencePage />} />
        <Route path="/quality" element={<QualityPage />} />
        <Route path="/nursing" element={<NursingPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Route>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/*" element={<AdminProtectedRoutes />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  useScrollReveal();
  return (
    <PortalProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AppRoutes />
      </BrowserRouter>
    </PortalProvider>
  );
}

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);
  return null;
}

function Header() {
  const { t, locale, setLocale, theme, setTheme, highContrast, setHighContrast } = usePortal();
  const [open, setOpen] = useState(false);
  const coreNav = navItems.filter((item) =>
    ["/", "/about", "/services", "/departments", "/knowledge", "/contact"].includes(item.path)
  );
  const secondaryNav = [
    ...navItems.filter((item) => ["/links", "/news"].includes(item.path)),
    { path: "/initiatives", label: tx("المبادرات", "Initiatives") },
    { path: "/faq", label: tx("الأسئلة الشائعة", "FAQ") }
  ];

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        {t(tx("تجاوز إلى المحتوى", "Skip to content"))}
      </a>
      <div className="top-strip">
        <div className="container top-strip-inner">
          <span>{t(identity.cluster)}</span>
          <span>{t(tx("لا تُعرض بيانات تواصل إلا بعد اعتمادها رسميًا.", "Contact details are hidden until officially approved."))}</span>
        </div>
      </div>
      <div className="container navbar">
        <Link className="brand" to="/" aria-label={t(identity.name)}>
          <span className="brand-logo-wrap">
            <img src={identity.logo} alt={t(identity.cluster)} />
          </span>
          <span>
            <strong>{t(identity.name)}</strong>
            <small>{t(identity.portal)}</small>
          </span>
        </Link>

        <button className="nav-toggle" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={`primary-nav ${open ? "is-open" : ""}`} aria-label="Primary">
          {coreNav.map((item) => (
            <NavLink key={item.path} to={item.path} onClick={() => setOpen(false)}>
              {t(item.label)}
            </NavLink>
          ))}
          <details className="more-menu">
            <summary>{t(tx("المزيد", "More"))}</summary>
            <div>
              {secondaryNav.map((item) => (
                <NavLink key={item.path} to={item.path} onClick={() => setOpen(false)}>
                  {t(item.label)}
                </NavLink>
              ))}
            </div>
          </details>
        </nav>

        <div className="nav-actions">
          <Link className="icon-button" to="/search" aria-label={t(tx("بحث", "Search"))}>
            <Search size={19} />
          </Link>
          <button
            className="icon-button"
            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
            aria-label={t(tx("تغيير اللغة", "Change language"))}
          >
            <Languages size={19} />
          </button>
          <button
            className="icon-button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label={t(tx("تغيير الوضع", "Change theme"))}
          >
            {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
          </button>
          <button
            className={`icon-button ${highContrast ? "is-active" : ""}`}
            onClick={() => setHighContrast(!highContrast)}
            aria-label={t(tx("تباين أعلى", "Higher contrast"))}
          >
            <Accessibility size={19} />
          </button>
          <Link className="admin-entry" to="/admin">
            <LockKeyhole size={17} />
            <span>{t(tx("الإدارة", "Admin"))}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content">{children || <Outlet />}</main>
      <Footer />
      <AccessibilityPanel />
    </>
  );
}

function Footer() {
  const { t } = usePortal();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <img className="footer-logo" src={identity.logo} alt={t(identity.cluster)} />
          <h2>{t(identity.name)}</h2>
          <p>{t(identity.tagline)}</p>
        </div>
        <div>
          <h3>{t(tx("روابط رئيسية", "Main Links"))}</h3>
          <ul>
            {navItems.slice(1, 7).map((item) => (
              <li key={item.path}>
                <Link to={item.path}>{t(item.label)}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>{t(tx("ملاحظة بيانات التواصل", "Contact Data Notice"))}</h3>
          <p>
            {t(
              tx(
                "لن تظهر أرقام أو بريد إلكتروني في الموقع العام حتى يتم إدخالها واعتمادها من إعدادات لوحة التحكم.",
                "Phone numbers and email addresses remain hidden until entered and approved in admin settings."
              )
            )}
          </p>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>{t(tx("جاهز للنشر عبر Netlify مع Supabase.", "Ready for Netlify deployment with Supabase."))}</span>
        <Link to="/admin/setup">{t(tx("إعداد المدير الأول", "First admin setup"))}</Link>
      </div>
    </footer>
  );
}

function AccessibilityPanel() {
  const { t, fontScale, setFontScale, reduceMotion, setReduceMotion } = usePortal();
  return (
    <aside className="accessibility-panel" aria-label={t(tx("خيارات الوصول", "Accessibility options"))}>
      <button onClick={() => setFontScale(fontScale + 0.04)}>{t(tx("تكبير", "A+"))}</button>
      <button onClick={() => setFontScale(fontScale - 0.04)}>{t(tx("تصغير", "A-"))}</button>
      <button onClick={() => setReduceMotion(!reduceMotion)}>
        {reduceMotion ? t(tx("الحركة موقفة", "Motion off")) : t(tx("إيقاف الحركة", "Reduce motion"))}
      </button>
    </aside>
  );
}

function PageHero({
  eyebrow,
  title,
  description,
  actions,
  compact = false
}: {
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  actions?: ReactNode;
  compact?: boolean;
}) {
  const { t } = usePortal();
  return (
    <section className={`page-hero ${compact ? "page-hero-compact" : ""}`}>
      <div className="container page-hero-inner">
        <div>
          <span className="eyebrow">{t(eyebrow)}</span>
          <h1>{t(title)}</h1>
          <p>{t(description)}</p>
          {actions ? <div className="hero-actions">{actions}</div> : null}
        </div>
        <div className="hero-identity-card" aria-hidden="true">
          <img src={identity.logo} alt="" />
          <span>{t(identity.cluster)}</span>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
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

function ItemCard({ item, elevated = false }: { item: PortalItem; elevated?: boolean }) {
  const { t } = usePortal();
  const content = (
    <>
      <div className="card-icon">
        <Icon name={item.icon} />
      </div>
      <div className="card-meta">
        <span>{t(item.category)}</span>
        {item.badge ? <strong>{t(item.badge)}</strong> : null}
      </div>
      <h3>{t(item.title)}</h3>
      <p>{t(item.description)}</p>
      <span className="card-action">
        {item.url || item.path ? t(tx("فتح", "Open")) : t(pageCopy.common.noOfficialLinks)}
      </span>
    </>
  );

  const className = `info-card ${elevated ? "info-card-elevated" : ""}`;
  if (item.path) {
    return (
      <Link className={className} to={item.path}>
        {content}
      </Link>
    );
  }
  if (item.url) {
    return (
      <a className={className} href={item.url} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }
  return <article className={`${className} is-disabled`}>{content}</article>;
}

function ContentGrid({ items, elevated = false }: { items: PortalItem[]; elevated?: boolean }) {
  const { t } = usePortal();
  if (items.length === 0) {
    return <p className="empty-state">{t(pageCopy.common.empty)}</p>;
  }
  return (
    <div className="content-grid">
      {items.map((item) => (
        <ItemCard item={item} key={item.id} elevated={elevated} />
      ))}
    </div>
  );
}

function HomePage() {
  const { t } = usePortal();
  const liveServices = usePublishedItems("services", services);
  const liveNews = usePublishedItems("news_posts", newsItems);
  const [activePathId, setActivePathId] = useState(quickAccess[0].id);
  const activePath = quickAccess.find((item) => item.id === activePathId) || quickAccess[0];

  return (
    <>
      <section className="home-hero reference-hero">
        <div className="hero-glow hero-glow-one" aria-hidden="true" />
        <div className="hero-glow hero-glow-two" aria-hidden="true" />
        <div className="hero-radar" aria-hidden="true" />
        <div className="container home-hero-grid">
          <div className="home-hero-copy" data-reveal>
            <span className="eyebrow">{t(pageCopy.hero.eyebrow)}</span>
            <h1>
              {t(tx("بكم نرتقي بتجربة مستشفى الحديثة الرقمية.", "Together, we elevate Hadetha Hospital's digital experience."))}
            </h1>
            <p>
              {t(
                tx(
                  "بوابة رسمية تجمع مسارات المستفيد والموظف والإدارة في تجربة واحدة؛ كل قسم مستقل في وظيفته، لكنه متصل بباقي المنظومة من خلال البحث، الصلاحيات، ومركز المعرفة.",
                  "An official portal connecting beneficiary, employee, and admin paths in one experience; each section is independent in purpose, yet connected through search, permissions, and the knowledge center."
                )
              )}
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/services">
                <HeartPulse size={18} />
                {t(tx("ابدأ من الخدمات", "Start with services"))}
              </Link>
              <Link className="btn btn-secondary" to="/employees">
                <BriefcaseBusiness size={18} />
                {t(tx("مسار الموظفين", "Employee path"))}
              </Link>
              <Link className="btn btn-ghost" to="/admin">
                <LayoutDashboard size={18} />
                {t(tx("إدارة البوابة", "Manage portal"))}
              </Link>
            </div>
          </div>
          <HeroExperiencePanel />
        </div>
      </section>

      <section className="quick-ribbon" aria-label={t(tx("روابط رئيسية", "Primary links"))}>
        <div className="quick-ribbon-shape" aria-hidden="true" />
        <div className="container quick-ribbon-grid">
          {quickAccess.slice(0, 3).map((item) => (
            <Link className="quick-ribbon-card" key={item.id} to={item.path || "/"}>
              <span className="watermark-mark" aria-hidden="true" />
              <strong>{t(item.title)}</strong>
              <small>{t(item.description)}</small>
              <span className="arrow-mark">←</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="institution-section">
        <div className="container institution-grid">
          <div className="vision-stack" data-reveal>
            <article>
              <span>{t(tx("رؤيتنا", "Vision"))}</span>
              <strong>{t(tx("نرتقي معًا بتجربة الوصول للخدمات والمعلومات.", "Elevating access to services and information together."))}</strong>
            </article>
            <article>
              <span>{t(tx("رسالتنا", "Mission"))}</span>
              <strong>{t(tx("تقديم بوابة مستدامة تجعل المحتوى الرسمي واضحًا وقابلًا للتحديث.", "Delivering a sustainable portal where official content is clear and maintainable."))}</strong>
            </article>
          </div>
          <div className="institution-copy" data-reveal>
            <span className="eyebrow">{t(tx("عن البوابة", "About the Portal"))}</span>
            <h2>{t(tx("منصة رقمية للمستشفى وليست صفحة تعريفية فقط", "A hospital digital platform, not just an informational page"))}</h2>
            <p>
              {t(
                tx(
                  "البوابة مبنية كمنظومة: خدمات عامة، مركز معرفة، نماذج وروابط، مبادرات، تجربة مستفيد، وجودة وسلامة. تظهر للمستخدم كرحلة بسيطة، وتظهر للإدارة كنظام محتوى منظم.",
                  "The portal is built as a system: public services, knowledge center, forms and links, initiatives, beneficiary experience, and quality and safety. Users see a simple journey; admins see structured content governance."
                )
              )}
            </p>
            <Link className="btn btn-sky" to="/about">
              {t(tx("قراءة المزيد", "Read more"))}
            </Link>
          </div>
        </div>
      </section>

      <section className="strategy-board-section">
        <div className="container">
          <SectionHeading
            eyebrow={tx("في استراتيجيتنا", "In Our Strategy")}
            title={tx("أربعة مسارات، وخمس قدرات، وست وحدات تشغيل", "Four paths, five capabilities, and six operating modules")}
            description={tx(
              "استخدمنا إيقاع الصحة القابضة في عرض الاستراتيجية، لكن المحتوى هنا خاص ببوابة المستشفى وقابل للتعديل.",
              "We used the Health Holding strategic rhythm, while keeping the content specific to the hospital portal and editable."
            )}
          />
          <div className="strategy-tiles">
            <article className="strategy-tile tile-sky" data-reveal>
              <Icon name="Target" size={54} />
              <span>{t(tx("مسارات", "Paths"))}</span>
              <strong>4</strong>
              <p>{t(tx("مستفيد، موظف، إدارة، زائر", "Beneficiary, employee, admin, visitor"))}</p>
            </article>
            <article className="strategy-tile tile-navy" data-reveal>
              <Icon name="ShieldCheck" size={54} />
              <span>{t(tx("قدرات", "Capabilities"))}</span>
              <strong>5</strong>
              <p>{t(tx("بحث، لغة، ثيم، صلاحيات، نماذج", "Search, language, theme, roles, forms"))}</p>
            </article>
            <article className="strategy-tile tile-sky wide" data-reveal>
              <Icon name="Workflow" size={54} />
              <span>{t(tx("وحدات", "Modules"))}</span>
              <strong>6</strong>
              <p>{t(tx("الخدمات، المعرفة، الروابط، الأخبار، المبادرات، الرسائل", "Services, knowledge, links, news, initiatives, submissions"))}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="interactive-path-section">
        <div className="container">
          <SectionHeading
            eyebrow={tx("مسارات تفاعلية", "Interactive Paths")}
            title={tx("كل مسار مستقل، وكلها تعمل كنظام واحد", "Each path stands alone, all paths work as one system")}
            description={tx(
              "مرر أو اختر المسار لتتغير اللوحة. هذا يخلق إحساس موقع حي بدل واجهة مسطحة.",
              "Hover or choose a path and the panel changes. This creates a living site, not a flat interface."
            )}
          />
          <div className="path-lab">
            <div className="path-menu" data-reveal>
              {quickAccess.map((item) => (
                <button
                  className={item.id === activePath.id ? "is-active" : ""}
                  key={item.id}
                  onClick={() => setActivePathId(item.id)}
                  onMouseEnter={() => setActivePathId(item.id)}
                >
                  <Icon name={item.icon} />
                  <span>{t(item.title)}</span>
                </button>
              ))}
            </div>
            <article className="path-stage" data-reveal>
              <div className="path-stage-icon">
                <Icon name={activePath.icon} size={48} />
              </div>
              <span className="eyebrow">{t(activePath.category)}</span>
              <h3>{t(activePath.title)}</h3>
              <p>{t(activePath.description)}</p>
              <Link className="btn btn-primary" to={activePath.path || "/"}>
                {t(tx("فتح المسار", "Open path"))}
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="digital-services-stage">
        <div className="container">
          <SectionHeading
            eyebrow={tx("الخدمات الإلكترونية", "Digital Services")}
            title={tx("مرحلة رقمية عميقة للخدمات والنماذج", "A deep digital stage for services and forms")}
            description={tx(
              "بدل قائمة روابط، تظهر الخدمات داخل مساحة داكنة تشبه أقسام الخدمات الإلكترونية في المرجع، مع بطاقات قابلة للإدارة من Supabase.",
              "Instead of a link list, services sit in a dark digital stage like the reference e-service sections, with Supabase-managed cards."
            )}
            action={<Link className="text-link" to="/services">{t(tx("كل الخدمات", "All services"))}</Link>}
          />
          <div className="digital-services-grid" data-reveal>
            {liveServices.slice(0, 4).map((item) => (
              <Link className="digital-service-card" to={item.path || "/services"} key={item.id}>
                <div>
                  <Icon name={item.icon} size={36} />
                  <span>{t(item.category)}</span>
                </div>
                <strong>{t(item.title)}</strong>
                <p>{t(item.description)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="journey-section">
        <div className="container">
          <SectionHeading
            eyebrow={tx("رحلة المستخدم", "User Journey")}
            title={tx("حركة الصفحة تخدم الفهم", "Motion that explains the journey")}
            description={tx(
              "كل خطوة تقود للتي بعدها بدل عرض محتوى متراكم بلا ترتيب.",
              "Each step leads to the next instead of stacking content without order."
            )}
          />
          <div className="journey-track">
            {journeySteps.map((step, index) => (
              <article className="journey-step" key={step.title.en} data-reveal>
                <span className="journey-index">{String(index + 1).padStart(2, "0")}</span>
                <Icon name={step.icon} />
                <h3>{t(step.title)}</h3>
                <p>{t(step.text)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container two-column">
          <div data-reveal>
            <SectionHeading
              eyebrow={tx("مركز المعرفة", "Knowledge Center")}
              title={tx("مركز معرفة لا يبدو كمجلد ملفات", "A knowledge center that does not feel like a folder")}
              description={tx(
                "تصنيف وبحث وبطاقات واضحة للسياسات والأدلة والتعاميم، مع حماية المحتوى الداخلي.",
                "Categorized, searchable cards for policies, guides, and circulars with internal-content protection."
              )}
            />
            <ContentGrid items={knowledgeItems.slice(0, 2)} />
          </div>
          <div data-reveal>
            <SectionHeading
              eyebrow={tx("الأخبار", "News")}
              title={tx("أخبار رسمية عند الاعتماد", "Official news when approved")}
              description={tx(
                "لن تظهر أخبار رسمية إلا بعد نشرها من لوحة التحكم.",
                "Official news appears only after admin publication."
              )}
            />
            <ContentGrid items={liveNews.slice(0, 2)} />
          </div>
        </div>
      </section>
    </>
  );
}

function HeroExperiencePanel() {
  const { t } = usePortal();

  return (
    <div className="hero-experience" data-reveal>
      <div className="hero-screen">
        <div className="screen-topbar">
          <span />
          <span />
          <span />
        </div>
        <div className="screen-content">
          <div className="screen-logo">
            <img src={identity.logo} alt={t(identity.cluster)} />
          </div>
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="floating-chip chip-one">
            <HeartPulse size={17} />
            {t(tx("خدمات", "Services"))}
          </div>
          <div className="floating-chip chip-two">
            <Library size={17} />
            {t(tx("معرفة", "Knowledge"))}
          </div>
          <div className="floating-chip chip-three">
            <ShieldCheck size={17} />
            {t(tx("إدارة آمنة", "Secure admin"))}
          </div>
        </div>
      </div>
      <div className="hero-status-card">
        <span>{t(tx("جاهزية النشر", "Deployment readiness"))}</span>
        <strong>{t(tx("Netlify + Supabase", "Netlify + Supabase"))}</strong>
        <div className="status-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}

function AboutPage() {
  const values: PortalItem[] = [
    {
      id: "trust",
      title: tx("الثقة", "Trust"),
      description: tx("لغة رسمية ومحتوى قابل للتحقق والاعتماد.", "Official language and verifiable content."),
      category: tx("قيمة", "Value"),
      icon: "ShieldCheck"
    },
    {
      id: "clarity",
      title: tx("الوضوح", "Clarity"),
      description: tx("تنظيم الخدمات والنماذج حسب حاجة المستخدم.", "Organizing services and forms by user need."),
      category: tx("قيمة", "Value"),
      icon: "Eye"
    },
    {
      id: "improvement",
      title: tx("التحسين", "Improvement"),
      description: tx("مسارات واضحة للتجربة والجودة والمبادرات.", "Clear paths for experience, quality, and initiatives."),
      category: tx("قيمة", "Value"),
      icon: "Workflow"
    }
  ];

  return (
    <>
      <PageHero
        eyebrow={tx("تعريف مؤسسي", "Institutional Profile")}
        title={tx("عن مستشفى الحديثة العام", "About Hadetha General Hospital")}
        description={tx(
          "صفحة تعريفية رسمية قابلة للتحرير من لوحة التحكم، بدون أرقام أو بيانات غير معتمدة.",
          "An official profile page editable from the admin panel, without unapproved numbers or data."
        )}
      />
      <section className="section">
        <div className="container split-layout">
          <article className="rich-panel">
            <span className="eyebrow">{identity.cluster.ar}</span>
            <h2>مستشفى الحديثة العام</h2>
            <p>
              بوابة المستشفى مصممة لتكون واجهة رقمية رسمية تخدم المستفيد والموظف والإدارة، وتجمع
              المعلومات والروابط والنماذج ومركز المعرفة في مكان واحد. النصوص التعريفية التفصيلية
              تبقى قابلة للتحديث من لوحة التحكم حتى تعتمدها الجهة المسؤولة.
            </p>
          </article>
          <div className="stacked-cards">
            <article className="mini-card">
              <h3>الرؤية</h3>
              <p>توفير قناة رقمية واضحة وموثوقة لكل ما يحتاجه المستفيد والموظف.</p>
            </article>
            <article className="mini-card">
              <h3>الرسالة</h3>
              <p>تسهيل الوصول للخدمات والمعلومات والنماذج ضمن تجربة مؤسسية حديثة.</p>
            </article>
          </div>
        </div>
      </section>
      <section className="section soft-section">
        <div className="container">
          <SectionHeading title={tx("قيم البوابة", "Portal Values")} />
          <ContentGrid items={values} />
        </div>
      </section>
    </>
  );
}

function ServicesPage() {
  const items = usePublishedItems("services", services);
  return (
    <DirectoryPage
      table="services"
      fallback={items}
      eyebrow={tx("الخدمات الصحية", "Health Services")}
      title={tx("دليل الخدمات الصحية", "Health Services Directory")}
      description={tx(
        "بطاقات مختصرة قابلة للبحث والتصنيف، مع عدم عرض مواعيد أو أرقام غير معتمدة.",
        "Concise searchable cards without unapproved schedules or phone numbers."
      )}
    />
  );
}

function DepartmentsPage() {
  const items = usePublishedItems("departments", departments);
  return (
    <DirectoryPage
      table="departments"
      fallback={items}
      eyebrow={tx("الأقسام", "Departments")}
      title={tx("الأقسام الطبية والإدارية", "Clinical and Administrative Departments")}
      description={tx(
        "تصنيف واضح للأقسام مع مساحة مستقبلية لربط الخدمات والنماذج والأخبار.",
        "Clear department categories with future links to services, forms, and news."
      )}
    />
  );
}

function KnowledgePage() {
  const items = usePublishedItems("knowledge_items", knowledgeItems);
  return (
    <DirectoryPage
      table="knowledge_items"
      fallback={items}
      eyebrow={tx("مركز المعرفة", "Knowledge Center")}
      title={tx("السياسات والأدلة والملفات", "Policies, Guides, and Files")}
      description={tx(
        "مركز قابل للتوسع للسياسات والإجراءات والتعاميم والملفات المعتمدة.",
        "A scalable center for approved policies, procedures, circulars, and files."
      )}
    />
  );
}

function LinksPage() {
  const items = usePublishedItems("important_links", importantLinks);
  return (
    <DirectoryPage
      table="important_links"
      fallback={items}
      eyebrow={tx("النماذج والروابط", "Forms & Links")}
      title={tx("روابط مهمة بدون افتراضات", "Important Links Without Assumptions")}
      description={tx(
        "لا تُعرض روابط رسمية افتراضية. يضيف المسؤول الروابط المعتمدة من لوحة التحكم.",
        "No default official URLs are shown. Admins add approved links from the console."
      )}
    />
  );
}

function NewsPage() {
  const items = usePublishedItems("news_posts", newsItems);
  return (
    <DirectoryPage
      table="news_posts"
      fallback={items}
      eyebrow={tx("الأخبار والإعلانات", "News & Announcements")}
      title={tx("المحتوى المنشور رسميًا", "Officially Published Content")}
      description={tx(
        "مساحة للأخبار والإعلانات بعد اعتمادها ونشرها من لوحة التحكم.",
        "A space for approved news and announcements published from the admin panel."
      )}
    />
  );
}

function DirectoryPage({
  table,
  fallback,
  eyebrow,
  title,
  description
}: {
  table: string;
  fallback: PortalItem[];
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
}) {
  const { t } = usePortal();
  const items = usePublishedItems(table, fallback);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = Array.from(new Set(items.map((item) => t(item.category))));
  const filtered = items.filter((item) => {
    const haystack = `${t(item.title)} ${t(item.description)} ${t(item.category)}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesCategory = category === "all" || t(item.category) === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={description} compact />
      <section className="section">
        <div className="container">
          <div className="directory-tools">
            <label className="search-field">
              <Search size={19} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t(tx("ابحث في المحتوى", "Search content"))}
              />
            </label>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">{t(tx("كل التصنيفات", "All categories"))}</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <ContentGrid items={filtered} />
        </div>
      </section>
    </>
  );
}

function InitiativesPage() {
  return (
    <>
      <PageHero
        eyebrow={tx("المبادرات والابتكار", "Initiatives & Innovation")}
        title={tx("إرسال ومتابعة المبادرات", "Submit and Review Initiatives")}
        description={tx(
          "النماذج لا تنشر المشاركات للعامة، بل تحفظها للمراجعة الإدارية.",
          "Forms do not publish submissions publicly; they store them for admin review."
        )}
      />
      <section className="section">
        <div className="container two-column">
          <div>
            <SectionHeading title={tx("المسارات", "Paths")} />
            <ContentGrid items={initiatives} />
          </div>
          <PublicForm kind="initiative" title={tx("نموذج مبادرة", "Initiative Form")} />
        </div>
      </section>
      <section className="section soft-section" id="good-catch">
        <div className="container two-column">
          <div>
            <SectionHeading
              title={tx("Good Catch", "Good Catch")}
              description={tx(
                "استخدم النموذج للملاحظات التحسينية العامة دون إدخال بيانات مرضى أو معلومات حساسة.",
                "Use this form for general improvement observations without patient or sensitive data."
              )}
            />
          </div>
          <PublicForm kind="good_catch" title={tx("نموذج Good Catch", "Good Catch Form")} />
        </div>
      </section>
    </>
  );
}

function ExperiencePage() {
  return (
    <>
      <PageHero
        eyebrow={tx("تجربة المستفيد", "Beneficiary Experience")}
        title={tx("شاركنا ملاحظتك", "Share Your Feedback")}
        description={tx(
          "نموذج آمن للملاحظات العامة. لا تطلب البوابة بيانات طبية حساسة.",
          "A safe form for general feedback. The portal does not request sensitive medical information."
        )}
      />
      <section className="section">
        <div className="container split-layout">
          <article className="rich-panel">
            <h2>تحسين الخدمة يبدأ من ملاحظة واضحة</h2>
            <p>
              يتم حفظ الملاحظات في جدول مخصص للمراجعة. لا تظهر المشاركات في الموقع العام ولا يتم
              استخدامها كإحصاءات عامة بدون اعتماد.
            </p>
          </article>
          <PublicForm kind="experience" title={tx("نموذج تجربة المستفيد", "Experience Form")} />
        </div>
      </section>
    </>
  );
}

function QualityPage() {
  return (
    <>
      <PageHero
        eyebrow={tx("الجودة وسلامة المرضى", "Quality & Patient Safety")}
        title={tx("مسارات الجودة والتحسين", "Quality and Improvement Paths")}
        description={tx(
          "صفحة تجمع السياسات والمبادرات وروابط OVR و Good Catch عند اعتمادها.",
          "A page for policies, initiatives, OVR, and Good Catch links once approved."
        )}
      />
      <section className="section">
        <div className="container">
          <ContentGrid items={[departments[3], initiatives[1], knowledgeItems[0]]} />
        </div>
      </section>
    </>
  );
}

function NursingPage() {
  return (
    <>
      <PageHero
        eyebrow={tx("التمريض", "Nursing")}
        title={tx("بوابة التمريض", "Nursing Portal")}
        description={tx(
          "مساحة مهيأة لإعلانات التمريض والأدلة والنماذج بعد اعتمادها.",
          "A prepared area for nursing announcements, guides, and forms after approval."
        )}
      />
      <section className="section">
        <div className="container">
          <ContentGrid items={[departments[2], employeeLinks[2], knowledgeItems[1]]} />
        </div>
      </section>
    </>
  );
}

function ReportsPage() {
  return (
    <>
      <PageHero
        eyebrow={tx("الإحصاء والتقارير", "Statistics & Reports")}
        title={tx("تقارير معتمدة فقط", "Approved Reports Only")}
        description={tx(
          "لا تعرض البوابة أرقامًا أو مؤشرات غير موثقة. التقارير تضاف من الإدارة.",
          "The portal does not show unverified numbers or indicators. Reports are added by admins."
        )}
      />
      <section className="section">
        <div className="container">
          <ContentGrid items={reportItems} />
        </div>
      </section>
    </>
  );
}

function EmployeesPage() {
  return (
    <>
      <PageHero
        eyebrow={tx("بوابة الموظفين", "Employee Portal")}
        title={tx("روابط ونماذج داخلية", "Internal Links and Forms")}
        description={tx(
          "لا تظهر الملفات الداخلية الحساسة للعامة. يمكن تفعيل الصلاحيات عبر Supabase RLS.",
          "Sensitive internal files are not exposed publicly. Access controls can be enforced with Supabase RLS."
        )}
      />
      <section className="section">
        <div className="container">
          <ContentGrid items={employeeLinks} />
        </div>
      </section>
    </>
  );
}

function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow={tx("تواصل معنا", "Contact Us")}
        title={tx("نموذج تواصل بدون بيانات عامة مزيفة", "Contact Form Without Fake Public Data")}
        description={tx(
          "يستقبل النموذج الرسائل العامة. معلومات الهاتف والبريد لا تظهر حتى تعتمد من الإعدادات.",
          "The form accepts general messages. Phone and email details stay hidden until approved in settings."
        )}
      />
      <section className="section">
        <div className="container split-layout">
          <article className="rich-panel">
            <h2>بيانات التواصل الرسمية</h2>
            <p>
              لم يتم إدخال بيانات تواصل معتمدة بعد. عند توفرها، يستطيع المسؤول إضافتها من
              إعدادات الموقع وتفعيل عرضها للعامة.
            </p>
          </article>
          <PublicForm kind="contact" title={tx("إرسال رسالة", "Send a Message")} />
        </div>
      </section>
    </>
  );
}

function FaqPage() {
  const { t } = usePortal();
  const items = usePublishedItems("faqs", faqs);
  return (
    <>
      <PageHero
        eyebrow={tx("الأسئلة الشائعة", "FAQ")}
        title={tx("إجابات مختصرة وواضحة", "Short, Clear Answers")}
        description={tx(
          "أسئلة قابلة للإدارة من لوحة التحكم وتدعم البحث والتصنيف.",
          "Questions are manageable from the admin panel and support search and categorization."
        )}
      />
      <section className="section">
        <div className="container faq-list">
          {items.map((item) => (
            <details key={item.id} className="faq-item">
              <summary>{t(item.title)}</summary>
              <p>{t(item.description)}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

function SearchPage() {
  const { t } = usePortal();
  const [query, setQuery] = useState("");
  const results = allPublicContent.filter((item) => {
    const text = `${t(item.title)} ${t(item.description)} ${t(item.category)}`.toLowerCase();
    return query.trim() && text.includes(query.toLowerCase());
  });

  return (
    <>
      <PageHero
        eyebrow={tx("البحث", "Search")}
        title={tx("بحث موحد داخل البوابة", "Unified Portal Search")}
        description={tx(
          "بحث سريع في المحتوى المبدئي، ويمكن ربطه ببيانات Supabase المنشورة.",
          "Fast search across starter content, ready to connect to published Supabase records."
        )}
        compact
      />
      <section className="section">
        <div className="container">
          <label className="search-field search-field-large">
            <Search size={22} />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(tx("اكتب كلمة للبحث", "Type a search term"))}
            />
          </label>
          <ContentGrid items={results} />
        </div>
      </section>
    </>
  );
}

function PublicForm({ kind, title }: { kind: FormKind; title: LocalizedText }) {
  const { t, notify } = usePortal();
  const [payload, setPayload] = useState<PortalFormPayload>({});
  const [busy, setBusy] = useState(false);

  const update = (key: keyof PortalFormPayload, value: string) => {
    setPayload((current) => ({ ...current, [key]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const result = await submitPortalForm(kind, payload);
    setBusy(false);
    if (result.ok) {
      setPayload({});
      notify(
        result.source === "supabase"
          ? t(tx("تم إرسال النموذج بنجاح.", "Form submitted successfully."))
          : t(tx("تم حفظ النموذج محليًا للمعاينة.", "Saved locally for preview.")),
        "success"
      );
    } else {
      notify(result.message, "error");
    }
  };

  const isInitiative = kind === "initiative";
  const isGoodCatch = kind === "good_catch";

  return (
    <form className="portal-form" onSubmit={onSubmit}>
      <div className="form-header">
        <Icon name={isGoodCatch ? "Target" : isInitiative ? "Lightbulb" : "Send"} />
        <h2>{t(title)}</h2>
      </div>
      <div className="form-grid">
        <label>
          {t(tx("الاسم", "Name"))}
          <input
            value={payload.name || ""}
            onChange={(event) => update("name", event.target.value)}
            placeholder={t(tx("اختياري", "Optional"))}
          />
        </label>
        <label>
          {t(tx("البريد الإلكتروني", "Email"))}
          <input
            type="email"
            value={payload.email || ""}
            onChange={(event) => update("email", event.target.value)}
            placeholder={t(tx("اختياري", "Optional"))}
          />
        </label>
        <label>
          {t(tx("التصنيف", "Category"))}
          <select value={payload.category || ""} onChange={(event) => update("category", event.target.value)}>
            <option value="">{t(tx("اختر", "Select"))}</option>
            <option value="general">{t(tx("عام", "General"))}</option>
            <option value="service">{t(tx("خدمة", "Service"))}</option>
            <option value="quality">{t(tx("جودة", "Quality"))}</option>
            <option value="other">{t(tx("أخرى", "Other"))}</option>
          </select>
        </label>
        <label>
          {t(tx("القسم المرتبط", "Related department"))}
          <input
            value={payload.department || ""}
            onChange={(event) => update("department", event.target.value)}
            placeholder={t(tx("اختياري", "Optional"))}
          />
        </label>
      </div>
      <label>
        {isInitiative ? t(tx("عنوان المبادرة", "Initiative title")) : t(tx("الموضوع", "Subject"))}
        <input
          required
          value={payload.subject || payload.title || ""}
          onChange={(event) => {
            update("subject", event.target.value);
            update("title", event.target.value);
          }}
        />
      </label>
      {isGoodCatch ? (
        <label>
          {t(tx("الموقع العام للملاحظة", "General observation location"))}
          <input
            value={payload.location || ""}
            onChange={(event) => update("location", event.target.value)}
            placeholder={t(tx("بدون بيانات مرضى", "No patient data"))}
          />
        </label>
      ) : null}
      <label>
        {isInitiative
          ? t(tx("الأثر المتوقع", "Expected impact"))
          : t(tx("الرسالة", "Message"))}
        <textarea
          required
          minLength={10}
          value={payload.message || payload.expectedImpact || ""}
          onChange={(event) => {
            update("message", event.target.value);
            update("expectedImpact", event.target.value);
          }}
          placeholder={t(
            tx(
              "اكتب تفاصيل عامة فقط، بدون معلومات طبية حساسة.",
              "Write general details only, without sensitive medical information."
            )
          )}
        />
      </label>
      <button className="btn btn-primary" disabled={busy} type="submit">
        {busy ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
        {t(tx("إرسال", "Submit"))}
      </button>
    </form>
  );
}

function NotFoundPage() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow={tx("404", "404")}
        title={tx("الصفحة غير موجودة", "Page Not Found")}
        description={tx("الرابط غير صحيح أو تم نقله.", "The link is invalid or has moved.")}
        actions={<Link className="btn btn-primary" to="/">العودة للرئيسية</Link>}
      />
    </PublicLayout>
  );
}

function AdminLoginPage() {
  const { t, notify } = usePortal();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      notify(t(tx("Supabase غير مهيأ.", "Supabase is not configured.")), "error");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      notify(t(tx("تعذر تسجيل الدخول. تحقق من البيانات.", "Unable to sign in. Check the credentials.")), "error");
      return;
    }
    navigate("/admin");
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <img src={identity.logo} alt={t(identity.cluster)} />
        <span className="eyebrow">{t(tx("لوحة التحكم", "Admin Console"))}</span>
        <h1>{t(tx("تسجيل دخول آمن", "Secure Sign In"))}</h1>
        <p>
          {t(
            tx(
              "استخدم مستخدم Supabase Auth بعد تعيين دوره في جدول profiles. لا توجد بيانات دخول مدمجة في الكود.",
              "Use a Supabase Auth user after assigning a role in profiles. No credentials are embedded in code."
            )
          )}
        </p>
        <form onSubmit={submit}>
          <label>
            {t(tx("البريد الإلكتروني", "Email"))}
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </label>
          <label>
            {t(tx("كلمة المرور", "Password"))}
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? <Loader2 className="spin" size={18} /> : <LogIn size={18} />}
            {t(tx("دخول", "Sign in"))}
          </button>
        </form>
        <Link className="text-link" to="/admin/setup">
          {t(tx("طريقة إنشاء أول مدير", "How to create the first admin"))}
        </Link>
      </section>
    </main>
  );
}

function AdminProtectedRoutes() {
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [signedInWithoutProfile, setSignedInWithoutProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const current = await getCurrentAdminSession();
      if (!active) return;
      if (current) {
        setAdmin(current);
        setSignedInWithoutProfile(false);
      } else if (supabase) {
        const { data } = await supabase.auth.getSession();
        setSignedInWithoutProfile(Boolean(data.session));
      }
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="loading-page">
        <Loader2 className="spin" />
      </main>
    );
  }

  if (signedInWithoutProfile) {
    return <AdminSetupNotice />;
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminLayout admin={admin} />;
}

function AdminLayout({ admin }: { admin: AdminSession }) {
  const { t, notify } = usePortal();
  const navigate = useNavigate();

  const logout = async () => {
    await supabase?.auth.signOut();
    notify(t(tx("تم تسجيل الخروج.", "Signed out.")), "success");
    navigate("/");
  };

  const adminNav = [
    { path: "/admin", label: tx("المؤشرات", "Dashboard"), icon: "LayoutDashboard" },
    { path: "/admin/content", label: tx("المحتوى", "Content"), icon: "TableProperties" },
    { path: "/admin/submissions", label: tx("الرسائل", "Submissions"), icon: "MessageSquareText" },
    { path: "/admin/tools", label: tx("QR والتصدير", "QR & Export"), icon: "QrCode" },
    { path: "/admin/settings", label: tx("الإعدادات", "Settings"), icon: "Settings" },
    { path: "/admin/setup", label: tx("دليل الإعداد", "Setup Guide"), icon: "UserCog" }
  ];

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/">
          <img src={identity.logo} alt={t(identity.cluster)} />
          <span>{t(tx("لوحة التحكم", "Admin"))}</span>
        </Link>
        <nav>
          {adminNav.map((item) => (
            <NavLink end={item.path === "/admin"} key={item.path} to={item.path}>
              <Icon name={item.icon} />
              <span>{t(item.label)}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="eyebrow">{t(roleLabels[admin.profile.role] || roleLabels.viewer)}</span>
            <h1>{admin.profile.full_name || admin.profile.email || t(tx("مستخدم إداري", "Admin user"))}</h1>
          </div>
          <button className="btn btn-secondary" onClick={logout}>
            <LogOut size={18} />
            {t(tx("خروج", "Logout"))}
          </button>
        </header>
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="content" element={<AdminContentManager />} />
          <Route path="submissions" element={<AdminSubmissions />} />
          <Route path="tools" element={<AdminTools />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="setup" element={<AdminSetupContent />} />
        </Routes>
      </section>
    </main>
  );
}

function AdminDashboard() {
  const { t } = usePortal();
  const metricCards = [
    { label: tx("جداول المحتوى", "Content tables"), value: contentTables.length, icon: "TableProperties" },
    { label: tx("نماذج عامة", "Public forms"), value: 4, icon: "Send" },
    { label: tx("روابط بدون اعتماد", "Pending official links"), value: importantLinks.length, icon: "ExternalLink" },
    { label: tx("مصدر البيانات", "Data source"), value: supabase ? "Supabase" : "Local", icon: "ShieldCheck" }
  ];

  return (
    <div className="admin-page">
      <SectionHeading
        title={tx("لوحة المؤشرات", "Dashboard")}
        description={tx(
          "نظرة تشغيلية على حالة البوابة والإعدادات الأساسية.",
          "An operational snapshot of portal status and core setup."
        )}
      />
      <div className="admin-metrics">
        {metricCards.map((metric) => (
          <article className="admin-metric" key={metric.label.en}>
            <Icon name={metric.icon} />
            <span>{t(metric.label)}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </div>
      <div className="admin-panel">
        <h2>{t(tx("قائمة قبول سريعة", "Quick Acceptance Checklist"))}</h2>
        <ul className="check-list">
          <li><CheckCircle2 /> {t(tx("عربي وإنجليزي مع RTL/LTR", "Arabic and English with RTL/LTR"))}</li>
          <li><CheckCircle2 /> {t(tx("وضع ليلي ونهاري وتباين أعلى", "Light, dark, and high contrast modes"))}</li>
          <li><CheckCircle2 /> {t(tx("Supabase Auth بدون كلمات مرور مدمجة", "Supabase Auth without embedded passwords"))}</li>
          <li><CheckCircle2 /> {t(tx("نماذج تحفظ في Supabase أو محليًا للمعاينة", "Forms save to Supabase or local preview"))}</li>
        </ul>
      </div>
    </div>
  );
}

function AdminContentManager() {
  const { t, notify } = usePortal();
  const [table, setTable] = useState(contentTables[0].table);
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    category_ar: "",
    category_en: "",
    icon: "FileText",
    status: "draft"
  });

  const loadRows = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    setRows((data || []) as Array<Record<string, unknown>>);
  }, [notify, table]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      notify(t(tx("Supabase غير متصل.", "Supabase is not connected.")), "error");
      return;
    }
    const { error } = await supabase.from(table).insert({
      ...form,
      sort_order: 100,
      visibility: "public"
    });
    if (error) {
      notify(error.message, "error");
      return;
    }
    notify(t(tx("تم حفظ المحتوى.", "Content saved.")), "success");
    setForm((current) => ({ ...current, title_ar: "", title_en: "", description_ar: "", description_en: "" }));
    loadRows();
  };

  const remove = async (id: unknown) => {
    if (!supabase || typeof id !== "string") return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) notify(error.message, "error");
    else {
      notify(t(tx("تم الحذف.", "Deleted.")), "success");
      loadRows();
    }
  };

  return (
    <div className="admin-page">
      <SectionHeading
        title={tx("إدارة المحتوى", "Content Management")}
        description={tx(
          "إضافة محتوى ثنائي اللغة للجداول الأساسية. النشر للعامة يتم عند status = published.",
          "Add bilingual content to core tables. Public display requires status = published."
        )}
      />
      <div className="admin-panel">
        <div className="admin-toolbar">
          <select value={table} onChange={(event) => setTable(event.target.value)}>
            {contentTables.map((item) => (
              <option key={item.table} value={item.table}>
                {t(item.label)}
              </option>
            ))}
          </select>
        </div>
        <form className="admin-form" onSubmit={save}>
          <input
            required
            placeholder={t(tx("العنوان بالعربية", "Arabic title"))}
            value={form.title_ar}
            onChange={(event) => setForm({ ...form, title_ar: event.target.value })}
          />
          <input
            required
            placeholder={t(tx("العنوان بالإنجليزية", "English title"))}
            value={form.title_en}
            onChange={(event) => setForm({ ...form, title_en: event.target.value })}
          />
          <textarea
            required
            placeholder={t(tx("الوصف بالعربية", "Arabic description"))}
            value={form.description_ar}
            onChange={(event) => setForm({ ...form, description_ar: event.target.value })}
          />
          <textarea
            required
            placeholder={t(tx("الوصف بالإنجليزية", "English description"))}
            value={form.description_en}
            onChange={(event) => setForm({ ...form, description_en: event.target.value })}
          />
          <input
            placeholder={t(tx("التصنيف بالعربية", "Arabic category"))}
            value={form.category_ar}
            onChange={(event) => setForm({ ...form, category_ar: event.target.value })}
          />
          <input
            placeholder={t(tx("التصنيف بالإنجليزية", "English category"))}
            value={form.category_en}
            onChange={(event) => setForm({ ...form, category_en: event.target.value })}
          />
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="draft">{t(tx("مسودة", "Draft"))}</option>
            <option value="published">{t(tx("منشور", "Published"))}</option>
          </select>
          <button className="btn btn-primary">
            <Save size={18} />
            {t(tx("حفظ", "Save"))}
          </button>
        </form>
      </div>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <h2>{t(tx("السجلات", "Records"))}</h2>
          {loading ? <Loader2 className="spin" /> : null}
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t(tx("العنوان", "Title"))}</th>
                <th>{t(tx("الحالة", "Status"))}</th>
                <th>{t(tx("إجراء", "Action"))}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.id)}>
                  <td>{displayRowValue(row, ["title_ar", "subject", "id"])}</td>
                  <td>{displayRowValue(row, ["status"], "-")}</td>
                  <td>
                    <button className="icon-button danger" onClick={() => remove(row.id)}>
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3}>{t(tx("لا توجد سجلات أو لم يتم إعداد Supabase بعد.", "No records or Supabase is not set up yet."))}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminSubmissions() {
  const { t, notify } = usePortal();
  const tabs: Array<{ kind: FormKind; label: LocalizedText; table: string }> = [
    { kind: "contact", label: tx("رسائل التواصل", "Contact"), table: "contact_messages" },
    { kind: "experience", label: tx("تجربة المستفيد", "Experience"), table: "experience_feedback" },
    { kind: "initiative", label: tx("المبادرات", "Initiatives"), table: "initiative_submissions" },
    { kind: "good_catch", label: tx("Good Catch", "Good Catch"), table: "good_catch_reports" }
  ];
  const [tab, setTab] = useState(tabs[0]);
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setRows(readLocalSubmissions(tab.kind));
        return;
      }
      const { data, error } = await supabase.from(tab.table).select("*").order("created_at", { ascending: false });
      if (error) {
        notify(error.message, "error");
        setRows(readLocalSubmissions(tab.kind));
        return;
      }
      setRows((data || []) as Array<Record<string, unknown>>);
    }
    load();
  }, [notify, tab]);

  return (
    <div className="admin-page">
      <SectionHeading title={tx("الرسائل والطلبات", "Submissions")} />
      <div className="admin-panel">
        <div className="tab-row">
          {tabs.map((item) => (
            <button
              className={tab.kind === item.kind ? "is-active" : ""}
              key={item.kind}
              onClick={() => setTab(item)}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => exportRowsToExcel(`${tab.table}-export`, rows)}
          disabled={rows.length === 0}
        >
          <Download size={18} />
          {t(tx("تصدير CSV متوافق مع Excel", "Export Excel-compatible CSV"))}
        </button>
        <div className="submission-list">
          {rows.map((row) => (
            <article className="submission-card" key={String(row.id)}>
              <strong>{displayRowValue(row, ["subject", "title", "name", "id"], "-")}</strong>
              <p>{displayRowValue(row, ["message", "expectedImpact", "category"])}</p>
              <span>{displayRowValue(row, ["status"], "new")}</span>
            </article>
          ))}
          {rows.length === 0 ? <p className="empty-state">{t(tx("لا توجد رسائل.", "No submissions."))}</p> : null}
        </div>
      </div>
    </div>
  );
}

function AdminTools() {
  const { t, notify } = usePortal();
  const [value, setValue] = useState("");
  const [qr, setQr] = useState("");

  const generate = async () => {
    if (!value.trim()) return;
    setQr(await createQrDataUrl(value.trim()));
    notify(t(tx("تم توليد QR.", "QR generated.")), "success");
  };

  return (
    <div className="admin-page">
      <SectionHeading
        title={tx("QR والتصدير", "QR & Export")}
        description={tx(
          "أدوات مساعدة لإعداد الروابط والتقارير الخفيفة من المتصفح.",
          "Helper tools for links and lightweight browser-side reports."
        )}
      />
      <div className="admin-panel tools-grid">
        <div>
          <h2>{t(tx("توليد QR", "Generate QR"))}</h2>
          <label>
            {t(tx("الرابط أو النص", "URL or text"))}
            <input value={value} onChange={(event) => setValue(event.target.value)} />
          </label>
          <button className="btn btn-primary" onClick={generate}>
            <QrCode size={18} />
            {t(tx("توليد", "Generate"))}
          </button>
        </div>
        <div className="qr-preview">
          {qr ? <img src={qr} alt={t(tx("رمز QR", "QR code"))} /> : <QrCode size={96} />}
        </div>
      </div>
    </div>
  );
}

function AdminSettings() {
  const { t, notify } = usePortal();
  const [showContact, setShowContact] = useState(false);
  const [notice, setNotice] = useState("");

  const save = async () => {
    if (!supabase) {
      notify(t(tx("Supabase غير متصل.", "Supabase is not connected.")), "error");
      return;
    }
    const { error } = await supabase.from("site_settings").upsert({
      key: "public_contact",
      value: { showContact, notice },
      is_public: true
    });
    if (error) notify(error.message, "error");
    else notify(t(tx("تم حفظ الإعدادات.", "Settings saved.")), "success");
  };

  return (
    <div className="admin-page">
      <SectionHeading
        title={tx("الإعدادات العامة", "General Settings")}
        description={tx(
          "حقول التواصل تبقى مخفية للعامة حتى تعتمدها الإدارة.",
          "Contact fields remain hidden publicly until approved by admins."
        )}
      />
      <div className="admin-panel admin-form">
        <label className="check-field">
          <input
            type="checkbox"
            checked={showContact}
            onChange={(event) => setShowContact(event.target.checked)}
          />
          {t(tx("تفعيل عرض بيانات التواصل عند إدخالها رسميًا", "Enable public contact display after official entry"))}
        </label>
        <label>
          {t(tx("رسالة عامة اختيارية", "Optional public notice"))}
          <textarea value={notice} onChange={(event) => setNotice(event.target.value)} />
        </label>
        <button className="btn btn-primary" onClick={save}>
          <Save size={18} />
          {t(tx("حفظ الإعدادات", "Save settings"))}
        </button>
      </div>
    </div>
  );
}

function AdminSetupNotice() {
  return (
    <main className="login-page">
      <section className="login-card wide">
        <AdminSetupContent />
      </section>
    </main>
  );
}

function AdminSetupContent() {
  const { t } = usePortal();
  return (
    <div className="setup-content">
      <span className="eyebrow">{t(tx("إعداد Supabase", "Supabase Setup"))}</span>
      <h1>{t(tx("إنشاء أول مدير", "Create the First Admin"))}</h1>
      <p>
        {t(
          tx(
            "أنشئ المستخدم من Supabase Auth، ثم عيّن role = super_admin في جدول profiles. التفاصيل الكاملة موجودة في docs/SUPABASE_SETUP.md.",
            "Create the user in Supabase Auth, then set role = super_admin in the profiles table. Full steps are in docs/SUPABASE_SETUP.md."
          )
        )}
      </p>
      <pre>{`update public.profiles
set role = 'super_admin', status = 'active'
where email = 'admin@example.com';`}</pre>
      <p className="muted">Supabase URL: {supabaseUrl}</p>
      <Link className="btn btn-secondary" to="/">
        <Home size={18} />
        {t(tx("العودة للموقع", "Back to site"))}
      </Link>
    </div>
  );
}

export default App;
