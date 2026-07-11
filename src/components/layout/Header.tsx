import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ChevronDown, Languages, LockKeyhole, Menu, Moon, Search, Sun, X } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { identity, megaMenu } from "../../data/content";
import { tx } from "../../utils/i18n";

export function Header() {
  const { t, locale, setLocale, theme, setTheme } = usePortal();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const closeAll = () => {
    setMobileOpen(false);
    setOpenIndex(null);
  };

  /* Close an open dropdown when clicking outside or pressing Escape. */
  useEffect(() => {
    if (openIndex === null) return;
    const onDown = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setOpenIndex(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenIndex(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openIndex]);

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        {t(tx("تجاوز إلى المحتوى", "Skip to content"))}
      </a>

      {/* Top utility bar */}
      <div className="top-strip">
        <div className="container top-strip-inner">
          <span className="top-strip-name">{t(identity.cluster)}</span>
          <div className="utility-actions">
            <Link className="utility-btn" to="/search" onClick={closeAll} aria-label={t(tx("بحث", "Search"))}>
              <Search size={16} />
              <span>{t(tx("بحث", "Search"))}</span>
            </Link>
            <button
              className="utility-btn"
              onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
              aria-label={t(tx("تغيير اللغة", "Change language"))}
            >
              <Languages size={16} />
              <span>{locale === "ar" ? "English" : "عربي"}</span>
            </button>
            <button
              className="utility-btn utility-icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label={t(tx("تغيير الوضع", "Change theme"))}
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <Link className="utility-btn utility-login" to="/admin" onClick={closeAll}>
              <LockKeyhole size={15} />
              <span>{t(tx("دخول الموظفين", "Staff access"))}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main row: brand + mega-menu */}
      <div className="container navbar">
        <Link className="brand" to="/" onClick={closeAll} aria-label={t(identity.name)}>
          <span className="brand-logo-wrap">
            <img className="brand-mark-color" src={identity.mark} alt="" width={48} height={49} fetchPriority="high" />
            <img className="brand-mark-white" src={identity.markWhite} alt="" width={48} height={49} fetchPriority="high" />
          </span>
          <span>
            <strong>{t(identity.name)}</strong>
            <small>{t(identity.portal)}</small>
          </span>
        </Link>

        <button
          className="nav-toggle"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label={t(tx("القائمة", "Menu"))}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={`mega-nav ${mobileOpen ? "is-open" : ""}`} aria-label="Primary" ref={navRef}>
          {megaMenu.map((item, index) =>
            item.children ? (
              <div
                key={item.label.en}
                className={`mega-item ${openIndex === index ? "is-open" : ""}`}
                onMouseEnter={() => setOpenIndex(index)}
                onMouseLeave={() => setOpenIndex((current) => (current === index ? null : current))}
              >
                <button
                  type="button"
                  className="mega-trigger"
                  aria-expanded={openIndex === index}
                  aria-haspopup="true"
                  onClick={() => setOpenIndex((current) => (current === index ? null : index))}
                >
                  {t(item.label)}
                  <ChevronDown size={15} className="mega-chevron" aria-hidden="true" />
                </button>
                <div className="mega-panel">
                  {item.children.map((child) => (
                    <NavLink key={child.path} to={child.path} onClick={closeAll}>
                      {t(child.label)}
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : (
              <NavLink key={item.path} to={item.path || "/"} className="mega-link" onClick={closeAll} end={item.path === "/"}>
                {t(item.label)}
              </NavLink>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
