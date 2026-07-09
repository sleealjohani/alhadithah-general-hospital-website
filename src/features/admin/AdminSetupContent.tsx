import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import { usePortal } from "../../providers/PortalProvider";
import { supabaseUrl } from "../../lib/supabase/client";
import { tx } from "../../utils/i18n";

export function AdminSetupContent() {
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

export function AdminSetupNotice() {
  return (
    <main className="login-page">
      <section className="login-card wide">
        <AdminSetupContent />
      </section>
    </main>
  );
}
