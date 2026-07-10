import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { contentTables } from "../../data/content";
import { displayRowValue } from "../../utils/format";
import { tx } from "../../utils/i18n";
import { AdminEditorPanel, AdminField, AdminFormActions, AdminHelpPanel } from "./AdminUX";

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
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const currentTable = contentTables.find((item) => item.table === table) ?? contentTables[0];

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

    if (editingId) {
      const { error } = await supabase.from(table).update(form).eq("id", editingId);
      if (error) {
        notify(error.message, "error");
        return;
      }
      notify(t(tx("تم تحديث المحتوى.", "Content updated.")), "success");
    } else {
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
    }

    setEditingId(null);
    setForm(emptyForm);
    loadRows();
  };

  const remove = async (id: unknown) => {
    if (!supabase || typeof id !== "string") return;
    const { error } = await supabase.from(table).delete().eq("id", id);
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
        title={tx("إدارة المحتوى", "Content Management")}
        description={tx(
          "أضف الخدمات والأقسام والأخبار ومحتوى المعرفة من مكان واحد. المحتوى المنشور فقط ينعكس في الموقع العام.",
          "Add services, departments, news, and knowledge content from one place. Only published content appears publicly."
        )}
      />

      <AdminHelpPanel
        title={tx("أين يظهر هذا المحتوى؟", "Where this content appears")}
        description={tx(
          "اختر نوع المحتوى أولًا. عند جعل الحالة منشور سيظهر السجل في صفحته العامة المناسبة مثل الخدمات أو الأقسام أو الأخبار أو مركز المعرفة.",
          "Choose the content type first. Published records appear on the matching public page such as Services, Departments, News, or Knowledge."
        )}
        items={[
          tx("الخدمات تظهر في صفحة الخدمات وبحث الموقع.", "Services appear on the Services page and site search."),
          tx("الأخبار تظهر في صفحة الأخبار، ولا تظهر للعامة وهي مسودة.", "News appears on the News page and stays hidden while draft."),
          tx("التصنيف يساعد الزائر على الفلترة والتنظيم داخل الصفحة.", "Category helps visitors filter and scan the public page.")
        ]}
      />

      <AdminEditorPanel
        title={tx("إضافة محتوى جديد", "Add new content")}
        description={tx("افتح هذا القسم عند الحاجة للإضافة أو التعديل فقط.", "Open this section only when adding or editing.")}
        impact={tx(
          "الحقول العربية تظهر افتراضيًا في الموقع، والإنجليزية تظهر عند تبديل لغة الموقع.",
          "Arabic fields show by default; English fields show after switching site language."
        )}
        editing={Boolean(editingId)}
      >
        <div className="admin-toolbar">
          <h2>{t(tx("نوع المحتوى", "Content type"))}</h2>
          <select value={table} onChange={(event) => setTable(event.target.value)}>
            {contentTables.map((item) => (
              <option key={item.table} value={item.table}>
                {t(item.label)}
              </option>
            ))}
          </select>
        </div>

        <form className="admin-form" onSubmit={save}>
          <AdminField
            label={tx("العنوان بالعربية", "Arabic title")}
            help={tx("يظهر كعنوان البطاقة أو الخبر في صفحة الموقع.", "Shown as the public card or article title.")}
          >
            <input required value={form.title_ar} onChange={(event) => setForm({ ...form, title_ar: event.target.value })} />
          </AdminField>
          <AdminField label={tx("العنوان بالإنجليزية", "English title")}>
            <input required value={form.title_en} onChange={(event) => setForm({ ...form, title_en: event.target.value })} />
          </AdminField>
          <AdminField
            wide
            label={tx("الوصف بالعربية", "Arabic description")}
            help={tx("اكتب وصفًا مختصرًا وواضحًا؛ سيظهر في البطاقة العامة.", "Write a short clear description; it appears on the public card.")}
          >
            <textarea required value={form.description_ar} onChange={(event) => setForm({ ...form, description_ar: event.target.value })} />
          </AdminField>
          <AdminField wide label={tx("الوصف بالإنجليزية", "English description")}>
            <textarea required value={form.description_en} onChange={(event) => setForm({ ...form, description_en: event.target.value })} />
          </AdminField>
          <AdminField label={tx("التصنيف بالعربية", "Arabic category")} help={tx("مثال: خدمات عاجلة، عيادات، سياسات.", "Example: urgent care, clinics, policies.")}>
            <input value={form.category_ar} onChange={(event) => setForm({ ...form, category_ar: event.target.value })} />
          </AdminField>
          <AdminField label={tx("التصنيف بالإنجليزية", "English category")}>
            <input value={form.category_en} onChange={(event) => setForm({ ...form, category_en: event.target.value })} />
          </AdminField>
          <AdminField
            label={tx("حالة النشر", "Publishing status")}
            help={tx("المسودة لا تظهر للعامة. المنشور يظهر مباشرة في الموقع.", "Draft stays hidden. Published appears immediately on the site.")}
          >
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="draft">{t(tx("مسودة", "Draft"))}</option>
              <option value="published">{t(tx("منشور", "Published"))}</option>
            </select>
          </AdminField>
          <AdminFormActions>
            <button className="btn btn-primary">
              <Save size={18} />
              {editingId ? t(tx("تحديث", "Update")) : t(tx("حفظ", "Save"))}
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
          <h2>
            {t(tx("السجلات", "Records"))} - {t(currentTable.label)}
          </h2>
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
                <tr key={String(row.id)} className={editingId === row.id ? "is-editing" : ""}>
                  <td>{displayRowValue(row, ["title_ar", "subject", "id"])}</td>
                  <td>{displayRowValue(row, ["status"], "-")}</td>
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
                  <td colSpan={3}>
                    {t(tx("لا توجد سجلات بعد. افتح قسم الإضافة أعلاه لإنشاء أول سجل.", "No records yet. Open the editor above to create the first record."))}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
