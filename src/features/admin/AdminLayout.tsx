import { Link, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { Icon } from "../../components/ui/Icon";
import { identity, roleLabels } from "../../data/content";
import { adminNav } from "../../constants/adminNav";
import { tx } from "../../utils/i18n";
import { useAuth } from "../auth/AuthContext";
import { AdminDashboard } from "./AdminDashboard";
import { AdminContentManager } from "./AdminContentManager";
import { AdminPages } from "./AdminPages";
import { AdminNavigation } from "./AdminNavigation";
import { AdminHomepageSections } from "./AdminHomepageSections";
import { AdminQuickLinks } from "./AdminQuickLinks";
import { AdminDoctors } from "./AdminDoctors";
import { AdminTraining } from "./AdminTraining";
import { AdminNursing } from "./AdminNursing";
import { AdminMedia } from "./AdminMedia";
import { AdminSubmissions } from "./AdminSubmissions";
import { AdminTools } from "./AdminTools";
import { AdminSettings } from "./AdminSettings";
import { AdminSetupContent } from "./AdminSetupContent";

export function AdminLayout() {
  const { t, notify } = usePortal();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!profile) return null;

  /* The h1 names the current screen, not the visitor — matching what each
     page's content is actually about. */
  const activeItem =
    adminNav.find((item) => item.path !== "/admin" && location.pathname.startsWith(item.path)) ??
    adminNav[0];

  const logout = async () => {
    await signOut();
    notify(t(tx("تم تسجيل الخروج.", "Signed out.")), "success");
    navigate("/");
  };

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/">
          <img src={identity.markWhite} alt={t(identity.cluster)} />
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
            <span className="eyebrow">{t(tx("لوحة التحكم", "Admin Console"))}</span>
            <h1>{t(activeItem.label)}</h1>
          </div>
          <div className="admin-user">
            <div className="admin-user-meta">
              <strong>{profile.full_name || profile.email || t(tx("مستخدم إداري", "Admin user"))}</strong>
              <span className="badge badge-info">{t(roleLabels[profile.role] || roleLabels.viewer)}</span>
            </div>
            <button className="btn btn-secondary" onClick={logout}>
              <LogOut size={18} />
              {t(tx("خروج", "Logout"))}
            </button>
          </div>
        </header>
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="content" element={<AdminContentManager />} />
          <Route path="pages" element={<AdminPages />} />
          <Route path="navigation" element={<AdminNavigation />} />
          <Route path="homepage" element={<AdminHomepageSections />} />
          <Route path="quick-links" element={<AdminQuickLinks />} />
          <Route path="doctors" element={<AdminDoctors />} />
          <Route path="training" element={<AdminTraining />} />
          <Route path="nursing" element={<AdminNursing />} />
          <Route path="media" element={<AdminMedia />} />
          <Route path="submissions" element={<AdminSubmissions />} />
          <Route path="tools" element={<AdminTools />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="setup" element={<AdminSetupContent />} />
        </Routes>
      </section>
    </main>
  );
}
