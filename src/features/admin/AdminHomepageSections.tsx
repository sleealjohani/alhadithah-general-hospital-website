import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { displayRowValue } from "../../utils/format";
import { tx } from "../../utils/i18n";
import { AdminEditorPanel, AdminField, AdminFormActions, AdminHelpPanel } from "./AdminUX";

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
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadRows = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from("homepage_sections").select("*").order("sort_order", { ascending: true });
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

    let content: unknown;
    try {
      content = JSON.parse(form.contentText || "{}");
    } catch {
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

    if (editingId) {
      const { error } = await supabase.from("homepage_sections").update(payload).eq("id", editingId);
      if (error) {
        notify(error.message, "error");
        return;
      }
      notify(t(tx("تم تحديث القسم.", "Section updated.")), "success");
    } else {
      const { error } = await supabase.from("homepage_sections").insert(payload);
      if (error) {
        notify(error.message, "error");
        return;
      }
      notify(t(tx("تم إنشاء القسم.", "Section created.")), "success");
    }

    cancelEdit();
    loadRows();
  };

  const remove = async (id: unknown) => {
    if (!supabase || typeof id !== "string") return;
    const { error } = await supabase.from("homepage_sections").delete().eq("id", id);
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
        title={tx("أقسام الصفحة الرئيسية", "Homepage Sections")}
        description={tx(
          "تحكم في ظهور وترتيب أقسام الصفحة الرئيسية. الإيقاف يخفي القسم، والترتيب يحدد مكانه.",
          "Control homepage section visibility and order. Disabling hides the section; sort order controls its position."
        )}
      />

      <AdminHelpPanel
        title={tx("مفاتيح الأقسام", "Section keys")}
        description={tx(
          "مفتاح القسم يربط بيانات قاعدة البيانات بمكان محدد في الصفحة الرئيسية. لا تغير المفتاح لسجل موجود إلا إذا كنت تعرف أثره.",
          "The section key connects database content to a specific homepage area. Do not change an existing key unless you know the impact."
        )}
        items={[
          tx("hero: منطقة البداية الرئيسية.", "hero: main hero area."),
          tx("quick_access: بطاقات الوصول السريع.", "quick_access: quick access cards."),
          tx("إذا كان القسم غير مدعوم في الواجهة، لن يظهر حتى لو كان مفعّلًا.", "If a key is not supported by the frontend, it will not render even if active.")
        ]}
      />

      <AdminEditorPanel
        title={tx("إضافة أو تعديل قسم", "Add or edit section")}
        description={tx("استخدمه لتغيير عناوين الأقسام أو ترتيبها بدون تعديل الكود.", "Use this to change section titles or order without code changes.")}
        impact={tx("التغيير ينعكس على الصفحة الرئيسية بعد الحفظ إذا كان القسم مفعّلًا.", "Changes appear on the homepage after saving when the section is active.")}
        editing={Boolean(editingId)}
      >
        <form className="admin-form" onSubmit={save}>
          <AdminField label={tx("مفتاح القسم", "Section key")} help={tx("مثال: hero أو quick_access. المفتاح لا يتغير أثناء التعديل.", "Example: hero or quick_access. The key is locked while editing.")}>
            <input required disabled={Boolean(editingId)} value={form.section_key} onChange={(event) => setForm({ ...form, section_key: event.target.value })} />
          </AdminField>
          <AdminField label={tx("ترتيب العرض", "Sort order")} help={tx("الأرقام الأقل تظهر أعلى الصفحة.", "Lower numbers appear earlier on the page.")}>
            <input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) || 0 })} />
          </AdminField>
          <AdminField label={tx("العنوان بالعربية", "Arabic title")}>
            <input value={form.title_ar} onChange={(event) => setForm({ ...form, title_ar: event.target.value })} />
          </AdminField>
          <AdminField label={tx("العنوان بالإنجليزية", "English title")}>
            <input value={form.title_en} onChange={(event) => setForm({ ...form, title_en: event.target.value })} />
          </AdminField>
          <AdminField label={tx("العنوان الفرعي بالعربية", "Arabic subtitle")}>
            <input value={form.subtitle_ar} onChange={(event) => setForm({ ...form, subtitle_ar: event.target.value })} />
          </AdminField>
          <AdminField label={tx("العنوان الفرعي بالإنجليزية", "English subtitle")}>
            <input value={form.subtitle_en} onChange={(event) => setForm({ ...form, subtitle_en: event.target.value })} />
          </AdminField>
          <AdminField
            wide
            label={tx("بيانات إضافية JSON", "Extra JSON data")}
            help={tx("اتركها {} إذا لم تعرف المطلوب. يجب أن تكون JSON صحيحة.", "Leave as {} if unsure. Must be valid JSON.")}
          >
            <textarea className="code-field" value={form.contentText} onChange={(event) => setForm({ ...form, contentText: event.target.value })} />
          </AdminField>
          <label className="check-field admin-field">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
            {t(tx("قسم مفعّل", "Active section"))}
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
          <h2>{t(tx("الأقسام", "Sections"))}</h2>
          {loading ? <Loader2 className="spin" /> : null}
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t(tx("المفتاح", "Key"))}</th>
                <th>{t(tx("العنوان", "Title"))}</th>
                <th>{t(tx("مفعّل", "Active"))}</th>
                <th>{t(tx("إجراء", "Action"))}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.id)} className={editingId === row.id ? "is-editing" : ""}>
                  <td>{displayRowValue(row, ["section_key"])}</td>
                  <td>{displayRowValue(row, ["title_ar"], "-")}</td>
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
                  <td colSpan={4}>{t(tx("لا توجد أقسام بعد.", "No sections yet."))}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
