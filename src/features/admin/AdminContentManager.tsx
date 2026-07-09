import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Save, Trash2 } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { contentTables } from "../../data/content";
import { displayRowValue } from "../../utils/format";
import { tx } from "../../utils/i18n";

export function AdminContentManager() {
  const { t, notify } = usePortal();
  const [table, setTable] = useState(contentTables[0].table);
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    category_ar: "",
    category_en: "",
    icon: "FileText",
    status: "draft"
  });

  const loadRows = useCallback(async () => {
    if (!supabase) return;
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
    loadRows();
  }, [loadRows]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      notify(t(tx("Supabase غير متصل.", "Supabase is not connected.")), "error");
      return;
    }
    const { error } = await supabase.from(table).insert({
      ...form,
      sort_order: 100,
      visibility: "public"
    });
    if (error) {
      notify(error.message, "error");
      return;
    }
    notify(t(tx("تم حفظ المحتوى.", "Content saved.")), "success");
    setForm((current) => ({ ...current, title_ar: "", title_en: "", description_ar: "", description_en: "" }));
    loadRows();
  };

  const remove = async (id: unknown) => {
    if (!supabase || typeof id !== "string") return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) notify(error.message, "error");
    else {
      notify(t(tx("تم الحذف.", "Deleted.")), "success");
      loadRows();
    }
  };

  return (
    <div className="admin-page">
      <SectionHeading
        title={tx("إدارة المحتوى", "Content Management")}
        description={tx(
          "إضافة محتوى ثنائي اللغة للجداول الأساسية. النشر للعامة يتم عند status = published.",
          "Add bilingual content to core tables. Public display requires status = published."
        )}
      />
      <div className="admin-panel">
        <div className="admin-toolbar">
          <select value={table} onChange={(event) => setTable(event.target.value)}>
            {contentTables.map((item) => (
              <option key={item.table} value={item.table}>
                {t(item.label)}
              </option>
            ))}
          </select>
        </div>
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
          <textarea
            required
            placeholder={t(tx("الوصف بالعربية", "Arabic description"))}
            value={form.description_ar}
            onChange={(event) => setForm({ ...form, description_ar: event.target.value })}
          />
          <textarea
            required
            placeholder={t(tx("الوصف بالإنجليزية", "English description"))}
            value={form.description_en}
            onChange={(event) => setForm({ ...form, description_en: event.target.value })}
          />
          <input
            placeholder={t(tx("التصنيف بالعربية", "Arabic category"))}
            value={form.category_ar}
            onChange={(event) => setForm({ ...form, category_ar: event.target.value })}
          />
          <input
            placeholder={t(tx("التصنيف بالإنجليزية", "English category"))}
            value={form.category_en}
            onChange={(event) => setForm({ ...form, category_en: event.target.value })}
          />
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="draft">{t(tx("مسودة", "Draft"))}</option>
            <option value="published">{t(tx("منشور", "Published"))}</option>
          </select>
          <button className="btn btn-primary">
            <Save size={18} />
            {t(tx("حفظ", "Save"))}
          </button>
        </form>
      </div>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <h2>{t(tx("السجلات", "Records"))}</h2>
          {loading ? <Loader2 className="spin" /> : null}
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t(tx("العنوان", "Title"))}</th>
                <th>{t(tx("الحالة", "Status"))}</th>
                <th>{t(tx("إجراء", "Action"))}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.id)}>
                  <td>{displayRowValue(row, ["title_ar", "subject", "id"])}</td>
                  <td>{displayRowValue(row, ["status"], "-")}</td>
                  <td>
                    <button className="icon-button danger" onClick={() => remove(row.id)}>
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3}>{t(tx("لا توجد سجلات أو لم يتم إعداد Supabase بعد.", "No records or Supabase is not set up yet."))}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
