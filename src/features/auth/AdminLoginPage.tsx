import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, LogIn } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { identity } from "../../data/content";
import { tx } from "../../utils/i18n";
import { useAuth } from "./AuthContext";

export function AdminLoginPage() {
  const { t, notify } = usePortal();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await signIn(email, password);
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
