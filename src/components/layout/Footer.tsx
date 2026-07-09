import { Link } from "react-router-dom";
import { usePortal } from "../../providers/PortalProvider";
import { identity, navItems } from "../../data/content";
import { tx } from "../../utils/i18n";

export function Footer() {
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
