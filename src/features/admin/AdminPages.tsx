import { type FormEvent, useCallback, useEffect, useState } from "react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { logAdminAction } from "../../lib/audit";
import { displayRowValue } from "../../utils/format";
import { tx } from "../../utils/i18n";
import { CrudFormActions, Field, StatusBadge, TableLoadingRows, useDeleteConfirm } from "./shared";

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
      const { error } = await supabase.from("pages").update(form).eq("id", editingId);
      setSaving(false);
      if (error) {
        notify(error.message, "error");
        return;
      }
      logAdminAction("page.update", "pages", editingId, { slug: form.slug });
      notify(t(tx("تم تحديث الصفحة.", "Page updated.")), "success");
    } else {
      const { error } = await supabase.from("pages").insert(form);
      setSaving(false);
      if (error) {
        notify(error.message, "error");
        return;
      }
      logAdminAction("page.create", "pages", null, { slug: form.slug });
      notify(t(tx("تم إنشاء الصفحة.", "Page created.")), "success");
    }
    cancelEdit();
    loadRows();
  };

  const { dialog: deleteDialog, requestDelete } = useDeleteConfirm(async (id) => {
    if (!supabase) return;
    const { error } = await supabase.from("pages").delete().eq("id", id);
    if (error) {
      notify(error.message, "error");
      return;
    }
    if (editingId === id) cancelEdit();
    logAdminAction("page.delete", "pages", id);
    notify(t(tx("تم الحذف.", "Deleted.")), "success");
    loadRows();
  });

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
          <Field label={tx("المعرف في الرابط (slug)", "Slug")}>
            <input
              required
              dir="ltr"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="patient-guide"
            />
          </Field>
          <Field label={tx("الحالة", "Status")}>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">{t(tx("مسودة", "Draft"))}</option>
              <option value="published">{t(tx("منشور", "Published"))}</option>
              <option value="archived">{t(tx("مؤرشف", "Archived"))}</option>
            </select>
          </Field>
          <Field label={tx("العنوان بالعربية", "Arabic title")}>
            <input required value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} />
          </Field>
          <Field label={tx("العنوان بالإنجليزية", "English title")}>
            <input required dir="ltr" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
          </Field>
          <Field label={tx("مقتطف بالعربية", "Arabic excerpt")}>
            <input value={form.excerpt_ar} onChange={(e) => setForm({ ...form, excerpt_ar: e.target.value })} />
          </Field>
          <Field label={tx("مقتطف بالإنجليزية", "English excerpt")}>
            <input dir="ltr" value={form.excerpt_en} onChange={(e) => setForm({ ...form, excerpt_en: e.target.value })} />
          </Field>
          <Field label={tx("المحتوى بالعربية", "Arabic content")} wide>
            <textarea value={form.content_ar} onChange={(e) => setForm({ ...form, content_ar: e.target.value })} />
          </Field>
          <Field label={tx("المحتوى بالإنجليزية", "English content")} wide>
            <textarea dir="ltr" value={form.content_en} onChange={(e) => setForm({ ...form, content_en: e.target.value })} />
          </Field>
          <Field label={tx("عنوان SEO بالعربية", "SEO title (Arabic)")}>
            <input value={form.seo_title_ar} onChange={(e) => setForm({ ...form, seo_title_ar: e.target.value })} />
          </Field>
          <Field label={tx("عنوان SEO بالإنجليزية", "SEO title (English)")}>
            <input dir="ltr" value={form.seo_title_en} onChange={(e) => setForm({ ...form, seo_title_en: e.target.value })} />
          </Field>
          <Field label={tx("وصف SEO بالعربية", "SEO description (Arabic)")} wide>
            <textarea value={form.seo_description_ar} onChange={(e) => setForm({ ...form, seo_description_ar: e.target.value })} />
          </Field>
          <Field label={tx("وصف SEO بالإنجليزية", "SEO description (English)")} wide>
            <textarea dir="ltr" value={form.seo_description_en} onChange={(e) => setForm({ ...form, seo_description_en: e.target.value })} />
          </Field>
          <Field label={tx("رابط صورة المشاركة (OG Image)", "OG image URL")}>
            <input dir="ltr" value={form.og_image_url} onChange={(e) => setForm({ ...form, og_image_url: e.target.value })} />
          </Field>
          <Field label={tx("ترتيب العرض", "Sort order")}>
            <input
              type="number"
              inputMode="numeric"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
            />
          </Field>
          <CrudFormActions busy={saving} editing={Boolean(editingId)} onCancel={cancelEdit} />
        </form>
      </div>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <h2>{t(tx("الصفحات", "Pages"))}</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table" aria-busy={loading}>
            <thead>
              <tr>
                <th>{t(tx("المعرف", "Slug"))}</th>
                <th>{t(tx("العنوان", "Title"))}</th>
                <th>{t(tx("الحالة", "Status"))}</th>
                <th>{t(tx("إجراء", "Action"))}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoadingRows cols={4} />
              ) : (
                rows.map((row) => (
                  <tr key={String(row.id)} className={editingId === row.id ? "is-editing" : ""}>
                    <td dir="ltr">{displayRowValue(row, ["slug"])}</td>
                    <td>{displayRowValue(row, ["title_ar"])}</td>
                    <td>
                      <StatusBadge value={displayRowValue(row, ["status"], "-")} />
                    </td>
                    <td>
                      {displayRowValue(row, ["status"]) === "published" ? (
                        <Link
                          className="icon-button"
                          to={`/pages/${displayRowValue(row, ["slug"])}`}
                          target="_blank"
                          aria-label={t(tx("عرض الصفحة", "View page"))}
                        >
                          <ExternalLink size={17} />
                        </Link>
                      ) : null}
                      <button className="icon-button" onClick={() => edit(row)} aria-label={t(tx("تعديل", "Edit"))}>
                        <Pencil size={17} />
                      </button>
                      <button
                        className="icon-button danger"
                        onClick={() => requestDelete(String(row.id), displayRowValue(row, ["slug", "id"]))}
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
                  <td colSpan={4}>{t(tx("لا توجد صفحات بعد.", "No pages yet."))}</td>
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
