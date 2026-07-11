import { Link } from "react-router-dom";
import { usePortal } from "../../providers/PortalProvider";
import { identity } from "../../data/content";
import { useNavigationItems } from "../../hooks/useNavigationItems";
import { tx } from "../../utils/i18n";

export function Footer() {
  const { t } = usePortal();
  const headerNav = useNavigationItems("header");
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <img className="footer-logo" src={identity.lockupWhite} alt={t(identity.name)} width={280} height={95} loading="lazy" decoding="async" />
          <p>{t(identity.tagline)}</p>
        </div>
        <div>
          <h3>{t(tx("روابط رئيسية", "Main Links"))}</h3>
          <ul>
            {headerNav.slice(1, 7).map((item) => (
              <li key={item.path}>
                <Link to={item.path || "/"}>{t(item.label)}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>{t(tx("قنوات الخدمة", "Service Channels"))}</h3>
          <p>
            {t(
              tx(
                "تجمع البوابة الخدمات الصحية، الأدلة، الأخبار، النماذج، وقنوات تجربة المستفيد في واجهة رسمية واحدة.",
                "The portal brings health services, guides, news, forms, and beneficiary-experience channels into one official interface."
              )
            )}
          </p>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>{t(tx("© مستشفى الحديثة العام. جميع الحقوق محفوظة.", "© Hadetha General Hospital. All rights reserved."))}</span>
        <Link to="/admin">{t(tx("دخول الموظفين", "Staff access"))}</Link>
      </div>
    </footer>
  );
}
