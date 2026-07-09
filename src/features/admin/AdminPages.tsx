import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { displayRowValue } from "../../utils/format";
import { tx } from "../../utils/i18n";

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
          "صفحات عامة قابلة للإنشاء والتعديل، مع عناوين وميتاداتا SEO ثنائية اللغة.",
          "General-purpose pages with bilingual content and SEO metadata."
        )}
      />
      <div className="admin-panel">
        <form className="admin-form" onSubmit={save}>
          <input
            required
            placeholder={t(tx("المعرف (slug)", "Slug"))}
            value={form.slug}
            onChange={(event) => setForm({ ...form, slug: event.target.value })}
          />
          <select
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          >
            <option value="draft">{t(tx("مسودة", "Draft"))}</option>
            <option value="published">{t(tx("منشور", "Published"))}</option>
            <option value="archived">{t(tx("مؤرشف", "Archived"))}</option>
          </select>
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
            placeholder={t(tx("مقتطف بالعربية", "Arabic excerpt"))}
            value={form.excerpt_ar}
            onChange={(event) => setForm({ ...form, excerpt_ar: event.target.value })}
          />
          <input
            placeholder={t(tx("مقتطف بالإنجليزية", "English excerpt"))}
            value={form.excerpt_en}
            onChange={(event) => setForm({ ...form, excerpt_en: event.target.value })}
          />
          <textarea
            placeholder={t(tx("المحتوى بالعربية", "Arabic content"))}
            value={form.content_ar}
            onChange={(event) => setForm({ ...form, content_ar: event.target.value })}
          />
          <textarea
            placeholder={t(tx("المحتوى بالإنجليزية", "English content"))}
            value={form.content_en}
            onChange={(event) => setForm({ ...form, content_en: event.target.value })}
          />
          <input
            placeholder={t(tx("عنوان SEO بالعربية", "SEO title (Arabic)"))}
            value={form.seo_title_ar}
            onChange={(event) => setForm({ ...form, seo_title_ar: event.target.value })}
          />
          <input
            placeholder={t(tx("عنوان SEO بالإنجليزية", "SEO title (English)"))}
            value={form.seo_title_en}
            onChange={(event) => setForm({ ...form, seo_title_en: event.target.value })}
          />
          <textarea
            placeholder={t(tx("وصف SEO بالعربية", "SEO description (Arabic)"))}
            value={form.seo_description_ar}
            onChange={(event) => setForm({ ...form, seo_description_ar: event.target.value })}
          />
          <textarea
            placeholder={t(tx("وصف SEO بالإنجليزية", "SEO description (English)"))}
            value={form.seo_description_en}
            onChange={(event) => setForm({ ...form, seo_description_en: event.target.value })}
          />
          <input
            placeholder={t(tx("رابط صورة المشاركة (OG Image)", "OG image URL"))}
            value={form.og_image_url}
            onChange={(event) => setForm({ ...form, og_image_url: event.target.value })}
          />
          <input
            type="number"
            placeholder={t(tx("ترتيب العرض", "Sort order"))}
            value={form.sort_order}
            onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) || 0 })}
          />
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
