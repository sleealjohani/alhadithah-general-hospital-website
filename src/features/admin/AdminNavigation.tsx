import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { logAdminAction } from "../../lib/audit";
import { displayRowValue } from "../../utils/format";
import { tx } from "../../utils/i18n";
import { ActiveBadge, CrudFormActions, Field, TableLoadingRows, useDeleteConfirm } from "./shared";

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
    const payload = { ...form, parent_id: form.parent_id || null, path: form.path || null, url: form.url || null };
    setSaving(true);
    if (editingId) {
      const { error } = await supabase.from("navigation_items").update(payload).eq("id", editingId);
      setSaving(false);
      if (error) {
        notify(error.message, "error");
        return;
      }
      logAdminAction("navigation.update", "navigation_items", editingId, { label_ar: form.label_ar });
      notify(t(tx("تم تحديث عنصر التنقل.", "Navigation item updated.")), "success");
    } else {
      const { error } = await supabase.from("navigation_items").insert(payload);
      setSaving(false);
      if (error) {
        notify(error.message, "error");
        return;
      }
      logAdminAction("navigation.create", "navigation_items", null, { label_ar: form.label_ar });
      notify(t(tx("تم إنشاء عنصر التنقل.", "Navigation item created.")), "success");
    }
    cancelEdit();
    loadRows();
  };

  const { dialog: deleteDialog, requestDelete } = useDeleteConfirm(async (id) => {
    if (!supabase) return;
    const { error } = await supabase.from("navigation_items").delete().eq("id", id);
    if (error) {
      notify(error.message, "error");
      return;
    }
    if (editingId === id) cancelEdit();
    logAdminAction("navigation.delete", "navigation_items", id);
    notify(t(tx("تم الحذف.", "Deleted.")), "success");
    loadRows();
  });

  return (
    <div className="admin-page">
      <SectionHeading
        title={tx("إدارة قائمة التنقل", "Navigation")}
        description={tx(
          "تحكم بعناصر قائمة الرأس والتذييل والروابط السريعة، مع دعم التداخل الأبوي.",
          "Manage header, footer, and quick-link menu entries, including parent nesting."
        )}
      />
      <div className="admin-panel">
        <form className="admin-form" onSubmit={save}>
          <Field label={tx("التسمية بالعربية", "Arabic label")}>
            <input required value={form.label_ar} onChange={(e) => setForm({ ...form, label_ar: e.target.value })} />
          </Field>
          <Field label={tx("التسمية بالإنجليزية", "English label")}>
            <input required dir="ltr" value={form.label_en} onChange={(e) => setForm({ ...form, label_en: e.target.value })} />
          </Field>
          <Field label={tx("المسار الداخلي", "Internal path")}>
            <input dir="ltr" placeholder="/about" value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} />
          </Field>
          <Field label={tx("رابط خارجي", "External URL")}>
            <input dir="ltr" placeholder="https://…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </Field>
          <Field label={tx("اسم الأيقونة (Lucide)", "Icon name (Lucide)")}>
            <input dir="ltr" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          </Field>
          <Field label={tx("الموقع", "Location")}>
            <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
              <option value="header">{t(tx("الرأس", "Header"))}</option>
              <option value="footer">{t(tx("التذييل", "Footer"))}</option>
              <option value="quick">{t(tx("روابط سريعة", "Quick links"))}</option>
            </select>
          </Field>
          <Field label={tx("العنصر الأب", "Parent item")}>
            <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
              <option value="">{t(tx("بدون عنصر أب", "No parent"))}</option>
              {rows
                .filter((row) => row.id !== editingId)
                .map((row) => (
                  <option key={String(row.id)} value={String(row.id)}>
                    {displayRowValue(row, ["label_ar"])}
                  </option>
                ))}
            </select>
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
            {t(tx("عنصر مفعّل", "Active"))}
          </label>
          <CrudFormActions busy={saving} editing={Boolean(editingId)} onCancel={cancelEdit} />
        </form>
      </div>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <h2>{t(tx("عناصر القائمة", "Menu items"))}</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table" aria-busy={loading}>
            <thead>
              <tr>
                <th>{t(tx("التسمية", "Label"))}</th>
                <th>{t(tx("الموقع", "Location"))}</th>
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
                    <td>{displayRowValue(row, ["label_ar"])}</td>
                    <td>{displayRowValue(row, ["location"])}</td>
                    <td>
                      <ActiveBadge active={row.is_active !== false} />
                    </td>
                    <td>
                      <button className="icon-button" onClick={() => edit(row)} aria-label={t(tx("تعديل", "Edit"))}>
                        <Pencil size={17} />
                      </button>
                      <button
                        className="icon-button danger"
                        onClick={() => requestDelete(String(row.id), displayRowValue(row, ["label_ar", "id"]))}
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
                  <td colSpan={4}>{t(tx("لا توجد عناصر تنقل بعد.", "No navigation items yet."))}</td>
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
