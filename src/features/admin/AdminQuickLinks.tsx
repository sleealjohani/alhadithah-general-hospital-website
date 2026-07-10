import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { logAdminAction } from "../../lib/audit";
import { displayRowValue } from "../../utils/format";
import { tx } from "../../utils/i18n";
import { ActiveBadge, CrudFormActions, Field, TableLoadingRows, useDeleteConfirm } from "./shared";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadRows = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!supabase) {
      notify(t(tx("Supabase غير متصل.", "Supabase is not connected.")), "error");
      return;
    }
    const payload = { ...form, path: form.path || null, url: form.url || null };
    setSaving(true);
    if (editingId) {
      const { error } = await supabase.from("quick_links").update(payload).eq("id", editingId);
      setSaving(false);
      if (error) {
        notify(error.message, "error");
        return;
      }
      logAdminAction("quick_link.update", "quick_links", editingId, { title_ar: form.title_ar });
      notify(t(tx("تم تحديث الرابط السريع.", "Quick link updated.")), "success");
    } else {
      const { error } = await supabase.from("quick_links").insert(payload);
      setSaving(false);
      if (error) {
        notify(error.message, "error");
        return;
      }
      logAdminAction("quick_link.create", "quick_links", null, { title_ar: form.title_ar });
      notify(t(tx("تم إنشاء الرابط السريع.", "Quick link created.")), "success");
    }
    cancelEdit();
    loadRows();
  };

  const { dialog: deleteDialog, requestDelete } = useDeleteConfirm(async (id) => {
    if (!supabase) return;
    const { error } = await supabase.from("quick_links").delete().eq("id", id);
    if (error) {
      notify(error.message, "error");
      return;
    }
    if (editingId === id) cancelEdit();
    logAdminAction("quick_link.delete", "quick_links", id);
    notify(t(tx("تم الحذف.", "Deleted.")), "success");
    loadRows();
  });

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
          <Field label={tx("العنوان بالعربية", "Arabic title")}>
            <input required value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} />
          </Field>
          <Field label={tx("العنوان بالإنجليزية", "English title")}>
            <input required dir="ltr" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
          </Field>
          <Field label={tx("الوصف بالعربية", "Arabic description")}>
            <input value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} />
          </Field>
          <Field label={tx("الوصف بالإنجليزية", "English description")}>
            <input dir="ltr" value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} />
          </Field>
          <Field label={tx("اسم الأيقونة (Lucide)", "Icon name (Lucide)")}>
            <input dir="ltr" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          </Field>
          <Field label={tx("الفئة المستهدفة", "Audience")}>
            <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
              <option value="public">{t(tx("عام", "Public"))}</option>
              <option value="employee">{t(tx("موظفون", "Employee"))}</option>
              <option value="admin">{t(tx("إدارة", "Admin"))}</option>
              <option value="all">{t(tx("الجميع", "All"))}</option>
            </select>
          </Field>
          <Field label={tx("المسار الداخلي", "Internal path")}>
            <input dir="ltr" placeholder="/services" value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} />
          </Field>
          <Field label={tx("رابط خارجي", "External URL")}>
            <input dir="ltr" placeholder="https://…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </Field>
          <Field label={tx("ترتيب العرض", "Sort order")}>
            <input
              type="number"
              inputMode="numeric"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
            />
          </Field>
          <label className="check-field">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            {t(tx("مفعّل", "Active"))}
          </label>
          <CrudFormActions busy={saving} editing={Boolean(editingId)} onCancel={cancelEdit} />
        </form>
      </div>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <h2>{t(tx("الروابط", "Links"))}</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table" aria-busy={loading}>
            <thead>
              <tr>
                <th>{t(tx("العنوان", "Title"))}</th>
                <th>{t(tx("الفئة", "Audience"))}</th>
                <th>{t(tx("الحالة", "State"))}</th>
                <th>{t(tx("إجراء", "Action"))}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoadingRows cols={4} />
              ) : (
                rows.map((row) => (
                  <tr key={String(row.id)} className={editingId === row.id ? "is-editing" : ""}>
                    <td>{displayRowValue(row, ["title_ar"])}</td>
                    <td>{displayRowValue(row, ["audience"])}</td>
                    <td>
                      <ActiveBadge active={row.is_active !== false} />
                    </td>
                    <td>
                      <button className="icon-button" onClick={() => edit(row)} aria-label={t(tx("تعديل", "Edit"))}>
                        <Pencil size={17} />
                      </button>
                      <button
                        className="icon-button danger"
                        onClick={() => requestDelete(String(row.id), displayRowValue(row, ["title_ar", "id"]))}
                        aria-label={t(tx("حذف", "Delete"))}
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={4}>{t(tx("لا توجد روابط سريعة بعد.", "No quick links yet."))}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      {deleteDialog}
    </div>
  );
}
