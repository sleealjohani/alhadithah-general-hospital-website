import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { displayRowValue } from "../../utils/format";
import { tx } from "../../utils/i18n";
import { AdminEditorPanel, AdminField, AdminFormActions, AdminHelpPanel } from "./AdminUX";

type PageRow = Record<string, unknown>;

const emptyForm = {
  slug: "",
  title_ar: "",
  title_en: "",
  excerpt_ar: "",
  excerpt_en: "",
  content_ar: "",
  content_en: "",
  seo_title_ar: "",
  seo_title_en: "",
  seo_description_ar: "",
  seo_description_en: "",
  og_image_url: "",
  status: "draft",
  sort_order: 100
};

export function AdminPages() {
  const { t, notify } = usePortal();
  const [rows, setRows] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadRows = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from("pages").select("*").order("sort_order", { ascending: true });
    setLoading(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    setRows((data || []) as PageRow[]);
  }, [notify]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const edit = (row: PageRow) => {
    setEditingId(String(row.id));
    setForm({
      slug: displayRowValue(row, ["slug"]),
      title_ar: displayRowValue(row, ["title_ar"]),
      title_en: displayRowValue(row, ["title_en"]),
      excerpt_ar: displayRowValue(row, ["excerpt_ar"]),
      excerpt_en: displayRowValue(row, ["excerpt_en"]),
      content_ar: displayRowValue(row, ["content_ar"]),
      content_en: displayRowValue(row, ["content_en"]),
      seo_title_ar: displayRowValue(row, ["seo_title_ar"]),
      seo_title_en: displayRowValue(row, ["seo_title_en"]),
      seo_description_ar: displayRowValue(row, ["seo_description_ar"]),
      seo_description_en: displayRowValue(row, ["seo_description_en"]),
      og_image_url: displayRowValue(row, ["og_image_url"]),
      status: displayRowValue(row, ["status"], "draft"),
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

    if (editingId) {
      const { error } = await supabase.from("pages").update(form).eq("id", editingId);
      if (error) {
        notify(error.message, "error");
        return;
      }
      notify(t(tx("تم تحديث الصفحة.", "Page updated.")), "success");
    } else {
      const { error } = await supabase.from("pages").insert(form);
      if (error) {
        notify(error.message, "error");
        return;
      }
      notify(t(tx("تم إنشاء الصفحة.", "Page created.")), "success");
    }

    cancelEdit();
    loadRows();
  };

  const remove = async (id: unknown) => {
    if (!supabase || typeof id !== "string") return;
    const { error } = await supabase.from("pages").delete().eq("id", id);
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
        title={tx("إدارة الصفحات", "Pages")}
        description={tx(
          "أنشئ صفحات عامة إضافية مثل صفحة قسم أو خدمة خاصة. الصفحة المنشورة تظهر على رابط /page-slug.",
          "Create extra public pages such as a department or special service page. Published pages appear at /page-slug."
        )}
      />

      <AdminHelpPanel
        title={tx("متى أستخدم الصفحات؟", "When to use pages")}
        description={tx(
          "استخدم هذه الشاشة للصفحات العامة الطويلة التي تحتاج محتوى مستقل وبيانات SEO، وليس للبطاقات السريعة مثل الأخبار والخدمات.",
          "Use this screen for standalone public pages with longer content and SEO metadata, not for quick cards like news or services."
        )}
        items={[
          tx("المعرف slug يصبح جزءًا من الرابط، مثل rehab لصفحة /rehab.", "The slug becomes part of the URL, such as rehab for /rehab."),
          tx("الحالة منشور تعني أن الصفحة يمكن أن تظهر للزوار مباشرة.", "Published means the page can appear to visitors immediately."),
          tx("حقول SEO تساعد مشاركة الصفحة في محركات البحث والروابط.", "SEO fields help search and link previews.")
        ]}
      />

      <AdminEditorPanel
        title={tx("إضافة صفحة", "Add page")}
        description={tx("قسّمنا الحقول حسب الاستخدام حتى لا تضيع بين المحتوى وحقول SEO.", "Fields are grouped by purpose so content and SEO do not get mixed.")}
        impact={tx(
          "الصفحة لا تظهر للعامة إلا إذا كانت حالتها منشور. استخدم المسودة أثناء التجهيز.",
          "The page stays hidden unless status is Published. Use Draft while preparing."
        )}
        editing={Boolean(editingId)}
      >
        <form className="admin-form" onSubmit={save}>
          <div className="admin-form-section">
            <h3>{t(tx("أساسيات الصفحة", "Page basics"))}</h3>
            <p>{t(tx("هذه الحقول تحدد الرابط والعنوان والحالة.", "These fields define URL, title, and status."))}</p>
          </div>
          <AdminField label={tx("المعرف slug", "Slug")} help={tx("استخدم أحرف إنجليزية وشرطات فقط. مثال: rehab-center.", "Use English letters and hyphens only. Example: rehab-center.")}>
            <input required value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
          </AdminField>
          <AdminField label={tx("حالة النشر", "Publishing status")}>
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="draft">{t(tx("مسودة", "Draft"))}</option>
              <option value="published">{t(tx("منشور", "Published"))}</option>
              <option value="archived">{t(tx("مؤرشف", "Archived"))}</option>
            </select>
          </AdminField>
          <AdminField label={tx("العنوان بالعربية", "Arabic title")}>
            <input required value={form.title_ar} onChange={(event) => setForm({ ...form, title_ar: event.target.value })} />
          </AdminField>
          <AdminField label={tx("العنوان بالإنجليزية", "English title")}>
            <input required value={form.title_en} onChange={(event) => setForm({ ...form, title_en: event.target.value })} />
          </AdminField>
          <AdminField label={tx("مقتطف بالعربية", "Arabic excerpt")} help={tx("ملخص قصير يظهر في رأس الصفحة أو نتائج البحث.", "Short summary shown in the page hero or search results.")}>
            <input value={form.excerpt_ar} onChange={(event) => setForm({ ...form, excerpt_ar: event.target.value })} />
          </AdminField>
          <AdminField label={tx("مقتطف بالإنجليزية", "English excerpt")}>
            <input value={form.excerpt_en} onChange={(event) => setForm({ ...form, excerpt_en: event.target.value })} />
          </AdminField>

          <div className="admin-form-section">
            <h3>{t(tx("محتوى الصفحة", "Page content"))}</h3>
            <p>{t(tx("اكتب النص الرئيسي للصفحة. يمكن استخدام فقرات قصيرة مفصولة بأسطر.", "Write the main page copy. Short paragraphs separated by lines work best."))}</p>
          </div>
          <AdminField wide label={tx("المحتوى بالعربية", "Arabic content")}>
            <textarea value={form.content_ar} onChange={(event) => setForm({ ...form, content_ar: event.target.value })} />
          </AdminField>
          <AdminField wide label={tx("المحتوى بالإنجليزية", "English content")}>
            <textarea value={form.content_en} onChange={(event) => setForm({ ...form, content_en: event.target.value })} />
          </AdminField>

          <div className="admin-form-section">
            <h3>{t(tx("محركات البحث والمشاركة", "SEO and sharing"))}</h3>
            <p>{t(tx("هذه الحقول اختيارية لكنها تحسن ظهور الصفحة عند المشاركة.", "These fields are optional but improve link previews and search appearance."))}</p>
          </div>
          <AdminField label={tx("عنوان SEO بالعربية", "SEO title Arabic")}>
            <input value={form.seo_title_ar} onChange={(event) => setForm({ ...form, seo_title_ar: event.target.value })} />
          </AdminField>
          <AdminField label={tx("عنوان SEO بالإنجليزية", "SEO title English")}>
            <input value={form.seo_title_en} onChange={(event) => setForm({ ...form, seo_title_en: event.target.value })} />
          </AdminField>
          <AdminField wide label={tx("وصف SEO بالعربية", "SEO description Arabic")}>
            <textarea value={form.seo_description_ar} onChange={(event) => setForm({ ...form, seo_description_ar: event.target.value })} />
          </AdminField>
          <AdminField wide label={tx("وصف SEO بالإنجليزية", "SEO description English")}>
            <textarea value={form.seo_description_en} onChange={(event) => setForm({ ...form, seo_description_en: event.target.value })} />
          </AdminField>
          <AdminField label={tx("رابط صورة المشاركة", "OG image URL")}>
            <input value={form.og_image_url} onChange={(event) => setForm({ ...form, og_image_url: event.target.value })} />
          </AdminField>
          <AdminField label={tx("ترتيب العرض", "Sort order")} help={tx("الأرقام الأقل تظهر أولًا في القوائم.", "Lower numbers appear first in lists.")}>
            <input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) || 0 })} />
          </AdminField>
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
          <h2>{t(tx("الصفحات", "Pages"))}</h2>
          {loading ? <Loader2 className="spin" /> : null}
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t(tx("المعرف", "Slug"))}</th>
                <th>{t(tx("العنوان", "Title"))}</th>
                <th>{t(tx("الحالة", "Status"))}</th>
                <th>{t(tx("إجراء", "Action"))}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.id)} className={editingId === row.id ? "is-editing" : ""}>
                  <td>{displayRowValue(row, ["slug"])}</td>
                  <td>{displayRowValue(row, ["title_ar"])}</td>
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
                  <td colSpan={4}>{t(tx("لا توجد صفحات بعد.", "No pages yet."))}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
