import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { displayRowValue } from "../../utils/format";
import { tx } from "../../utils/i18n";

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
    const { data, error } = await supabase
      .from("quick_links")
      .select("*")
      .order("sort_order", { ascending: true });
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
          "بطاقات المسارات السريعة في الصفحة الرئيسية (مسار المستفيد، الموظفين، المعرفة، الإدارة).",
          "The quick-access path cards on the homepage (beneficiary, employee, knowledge, admin)."
        )}
      />
      <div className="admin-panel">
        <form className="admin-form" onSubmit={save}>
          <input
            required
            placeholder={t(tx("العنوان بالعربية", "Arabic title"))}
            value={form.title_ar}
            onChange={(event) => setForm({ ...form, title_ar: event.target.value })}
          />
          <input
            required
            placeholder={t(tx("العنوان بالإنجليزية", "English title"))}
            value={form.title_en}
            onChange={(event) => setForm({ ...form, title_en: event.target.value })}
          />
          <input
            placeholder={t(tx("الوصف بالعربية", "Arabic description"))}
            value={form.description_ar}
            onChange={(event) => setForm({ ...form, description_ar: event.target.value })}
          />
          <input
            placeholder={t(tx("الوصف بالإنجليزية", "English description"))}
            value={form.description_en}
            onChange={(event) => setForm({ ...form, description_en: event.target.value })}
          />
          <input
            placeholder={t(tx("اسم الأيقونة (Lucide)", "Icon name (Lucide)"))}
            value={form.icon}
            onChange={(event) => setForm({ ...form, icon: event.target.value })}
          />
          <select value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })}>
            <option value="public">{t(tx("عام", "Public"))}</option>
            <option value="employee">{t(tx("موظفون", "Employee"))}</option>
            <option value="admin">{t(tx("إدارة", "Admin"))}</option>
            <option value="all">{t(tx("الجميع", "All"))}</option>
          </select>
          <input
            placeholder={t(tx("المسار الداخلي", "Internal path"))}
            value={form.path}
            onChange={(event) => setForm({ ...form, path: event.target.value })}
          />
          <input
            placeholder={t(tx("رابط خارجي", "External URL"))}
            value={form.url}
            onChange={(event) => setForm({ ...form, url: event.target.value })}
          />
          <input
            type="number"
            placeholder={t(tx("ترتيب العرض", "Sort order"))}
            value={form.sort_order}
            onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) || 0 })}
          />
          <label className="check-field">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
            />
            {t(tx("مفعّل", "Active"))}
          </label>
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
        </form>
      </div>

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
