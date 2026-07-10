import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { Skeleton } from "../../components/ui/Skeleton";
import { supabase } from "../../lib/supabase/client";
import { logAdminAction } from "../../lib/audit";
import { tx } from "../../utils/i18n";

type ContactSettings = { showContact: boolean; notice: string };

export function AdminSettings() {
  const { t, notify } = usePortal();
  const [settings, setSettings] = useState<ContactSettings | null>(null);
  const [saving, setSaving] = useState(false);

  /* Load the stored values first — saving used to overwrite the row with
     defaults because the form always started blank. */
  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase) {
        if (active) setSettings({ showContact: false, notice: "" });
        return;
      }
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "public_contact")
        .maybeSingle();
      if (!active) return;
      if (error) {
        notify(error.message, "error");
        setSettings({ showContact: false, notice: "" });
        return;
      }
      const value = (data?.value ?? {}) as Partial<ContactSettings>;
      setSettings({ showContact: Boolean(value.showContact), notice: value.notice ?? "" });
    }
    load();
    return () => {
      active = false;
    };
  }, [notify]);

  const save = async () => {
    if (!settings || saving) return;
    if (!supabase) {
      notify(t(tx("Supabase غير متصل.", "Supabase is not connected.")), "error");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert(
      {
        key: "public_contact",
        value: { showContact: settings.showContact, notice: settings.notice },
        is_public: true
      },
      { onConflict: "key" }
    );
    setSaving(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    logAdminAction("settings.update", "site_settings", null, { key: "public_contact" });
    notify(t(tx("تم حفظ الإعدادات.", "Settings saved.")), "success");
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
        {settings === null ? (
          <>
            <Skeleton variant="text" />
            <Skeleton variant="block" />
          </>
        ) : (
          <>
            <label className="check-field">
              <input
                type="checkbox"
                checked={settings.showContact}
                onChange={(event) => setSettings({ ...settings, showContact: event.target.checked })}
              />
              {t(tx("تفعيل عرض بيانات التواصل عند إدخالها رسميًا", "Enable public contact display after official entry"))}
            </label>
            <label className="field-wide">
              {t(tx("رسالة عامة اختيارية", "Optional public notice"))}
              <textarea
                value={settings.notice}
                onChange={(event) => setSettings({ ...settings, notice: event.target.value })}
              />
            </label>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
              {t(tx("حفظ الإعدادات", "Save settings"))}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
