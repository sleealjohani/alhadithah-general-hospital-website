import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, Pencil, Save, Trash2, UploadCloud, X } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { displayRowValue } from "../../utils/format";
import { tx } from "../../utils/i18n";
import { AdminEditorPanel, AdminField, AdminFormActions, AdminHelpPanel } from "./AdminUX";

type FileAssetRow = Record<string, unknown>;

const buckets = [
  { id: "public-assets", label: tx("عام - صور وملفات للموقع", "Public assets") },
  { id: "hospital-documents", label: tx("مستندات المستشفى - خاص", "Hospital documents - private") }
];

const emptyForm = {
  title_ar: "",
  title_en: "",
  bucket: "public-assets",
  visibility: "public",
  status: "draft"
};

export function AdminMedia() {
  const { t, notify } = usePortal();
  const [rows, setRows] = useState<FileAssetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadRows = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from("file_assets").select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    setRows((data || []) as FileAssetRow[]);
  }, [notify]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const edit = (row: FileAssetRow) => {
    setEditingId(String(row.id));
    setForm({
      title_ar: displayRowValue(row, ["title_ar"]),
      title_en: displayRowValue(row, ["title_en"]),
      bucket: displayRowValue(row, ["bucket"], "public-assets"),
      visibility: displayRowValue(row, ["visibility"], "public"),
      status: displayRowValue(row, ["status"], "draft")
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveMetadata = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !editingId) return;
    const { error } = await supabase
      .from("file_assets")
      .update({
        title_ar: form.title_ar,
        title_en: form.title_en,
        visibility: form.visibility,
        status: form.status
      })
      .eq("id", editingId);
    if (error) {
      notify(error.message, "error");
      return;
    }
    notify(t(tx("تم تحديث بيانات الملف.", "File metadata updated.")), "success");
    cancelEdit();
    loadRows();
  };

  const upload = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      notify(t(tx("Supabase غير متصل.", "Supabase is not connected.")), "error");
      return;
    }
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      notify(t(tx("اختر ملفًا للرفع.", "Choose a file to upload.")), "error");
      return;
    }

    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const objectPath = `${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage.from(form.bucket).upload(objectPath, file);
    if (uploadError) {
      setUploading(false);
      notify(uploadError.message, "error");
      return;
    }

    const { error: insertError } = await supabase.from("file_assets").insert({
      title_ar: form.title_ar,
      title_en: form.title_en,
      bucket: form.bucket,
      object_path: objectPath,
      file_type: file.type || null,
      visibility: form.visibility,
      status: form.status
    });
    setUploading(false);

    if (insertError) {
      notify(insertError.message, "error");
      return;
    }

    notify(t(tx("تم رفع الملف وحفظه.", "File uploaded and saved.")), "success");
    setForm(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
    loadRows();
  };

  const remove = async (row: FileAssetRow) => {
    if (!supabase || typeof row.id !== "string") return;
    const bucket = displayRowValue(row, ["bucket"]);
    const objectPath = displayRowValue(row, ["object_path"]);

    const { error } = await supabase.from("file_assets").delete().eq("id", row.id);
    if (error) {
      notify(error.message, "error");
      return;
    }

    if (bucket && objectPath) {
      const { error: storageError } = await supabase.storage.from(bucket).remove([objectPath]);
      if (storageError) {
        notify(t(tx("تم حذف السجل، لكن تعذر تنظيف ملف التخزين.", "Record deleted, but storage cleanup failed.")), "error");
      }
    }

    if (editingId === row.id) cancelEdit();
    notify(t(tx("تم حذف الملف.", "File deleted.")), "success");
    loadRows();
  };

  const openFile = async (row: FileAssetRow) => {
    if (!supabase) return;
    const bucket = displayRowValue(row, ["bucket"]);
    const objectPath = displayRowValue(row, ["object_path"]);
    if (!bucket || !objectPath) return;

    if (bucket === "public-assets") {
      const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
      window.open(data.publicUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 3600);
    if (error || !data) {
      notify(error?.message || t(tx("تعذر فتح الملف.", "Could not open the file.")), "error");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="admin-page">
      <SectionHeading
        title={tx("مكتبة الوسائط", "Media Library")}
        description={tx(
          "ارفع الصور والملفات المعتمدة، ثم استخدم روابطها في الصفحات أو الأخبار أو الأطباء.",
          "Upload approved images and files, then use their links in pages, news, or doctor profiles."
        )}
      />

      <AdminHelpPanel
        title={tx("عام أم خاص؟", "Public or private")}
        description={tx(
          "الملفات العامة يمكن استخدامها في الموقع العام. المستندات الخاصة مناسبة للملفات الداخلية ولا تفتح إلا برابط مؤقت.",
          "Public files can be used on the public site. Private documents are for internal files and open with temporary signed URLs."
        )}
        items={[
          tx("لا ترفع صور مرضى أو بيانات شخصية.", "Do not upload patient photos or personal data."),
          tx("اجعل الحالة منشور فقط بعد اعتماد الملف.", "Use Published only after the file is approved."),
          tx("انسخ رابط الملف العام من زر الفتح عند الحاجة لاستخدامه في صفحة أخرى.", "Open a public file when you need its URL for another page.")
        ]}
      />

      <AdminEditorPanel
        title={tx("رفع ملف", "Upload file")}
        description={tx("عند تعديل ملف موجود يمكنك تغيير العنوان والحالة فقط، وليس الملف نفسه.", "When editing an existing file, you can change metadata only, not replace the file.")}
        impact={tx("الملف المنشور والعام يمكن استخدامه في صفحات الموقع.", "Published public files can be used across the site.")}
        editing={Boolean(editingId)}
      >
        <form className="admin-form" onSubmit={editingId ? saveMetadata : upload}>
          <AdminField label={tx("العنوان بالعربية", "Arabic title")}>
            <input required value={form.title_ar} onChange={(event) => setForm({ ...form, title_ar: event.target.value })} />
          </AdminField>
          <AdminField label={tx("العنوان بالإنجليزية", "English title")}>
            <input required value={form.title_en} onChange={(event) => setForm({ ...form, title_en: event.target.value })} />
          </AdminField>
          <AdminField label={tx("مساحة التخزين", "Storage bucket")} help={tx("لا يمكن تغييرها بعد رفع الملف.", "Cannot be changed after upload.")}>
            <select value={form.bucket} disabled={Boolean(editingId)} onChange={(event) => setForm({ ...form, bucket: event.target.value })}>
              {buckets.map((bucket) => (
                <option key={bucket.id} value={bucket.id}>
                  {t(bucket.label)}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label={tx("الظهور", "Visibility")}>
            <select value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value })}>
              <option value="public">{t(tx("عام", "Public"))}</option>
              <option value="employees">{t(tx("الموظفون", "Employees"))}</option>
              <option value="admin">{t(tx("الإدارة فقط", "Admin only"))}</option>
            </select>
          </AdminField>
          <AdminField label={tx("الحالة", "Status")}>
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="draft">{t(tx("مسودة", "Draft"))}</option>
              <option value="published">{t(tx("منشور", "Published"))}</option>
              <option value="archived">{t(tx("مؤرشف", "Archived"))}</option>
            </select>
          </AdminField>
          {editingId ? null : (
            <AdminField label={tx("الملف", "File")} help={tx("اختر ملفًا معتمدًا فقط.", "Choose an approved file only.")}>
              <input ref={fileInputRef} type="file" />
            </AdminField>
          )}
          <AdminFormActions>
            <button className="btn btn-primary" disabled={uploading}>
              {uploading ? <Loader2 className="spin" size={18} /> : editingId ? <Save size={18} /> : <UploadCloud size={18} />}
              {editingId ? t(tx("تحديث البيانات", "Update metadata")) : t(tx("رفع الملف", "Upload file"))}
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
          <h2>{t(tx("الملفات", "Files"))}</h2>
          {loading ? <Loader2 className="spin" /> : null}
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t(tx("العنوان", "Title"))}</th>
                <th>{t(tx("المساحة", "Bucket"))}</th>
                <th>{t(tx("الظهور", "Visibility"))}</th>
                <th>{t(tx("الحالة", "Status"))}</th>
                <th>{t(tx("إجراء", "Action"))}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.id)} className={editingId === row.id ? "is-editing" : ""}>
                  <td>{displayRowValue(row, ["title_ar"])}</td>
                  <td>{displayRowValue(row, ["bucket"])}</td>
                  <td>{displayRowValue(row, ["visibility"])}</td>
                  <td>{displayRowValue(row, ["status"], "-")}</td>
                  <td>
                    <button className="icon-button" onClick={() => openFile(row)} aria-label={t(tx("فتح", "Open"))}>
                      <Download size={17} />
                    </button>
                    <button className="icon-button" onClick={() => edit(row)} aria-label={t(tx("تعديل", "Edit"))}>
                      <Pencil size={17} />
                    </button>
                    <button className="icon-button danger" onClick={() => remove(row)} aria-label={t(tx("حذف", "Delete"))}>
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>{t(tx("لا توجد ملفات بعد.", "No files yet."))}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
