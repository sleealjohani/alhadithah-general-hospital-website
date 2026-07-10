import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { logAdminAction } from "../../lib/audit";
import { displayRowValue } from "../../utils/format";
import { tx } from "../../utils/i18n";
import { ActiveBadge, CrudFormActions, Field, TableLoadingRows, useDeleteConfirm } from "./shared";

type SectionRow = Record<string, unknown>;

const emptyForm = {
  section_key: "",
  title_ar: "",
  title_en: "",
  subtitle_ar: "",
  subtitle_en: "",
  contentText: "{}",
  is_active: true,
  sort_order: 100
};

export function AdminHomepageSections() {
  const { t, notify } = usePortal();
  const [rows, setRows] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [jsonError, setJsonError] = useState(false);

  const loadRows = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("homepage_sections")
      .select("*")
      .order("sort_order", { ascending: true });
    setLoading(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    setRows((data || []) as SectionRow[]);
  }, [notify]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const edit = (row: SectionRow) => {
    setEditingId(String(row.id));
    setJsonError(false);
    setForm({
      section_key: displayRowValue(row, ["section_key"]),
      title_ar: displayRowValue(row, ["title_ar"]),
      title_en: displayRowValue(row, ["title_en"]),
      subtitle_ar: displayRowValue(row, ["subtitle_ar"]),
      subtitle_en: displayRowValue(row, ["subtitle_en"]),
      contentText: JSON.stringify(row.content ?? {}, null, 2),
      is_active: row.is_active !== false,
      sort_order: Number(displayRowValue(row, ["sort_order"], "100"))
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setJsonError(false);
  };

  const updateContentText = (value: string) => {
    setForm({ ...form, contentText: value });
    if (!value.trim()) {
      setJsonError(false);
      return;
    }
    try {
      JSON.parse(value);
      setJsonError(false);
    } catch {
      setJsonError(true);
    }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!supabase) {
      notify(t(tx("Supabase غير متصل.", "Supabase is not connected.")), "error");
      return;
    }

    let content: unknown;
    try {
      content = JSON.parse(form.contentText || "{}");
    } catch {
      setJsonError(true);
      notify(t(tx("محتوى JSON غير صالح.", "Invalid JSON content.")), "error");
      return;
    }

    const payload = {
      section_key: form.section_key,
      title_ar: form.title_ar || null,
      title_en: form.title_en || null,
      subtitle_ar: form.subtitle_ar || null,
      subtitle_en: form.subtitle_en || null,
      content,
      is_active: form.is_active,
      sort_order: form.sort_order
    };

    setSaving(true);
    if (editingId) {
      const { error } = await supabase.from("homepage_sections").update(payload).eq("id", editingId);
      setSaving(false);
      if (error) {
        notify(error.message, "error");
        return;
      }
      logAdminAction("homepage_section.update", "homepage_sections", editingId, { section_key: form.section_key });
      notify(t(tx("تم تحديث القسم.", "Section updated.")), "success");
    } else {
      const { error } = await supabase.from("homepage_sections").insert(payload);
      setSaving(false);
      if (error) {
        notify(error.message, "error");
        return;
      }
      logAdminAction("homepage_section.create", "homepage_sections", null, { section_key: form.section_key });
      notify(t(tx("تم إنشاء القسم.", "Section created.")), "success");
    }
    cancelEdit();
    loadRows();
  };

  const { dialog: deleteDialog, requestDelete } = useDeleteConfirm(async (id) => {
    if (!supabase) return;
    const { error } = await supabase.from("homepage_sections").delete().eq("id", id);
    if (error) {
      notify(error.message, "error");
      return;
    }
    if (editingId === id) cancelEdit();
    logAdminAction("homepage_section.delete", "homepage_sections", id);
    notify(t(tx("تم الحذف.", "Deleted.")), "success");
    loadRows();
  });

  return (
    <div className="admin-page">
      <SectionHeading
        title={tx("أقسام الصفحة الرئيسية", "Homepage Sections")}
        description={tx(
          "تفعيل/تعطيل وترتيب أقسام الرئيسية، مع بيانات إضافية بصيغة JSON لكل قسم.",
          "Toggle, order, and configure homepage sections, with a JSON field for extra per-section data."
        )}
      />
      <div className="admin-panel">
        <form className="admin-form" onSubmit={save}>
          <Field label={tx("مفتاح القسم", "Section key")}>
            <input
              required
              dir="ltr"
              disabled={Boolean(editingId)}
              placeholder="hero"
              value={form.section_key}
              onChange={(e) => setForm({ ...form, section_key: e.target.value })}
            />
          </Field>
          <Field label={tx("ترتيب العرض", "Sort order")}>
            <input
              type="number"
              inputMode="numeric"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label={tx("العنوان بالعربية", "Arabic title")}>
            <input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} />
          </Field>
          <Field label={tx("العنوان بالإنجليزية", "English title")}>
            <input dir="ltr" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
          </Field>
          <Field label={tx("العنوان الفرعي بالعربية", "Arabic subtitle")}>
            <input value={form.subtitle_ar} onChange={(e) => setForm({ ...form, subtitle_ar: e.target.value })} />
          </Field>
          <Field label={tx("العنوان الفرعي بالإنجليزية", "English subtitle")}>
            <input dir="ltr" value={form.subtitle_en} onChange={(e) => setForm({ ...form, subtitle_en: e.target.value })} />
          </Field>
          <Field label={tx("بيانات إضافية (JSON)", "Extra data (JSON)")} wide>
            <textarea
              className="code-field"
              placeholder='{"key": "value"}'
              aria-invalid={jsonError ? true : undefined}
              value={form.contentText}
              onChange={(e) => updateContentText(e.target.value)}
            />
            {jsonError ? (
              <span className="field-error">{t(tx("صيغة JSON غير صالحة.", "Invalid JSON syntax."))}</span>
            ) : null}
          </Field>
          <label className="check-field">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            {t(tx("قسم مفعّل", "Active"))}
          </label>
          <CrudFormActions busy={saving} editing={Boolean(editingId)} onCancel={cancelEdit} />
        </form>
      </div>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <h2>{t(tx("الأقسام", "Sections"))}</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table" aria-busy={loading}>
            <thead>
              <tr>
                <th>{t(tx("المفتاح", "Key"))}</th>
                <th>{t(tx("العنوان", "Title"))}</th>
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
                    <td dir="ltr">{displayRowValue(row, ["section_key"])}</td>
                    <td>{displayRowValue(row, ["title_ar"], "-")}</td>
                    <td>
                      <ActiveBadge active={row.is_active !== false} />
                    </td>
                    <td>
                      <button className="icon-button" onClick={() => edit(row)} aria-label={t(tx("تعديل", "Edit"))}>
                        <Pencil size={17} />
                      </button>
                      <button
                        className="icon-button danger"
                        onClick={() => requestDelete(String(row.id), displayRowValue(row, ["section_key", "id"]))}
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
                  <td colSpan={4}>{t(tx("لا توجد أقسام بعد.", "No sections yet."))}</td>
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
