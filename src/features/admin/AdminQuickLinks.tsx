import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { displayRowValue } from "../../utils/format";
import { tx } from "../../utils/i18n";
import { AdminEditorPanel, AdminField, AdminFormActions, AdminHelpPanel } from "./AdminUX";

type QuickLinkRow = Record<string, unknown>;

const emptyForm = {
  title_ar: "",
  title_en: "",
  description_ar: "",
  description_en: "",
  icon: "ExternalLink",
  path: "",
  url: "",
  audience: "public",
  sort_order: 100,
  is_active: true
};

export function AdminQuickLinks() {
  const { t, notify } = usePortal();
  const [rows, setRows] = useState<QuickLinkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadRows = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from("quick_links").select("*").order("sort_order", { ascending: true });
    setLoading(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    setRows((data || []) as QuickLinkRow[]);
  }, [notify]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const edit = (row: QuickLinkRow) => {
    setEditingId(String(row.id));
    setForm({
      title_ar: displayRowValue(row, ["title_ar"]),
      title_en: displayRowValue(row, ["title_en"]),
      description_ar: displayRowValue(row, ["description_ar"]),
      description_en: displayRowValue(row, ["description_en"]),
      icon: displayRowValue(row, ["icon"], "ExternalLink"),
      path: displayRowValue(row, ["path"]),
      url: displayRowValue(row, ["url"]),
      audience: displayRowValue(row, ["audience"], "public"),
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

    const payload = { ...form, path: form.path || null, url: form.url || null };

    if (editingId) {
      const { error } = await supabase.from("quick_links").update(payload).eq("id", editingId);
      if (error) {
        notify(error.message, "error");
        return;
      }
      notify(t(tx("تم تحديث الرابط السريع.", "Quick link updated.")), "success");
    } else {
      const { error } = await supabase.from("quick_links").insert(payload);
      if (error) {
        notify(error.message, "error");
        return;
      }
      notify(t(tx("تم إنشاء الرابط السريع.", "Quick link created.")), "success");
    }

    cancelEdit();
    loadRows();
  };

  const remove = async (id: unknown) => {
    if (!supabase || typeof id !== "string") return;
    const { error } = await supabase.from("quick_links").delete().eq("id", id);
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
        title={tx("الروابط السريعة", "Quick Links")}
        description={tx(
          "بطاقات المسارات السريعة في الصفحة الرئيسية وصفحات الموظفين والمعرفة.",
          "Quick-access cards shown on the homepage and related staff/knowledge paths."
        )}
      />

      <AdminHelpPanel
        title={tx("أين تظهر الروابط السريعة؟", "Where quick links appear")}
        description={tx(
          "الرابط المفعّل والمنشور يظهر كبطاقة اختصار للزائر حسب الفئة. استخدم مسار داخلي أو رابط خارجي، وليس الاثنين إلا عند الحاجة.",
          "Active quick links appear as shortcut cards based on audience. Use either an internal path or an external URL unless there is a clear need."
        )}
        items={[
          tx("عام: يظهر للزوار في المسارات العامة.", "Public: visible to public visitors."),
          tx("موظفون: مناسب للروابط الداخلية والنماذج.", "Employee: suitable for internal links and forms."),
          tx("ترتيب العرض يحدد مكان البطاقة بين بقية الروابط.", "Sort order controls the card position.")
        ]}
      />

      <AdminEditorPanel
        title={tx("إضافة رابط سريع", "Add quick link")}
        description={tx("استخدمه للروابط المتكررة أو المهمة التي يحتاجها الزائر بسرعة.", "Use this for frequent or important links visitors need quickly.")}
        impact={tx(
          "بعد التفعيل سيظهر الرابط في الواجهة حسب الفئة والمسار المختار.",
          "After activation, the link appears in the interface according to audience and target."
        )}
        editing={Boolean(editingId)}
      >
        <form className="admin-form" onSubmit={save}>
          <AdminField label={tx("العنوان بالعربية", "Arabic title")}>
            <input required value={form.title_ar} onChange={(event) => setForm({ ...form, title_ar: event.target.value })} />
          </AdminField>
          <AdminField label={tx("العنوان بالإنجليزية", "English title")}>
            <input required value={form.title_en} onChange={(event) => setForm({ ...form, title_en: event.target.value })} />
          </AdminField>
          <AdminField wide label={tx("الوصف بالعربية", "Arabic description")} help={tx("يظهر تحت عنوان البطاقة، فاجعله قصيرًا.", "Shown under the card title, so keep it short.")}>
            <textarea value={form.description_ar} onChange={(event) => setForm({ ...form, description_ar: event.target.value })} />
          </AdminField>
          <AdminField wide label={tx("الوصف بالإنجليزية", "English description")}>
            <textarea value={form.description_en} onChange={(event) => setForm({ ...form, description_en: event.target.value })} />
          </AdminField>
          <AdminField label={tx("الفئة", "Audience")} help={tx("تحدد مكان وسياق ظهور البطاقة.", "Controls where and for whom the card appears.")}>
            <select value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })}>
              <option value="public">{t(tx("عام", "Public"))}</option>
              <option value="employee">{t(tx("موظفون", "Employee"))}</option>
              <option value="admin">{t(tx("إدارة", "Admin"))}</option>
              <option value="all">{t(tx("الجميع", "All"))}</option>
            </select>
          </AdminField>
          <AdminField label={tx("اسم الأيقونة", "Icon name")} help={tx("اسم أيقونة من Lucide مثل FileText أو ExternalLink.", "Lucide icon name such as FileText or ExternalLink.")}>
            <input value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} />
          </AdminField>
          <AdminField label={tx("مسار داخلي", "Internal path")} help={tx("مثال: /services أو /quality.", "Example: /services or /quality.")}>
            <input value={form.path} onChange={(event) => setForm({ ...form, path: event.target.value })} />
          </AdminField>
          <AdminField label={tx("رابط خارجي", "External URL")} help={tx("استخدمه للأنظمة الخارجية فقط.", "Use for external systems only.")}>
            <input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} />
          </AdminField>
          <AdminField label={tx("ترتيب العرض", "Sort order")}>
            <input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) || 0 })} />
          </AdminField>
          <label className="check-field admin-field">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
            {t(tx("مفعّل", "Active"))}
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
          <h2>{t(tx("الروابط", "Links"))}</h2>
          {loading ? <Loader2 className="spin" /> : null}
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t(tx("العنوان", "Title"))}</th>
                <th>{t(tx("الفئة", "Audience"))}</th>
                <th>{t(tx("مفعّل", "Active"))}</th>
                <th>{t(tx("إجراء", "Action"))}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.id)} className={editingId === row.id ? "is-editing" : ""}>
                  <td>{displayRowValue(row, ["title_ar"])}</td>
                  <td>{displayRowValue(row, ["audience"])}</td>
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
                  <td colSpan={4}>{t(tx("لا توجد روابط سريعة بعد.", "No quick links yet."))}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
