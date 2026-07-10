import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { displayRowValue } from "../../utils/format";
import { tx } from "../../utils/i18n";
import { AdminEditorPanel, AdminField, AdminFormActions, AdminHelpPanel } from "./AdminUX";

type NavRow = Record<string, unknown>;

const emptyForm = {
  label_ar: "",
  label_en: "",
  path: "",
  url: "",
  icon: "",
  location: "header",
  parent_id: "",
  sort_order: 100,
  is_active: true
};

export function AdminNavigation() {
  const { t, notify } = usePortal();
  const [rows, setRows] = useState<NavRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadRows = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("navigation_items")
      .select("*")
      .order("location", { ascending: true })
      .order("sort_order", { ascending: true });
    setLoading(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    setRows((data || []) as NavRow[]);
  }, [notify]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const edit = (row: NavRow) => {
    setEditingId(String(row.id));
    setForm({
      label_ar: displayRowValue(row, ["label_ar"]),
      label_en: displayRowValue(row, ["label_en"]),
      path: displayRowValue(row, ["path"]),
      url: displayRowValue(row, ["url"]),
      icon: displayRowValue(row, ["icon"]),
      location: displayRowValue(row, ["location"], "header"),
      parent_id: displayRowValue(row, ["parent_id"]),
      sort_order: Number(displayRowValue(row, ["sort_order"], "100")),
      is_active: row.is_active !== false
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      notify(t(tx("Supabase غير متصل.", "Supabase is not connected.")), "error");
      return;
    }

    const payload = { ...form, parent_id: form.parent_id || null, path: form.path || null, url: form.url || null };

    if (editingId) {
      const { error } = await supabase.from("navigation_items").update(payload).eq("id", editingId);
      if (error) {
        notify(error.message, "error");
        return;
      }
      notify(t(tx("تم تحديث عنصر التنقل.", "Navigation item updated.")), "success");
    } else {
      const { error } = await supabase.from("navigation_items").insert(payload);
      if (error) {
        notify(error.message, "error");
        return;
      }
      notify(t(tx("تم إنشاء عنصر التنقل.", "Navigation item created.")), "success");
    }

    cancelEdit();
    loadRows();
  };

  const remove = async (id: unknown) => {
    if (!supabase || typeof id !== "string") return;
    const { error } = await supabase.from("navigation_items").delete().eq("id", id);
    if (error) notify(error.message, "error");
    else {
      if (editingId === id) cancelEdit();
      notify(t(tx("تم الحذف.", "Deleted.")), "success");
      loadRows();
    }
  };

  return (
    <div className="admin-page">
      <SectionHeading
        title={tx("إدارة قائمة التنقل", "Navigation")}
        description={tx(
          "تحكم في روابط الهيدر والفوتر والروابط السريعة. أي خطأ هنا قد يظهر مباشرة للزائر.",
          "Manage header, footer, and quick navigation links. Mistakes here can appear directly to visitors."
        )}
      />

      <AdminHelpPanel
        title={tx("مسار داخلي أم رابط خارجي؟", "Internal path or external URL")}
        description={tx(
          "استخدم المسار الداخلي للصفحات داخل الموقع مثل /services. استخدم الرابط الخارجي فقط للأنظمة أو المواقع خارج البوابة.",
          "Use internal paths for site pages such as /services. Use external URL only for systems or websites outside the portal."
        )}
        items={[
          tx("الرأس يظهر في القائمة العلوية.", "Header appears in the top navigation."),
          tx("التذييل يظهر أسفل الموقع.", "Footer appears at the bottom of the site."),
          tx("العنصر الأب يستخدم للقوائم المتداخلة.", "Parent item is used for nested menus.")
        ]}
      />

      <AdminEditorPanel
        title={tx("إضافة عنصر تنقل", "Add navigation item")}
        description={tx("أضف الرابط فقط بعد التأكد من أن الصفحة أو الرابط يعمل.", "Add the link only after confirming the page or URL works.")}
        impact={tx("العنصر المفعّل يظهر في مكانه حسب اختيار الرأس أو التذييل أو الروابط السريعة.", "An active item appears according to Header, Footer, or Quick links location.")}
        editing={Boolean(editingId)}
      >
        <form className="admin-form" onSubmit={save}>
          <AdminField label={tx("التسمية بالعربية", "Arabic label")}>
            <input required value={form.label_ar} onChange={(event) => setForm({ ...form, label_ar: event.target.value })} />
          </AdminField>
          <AdminField label={tx("التسمية بالإنجليزية", "English label")}>
            <input required value={form.label_en} onChange={(event) => setForm({ ...form, label_en: event.target.value })} />
          </AdminField>
          <AdminField label={tx("المسار الداخلي", "Internal path")} help={tx("مثال: /about أو /services. اتركه فارغًا إذا وضعت رابطًا خارجيًا.", "Example: /about or /services. Leave empty when using an external URL.")}>
            <input value={form.path} onChange={(event) => setForm({ ...form, path: event.target.value })} />
          </AdminField>
          <AdminField label={tx("رابط خارجي", "External URL")} help={tx("يجب أن يبدأ بـ https:// للروابط الخارجية.", "External URLs should start with https://.")}>
            <input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} />
          </AdminField>
          <AdminField label={tx("اسم الأيقونة", "Icon name")}>
            <input value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} />
          </AdminField>
          <AdminField label={tx("مكان الظهور", "Location")}>
            <select value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })}>
              <option value="header">{t(tx("الرأس", "Header"))}</option>
              <option value="footer">{t(tx("التذييل", "Footer"))}</option>
              <option value="quick">{t(tx("روابط سريعة", "Quick links"))}</option>
            </select>
          </AdminField>
          <AdminField label={tx("العنصر الأب", "Parent item")} help={tx("اختياري للقوائم المتداخلة.", "Optional for nested menus.")}>
            <select value={form.parent_id} onChange={(event) => setForm({ ...form, parent_id: event.target.value })}>
              <option value="">{t(tx("بدون عنصر أب", "No parent"))}</option>
              {rows
                .filter((row) => row.id !== editingId)
                .map((row) => (
                  <option key={String(row.id)} value={String(row.id)}>
                    {displayRowValue(row, ["label_ar"])}
                  </option>
                ))}
            </select>
          </AdminField>
          <AdminField label={tx("ترتيب العرض", "Sort order")}>
            <input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) || 0 })} />
          </AdminField>
          <label className="check-field admin-field">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
            {t(tx("عنصر مفعّل", "Active"))}
          </label>
          <AdminFormActions>
            <button className="btn btn-primary">
              <Save size={18} />
              {editingId ? t(tx("تحديث", "Update")) : t(tx("إنشاء", "Create"))}
            </button>
            {editingId ? (
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                <X size={18} />
                {t(tx("إلغاء التعديل", "Cancel edit"))}
              </button>
            ) : null}
          </AdminFormActions>
        </form>
      </AdminEditorPanel>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <h2>{t(tx("عناصر القائمة", "Menu items"))}</h2>
          {loading ? <Loader2 className="spin" /> : null}
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t(tx("التسمية", "Label"))}</th>
                <th>{t(tx("الموقع", "Location"))}</th>
                <th>{t(tx("مفعّل", "Active"))}</th>
                <th>{t(tx("إجراء", "Action"))}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.id)} className={editingId === row.id ? "is-editing" : ""}>
                  <td>{displayRowValue(row, ["label_ar"])}</td>
                  <td>{displayRowValue(row, ["location"])}</td>
                  <td>{row.is_active === false ? t(tx("لا", "No")) : t(tx("نعم", "Yes"))}</td>
                  <td>
                    <button className="icon-button" onClick={() => edit(row)} aria-label={t(tx("تعديل", "Edit"))}>
                      <Pencil size={17} />
                    </button>
                    <button className="icon-button danger" onClick={() => remove(row.id)} aria-label={t(tx("حذف", "Delete"))}>
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4}>{t(tx("لا توجد عناصر تنقل بعد.", "No navigation items yet."))}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
