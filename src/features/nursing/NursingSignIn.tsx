import { useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { Modal } from "../../components/ui/Modal";
import { nursingLookup, nursingSetPin, nursingSignIn, setNursingToken } from "../../lib/supabase/nursing";
import { tx } from "../../utils/i18n";

type Step = "emp" | "pin" | "create";

export function NursingSignIn({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = usePortal();
  const [step, setStep] = useState<Step>("emp");
  const [emp, setEmp] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const lookup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!emp.trim()) return;
    setBusy(true);
    setError("");
    const res = await nursingLookup(emp.trim());
    setBusy(false);
    if (!res || res.status === "error") return setError(t(tx("تعذّر الاتصال، حاول مجددًا.", "Connection failed, try again.")));
    if (res.status === "not_found") return setError(t(tx("رقم الموظف غير مسجّل في قاعدة التمريض.", "Employee number is not in the nursing database.")));
    setName(res.full_name || "");
    setStep(res.has_pin ? "pin" : "create");
  };

  const doSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await nursingSignIn(emp.trim(), pin);
    setBusy(false);
    if (res?.status === "ok" && res.token) {
      setNursingToken(res.token);
      onSuccess();
      return;
    }
    setError(t(tx("الرقم السري غير صحيح.", "Incorrect PIN.")));
  };

  const doCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pin.length < 4) return setError(t(tx("الرقم السري 4 أرقام على الأقل.", "PIN must be at least 4 digits.")));
    if (pin !== pin2) return setError(t(tx("الرقمان غير متطابقين.", "The PINs do not match.")));
    setBusy(true);
    setError("");
    const res = await nursingSetPin(emp.trim(), pin);
    setBusy(false);
    if (res?.status === "ok" && res.token) {
      setNursingToken(res.token);
      onSuccess();
      return;
    }
    if (res?.status === "already_set") {
      setStep("pin");
      setError(t(tx("لديك رقم سري بالفعل، أدخله.", "You already have a PIN — please enter it.")));
      return;
    }
    setError(t(tx("تعذّر إنشاء الرقم السري.", "Could not create the PIN.")));
  };

  return (
    <Modal title={t(tx("دخول كادر التمريض", "Nursing staff sign-in"))} onClose={onClose}>
      <div className="nursing-signin">
        <span className="service-icon nursing-signin-icon">
          <ShieldCheck size={26} />
        </span>

        {step === "emp" ? (
          <form className="nursing-signin-form" onSubmit={lookup}>
            <p className="muted">
              {t(tx("أدخل رقمك الوظيفي للمتابعة.", "Enter your employee number to continue."))}
            </p>
            <label>
              {t(tx("الرقم الوظيفي", "Employee number"))}
              <input value={emp} onChange={(e) => setEmp(e.target.value)} inputMode="numeric" dir="auto" autoFocus />
            </label>
            {error ? <p className="field-error">{error}</p> : null}
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? t(tx("جارٍ التحقق…", "Checking…")) : t(tx("متابعة", "Continue"))}
            </button>
          </form>
        ) : step === "pin" ? (
          <form className="nursing-signin-form" onSubmit={doSignIn}>
            <p>
              {t(tx("مرحبًا", "Welcome"))} <strong>{name}</strong> — {t(tx("أدخل رقمك السري.", "enter your PIN."))}
            </p>
            <label>
              <LockKeyhole size={14} /> {t(tx("الرقم السري", "PIN"))}
              <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" inputMode="numeric" autoFocus />
            </label>
            {error ? <p className="field-error">{error}</p> : null}
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? t(tx("جارٍ الدخول…", "Signing in…")) : t(tx("دخول", "Sign in"))}
            </button>
          </form>
        ) : (
          <form className="nursing-signin-form" onSubmit={doCreate}>
            <p>
              {t(tx("مرحبًا", "Welcome"))} <strong>{name}</strong> — {t(tx("أنشئ رقمًا سريًا لأول مرة.", "create a PIN for your first sign-in."))}
            </p>
            <label>
              {t(tx("رقم سري جديد", "New PIN"))}
              <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" inputMode="numeric" autoFocus />
            </label>
            <label>
              {t(tx("تأكيد الرقم السري", "Confirm PIN"))}
              <input value={pin2} onChange={(e) => setPin2(e.target.value)} type="password" inputMode="numeric" />
            </label>
            {error ? <p className="field-error">{error}</p> : null}
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? t(tx("جارٍ الحفظ…", "Saving…")) : t(tx("إنشاء ودخول", "Create & sign in"))}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}
