import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Accessibility, Languages, LockKeyhole, Menu, Moon, Search, Sun, X } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { identity, navItems } from "../../data/content";
import { tx } from "../../utils/i18n";

export function Header() {
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
