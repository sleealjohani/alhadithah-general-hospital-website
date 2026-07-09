import { useState } from "react";
import { Save } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { tx } from "../../utils/i18n";

export function AdminSettings() {
  const { t, notify } = usePortal();
  const [showContact, setShowContact] = useState(false);
  const [notice, setNotice] = useState("");

  const save = async () => {
    if (!supabase) {
      notify(t(tx("Supabase غير متصل.", "Supabase is not connected.")), "error");
      return;
    }
    const { error } = await supabase.from("site_settings").upsert({
      key: "public_contact",
      value: { showContact, notice },
      is_public: true
    });
    if (error) notify(error.message, "error");
    else notify(t(tx("تم حفظ الإعدادات.", "Settings saved.")), "success");
  };

  return (
    <div className="admin-page">
      <SectionHeading
        title={tx("الإعدادات العامة", "General Settings")}
        description={tx(
          "حقول التواصل تبقى مخفية للعامة حتى تعتمدها الإدارة.",
          "Contact fields remain hidden publicly until approved by admins."
        )}
      />
      <div className="admin-panel admin-form">
        <label className="check-field">
          <input
            type="checkbox"
            checked={showContact}
            onChange={(event) => setShowContact(event.target.checked)}
          />
          {t(tx("تفعيل عرض بيانات التواصل عند إدخالها رسميًا", "Enable public contact display after official entry"))}
        </label>
        <label>
          {t(tx("رسالة عامة اختيارية", "Optional public notice"))}
          <textarea value={notice} onChange={(event) => setNotice(event.target.value)} />
        </label>
        <button className="btn btn-primary" onClick={save}>
          <Save size={18} />
          {t(tx("حفظ الإعدادات", "Save settings"))}
        </button>
      </div>
    </div>
  );
}
