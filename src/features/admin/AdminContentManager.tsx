import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { logAdminAction } from "../../lib/audit";
import { contentTables } from "../../data/content";
import { displayRowValue } from "../../utils/format";
import { tx } from "../../utils/i18n";
import { CrudFormActions, Field, StatusBadge, TableLoadingRows, useDeleteConfirm } from "./shared";

const emptyForm = {
  title_ar: "",
  title_en: "",
  description_ar: "",
  description_en: "",
  category_ar: "",
  category_en: "",
  icon: "FileText",
  status: "draft"
};

export function AdminContentManager() {
  const { t, notify } = usePortal();
  const [table, setTable] = useState(contentTables[0].table);
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
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
    const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    setRows((data || []) as Array<Record<string, unknown>>);
  }, [notify, table]);

  useEffect(() => {
    setEditingId(null);
    setForm(emptyForm);
    loadRows();
  }, [loadRows]);

  const edit = (row: Record<string, unknown>) => {
    setEditingId(String(row.id));
    setForm({
      title_ar: displayRowValue(row, ["title_ar"]),
      title_en: displayRowValue(row, ["title_en"]),
      description_ar: displayRowValue(row, ["description_ar"]),
      description_en: displayRowValue(row, ["description_en"]),
      category_ar: displayRowValue(row, ["category_ar"]),
      category_en: displayRowValue(row, ["category_en"]),
      icon: displayRowValue(row, ["icon"], "FileText"),
      status: displayRowValue(row, ["status"], "draft")
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
    setSaving(true);
    if (editingId) {
      const { error } = await supabase.from(table).update(form).eq("id", editingId);
      setSaving(false);
      if (error) {
        notify(error.message, "error");
        return;
      }
      logAdminAction("content.update", table, editingId, { title_ar: form.title_ar });
      notify(t(tx("تم تحديث المحتوى.", "Content updated.")), "success");
    } else {
      const { error } = await supabase.from(table).insert({ ...form, sort_order: 100, visibility: "public" });
      setSaving(false);
      if (error) {
        notify(error.message, "error");
        return;
      }
      logAdminAction("content.create", table, null, { title_ar: form.title_ar });
      notify(t(tx("تم حفظ المحتوى.", "Content saved.")), "success");
    }
    cancelEdit();
    loadRows();
  };

  const { dialog: deleteDialog, requestDelete } = useDeleteConfirm(async (id) => {
    if (!supabase) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      notify(error.message, "error");
      return;
    }
    if (editingId === id) cancelEdit();
    logAdminAction("content.delete", table, id);
    notify(t(tx("تم الحذف.", "Deleted.")), "success");
    loadRows();
  });

  return (
    <div className="admin-page">
      <SectionHeading
        title={tx("إدارة المحتوى", "Content Management")}
        description={tx(
          "إضافة أو تعديل محتوى ثنائي اللغة للجداول الأساسية. النشر للعامة يتم عند status = published.",
          "Add or edit bilingual content in core tables. Public display requires status = published."
        )}
      />
      <div className="admin-panel">
        <div className="admin-toolbar">
          <Field label={tx("الجدول", "Table")}>
            <select value={table} onChange={(event) => setTable(event.target.value)}>
              {contentTables.map((item) => (
                <option key={item.table} value={item.table}>
                  {t(item.label)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <form className="admin-form" onSubmit={save}>
          <Field label={tx("العنوان بالعربية", "Arabic title")}>
            <input required value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} />
          </Field>
          <Field label={tx("العنوان بالإنجليزية", "English title")}>
            <input required dir="ltr" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
          </Field>
          <Field label={tx("الوصف بالعربية", "Arabic description")} wide>
            <textarea required value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} />
          </Field>
          <Field label={tx("الوصف بالإنجليزية", "English description")} wide>
            <textarea required dir="ltr" value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} />
          </Field>
          <Field label={tx("التصنيف بالعربية", "Arabic category")}>
            <input value={form.category_ar} onChange={(e) => setForm({ ...form, category_ar: e.target.value })} />
          </Field>
          <Field label={tx("التصنيف بالإنجليزية", "English category")}>
            <input dir="ltr" value={form.category_en} onChange={(e) => setForm({ ...form, category_en: e.target.value })} />
          </Field>
          <Field label={tx("الحالة", "Status")}>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">{t(tx("مسودة", "Draft"))}</option>
              <option value="published">{t(tx("منشور", "Published"))}</option>
            </select>
          </Field>
          <CrudFormActions
            busy={saving}
            editing={Boolean(editingId)}
            onCancel={cancelEdit}
            createLabel={tx("حفظ", "Save")}
          />
        </form>
      </div>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <h2>{t(tx("السجلات", "Records"))}</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table" aria-busy={loading}>
            <thead>
              <tr>
                <th>{t(tx("العنوان", "Title"))}</th>
                <th>{t(tx("الحالة", "Status"))}</th>
                <th>{t(tx("إجراء", "Action"))}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoadingRows cols={3} />
              ) : (
                rows.map((row) => (
                  <tr key={String(row.id)} className={editingId === row.id ? "is-editing" : ""}>
                    <td>{displayRowValue(row, ["title_ar", "subject", "id"])}</td>
                    <td>
                      <StatusBadge value={displayRowValue(row, ["status"], "-")} />
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
                  <td colSpan={3}>{t(tx("لا توجد سجلات بعد.", "No records yet."))}</td>
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
