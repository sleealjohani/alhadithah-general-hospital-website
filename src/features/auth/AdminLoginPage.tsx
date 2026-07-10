import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { identity } from "../../data/content";
import { usePageMeta } from "../../hooks/usePageMeta";
import { tx } from "../../utils/i18n";
import { useAuth } from "./AuthContext";

export function AdminLoginPage() {
  const { t } = usePortal();
  const { signIn, status } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  usePageMeta(tx("تسجيل دخول الموظفين", "Staff sign in"));

  /* Already signed in? Don't show the form again — go straight in. */
  useEffect(() => {
    if (status === "authenticated") navigate("/admin", { replace: true });
  }, [status, navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setBusy(false);
    if (signInError) {
      const invalidCredentials = /invalid/i.test(signInError.message);
      setError(
        invalidCredentials
          ? t(tx("البريد الإلكتروني أو كلمة المرور غير صحيحة.", "Incorrect email or password."))
          : t(
              tx(
                "تعذر الاتصال بالخادم. تحقق من الشبكة وأعد المحاولة.",
                "Couldn't reach the server. Check your connection and try again."
              )
            )
      );
      return;
    }
    navigate("/admin");
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <img src={identity.logo} alt={t(identity.cluster)} width={96} height={56} />
        <span className="eyebrow">{t(tx("لوحة التحكم", "Admin Console"))}</span>
        <h1>{t(tx("تسجيل دخول آمن", "Secure Sign In"))}</h1>
        <p>
          {t(
            tx(
              "الدخول لموظفي المستشفى المصرح لهم فقط. تُدار الحسابات عبر Supabase Auth.",
              "For authorized hospital staff only. Accounts are managed through Supabase Auth."
            )
          )}
        </p>
        <form onSubmit={submit} noValidate>
          <label>
            {t(tx("البريد الإلكتروني", "Email"))}
            <input
              type="email"
              required
              autoFocus
              dir="ltr"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError(null);
              }}
              autoComplete="email"
              inputMode="email"
              aria-invalid={error ? true : undefined}
            />
          </label>
          <label>
            {t(tx("كلمة المرور", "Password"))}
            <span className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                required
                dir="ltr"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                }}
                autoComplete="current-password"
                aria-invalid={error ? true : undefined}
              />
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword
                    ? t(tx("إخفاء كلمة المرور", "Hide password"))
                    : t(tx("إظهار كلمة المرور", "Show password"))
                }
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          {error ? (
            <p className="field-error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="btn btn-primary" disabled={busy} type="submit">
            {busy ? <Loader2 className="spin" size={18} /> : <LogIn size={18} />}
            {busy ? t(tx("جارٍ الدخول…", "Signing in…")) : t(tx("دخول", "Sign in"))}
          </button>
        </form>
        <Link className="text-link" to="/admin-setup">
          {t(tx("طريقة إنشاء أول مدير", "How to create the first admin"))}
        </Link>
      </section>
    </main>
  );
}
