import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Accessibility, Languages, LockKeyhole, Menu, Search, Sun, Moon, X } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { identity, navItems } from "../../data/content";
import { useNavigationItems } from "../../hooks/useNavigationItems";
import { tx } from "../../utils/i18n";
import type { NavMenuItem } from "../../types";

export function Header() {
  const { t, locale, setLocale, theme, setTheme, highContrast, setHighContrast } = usePortal();
  const [open, setOpen] = useState(false);
  const headerNav = useNavigationItems("header");
  /* Merge the standard pages with any admin-defined nav so every page always
     appears even when the DB navigation is partial; custom items and order
     still take effect. All items live on a dedicated full-width row below the
     brand, so nothing is hidden behind a "More" menu. */
  const seen = new Set(headerNav.map((item) => item.path).filter(Boolean));
  const nav: NavMenuItem[] = [...headerNav, ...navItems.filter((item) => !seen.has(item.path))];

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        {t(tx("تجاوز إلى المحتوى", "Skip to content"))}
      </a>
      <div className="top-strip">
        <div className="container top-strip-inner">
          <span>{t(identity.cluster)}</span>
          <span>{t(tx("بوابة رسمية للخدمات والمعلومات الصحية", "Official portal for health services and information"))}</span>
        </div>
      </div>

      <div className="container navbar">
        <Link className="brand" to="/" aria-label={t(identity.name)}>
          <span className="brand-logo-wrap">
            <img src={identity.logo} alt={t(identity.cluster)} width={72} height={42} fetchPriority="high" />
          </span>
          <span>
            <strong>{t(identity.name)}</strong>
            <small>{t(identity.portal)}</small>
          </span>
        </Link>

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
            <span>{t(tx("دخول الموظفين", "Staff access"))}</span>
          </Link>
          <button
            className="nav-toggle"
            onClick={() => setOpen((value) => !value)}
            aria-label={t(tx("القائمة", "Menu"))}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div className={`primary-nav-wrap ${open ? "is-open" : ""}`}>
        <nav className="container primary-nav" aria-label="Primary">
          {nav.map((item) => (
            <NavLink key={item.path || item.url || item.label.en} to={item.path || "/"} onClick={() => setOpen(false)}>
              {t(item.label)}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
