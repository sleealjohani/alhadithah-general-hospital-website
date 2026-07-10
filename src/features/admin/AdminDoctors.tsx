import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { displayRowValue } from "../../utils/format";
import { tx } from "../../utils/i18n";
import { AdminEditorPanel, AdminField, AdminFormActions, AdminHelpPanel } from "./AdminUX";

type DoctorRow = Record<string, unknown>;
type DepartmentOption = { id: string; title_ar: string };

const emptyForm = {
  slug: "",
  full_name_ar: "",
  full_name_en: "",
  title_ar: "",
  title_en: "",
  specialty_ar: "",
  specialty_en: "",
  department_id: "",
  bio_ar: "",
  bio_en: "",
  photo_url: "",
  status: "draft",
  sort_order: 100
};

export function AdminDoctors() {
  const { t, notify } = usePortal();
  const [rows, setRows] = useState<DoctorRow[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadRows = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const [{ data, error }, { data: deptData }] = await Promise.all([
      supabase.from("doctors").select("*").order("sort_order", { ascending: true }),
      supabase.from("departments").select("id,title_ar").order("sort_order", { ascending: true })
    ]);
    setLoading(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    setRows((data || []) as DoctorRow[]);
    setDepartments((deptData || []) as DepartmentOption[]);
  }, [notify]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const edit = (row: DoctorRow) => {
    setEditingId(String(row.id));
    setForm({
      slug: displayRowValue(row, ["slug"]),
      full_name_ar: displayRowValue(row, ["full_name_ar"]),
      full_name_en: displayRowValue(row, ["full_name_en"]),
      title_ar: displayRowValue(row, ["title_ar"]),
      title_en: displayRowValue(row, ["title_en"]),
      specialty_ar: displayRowValue(row, ["specialty_ar"]),
      specialty_en: displayRowValue(row, ["specialty_en"]),
      department_id: displayRowValue(row, ["department_id"]),
      bio_ar: displayRowValue(row, ["bio_ar"]),
      bio_en: displayRowValue(row, ["bio_en"]),
      photo_url: displayRowValue(row, ["photo_url"]),
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

    const payload = { ...form, department_id: form.department_id || null };

    if (editingId) {
      const { error } = await supabase.from("doctors").update(payload).eq("id", editingId);
      if (error) {
        notify(error.message, "error");
        return;
      }
      notify(t(tx("تم تحديث بيانات الطبيب.", "Doctor updated.")), "success");
    } else {
      const { error } = await supabase.from("doctors").insert(payload);
      if (error) {
        notify(error.message, "error");
        return;
      }
      notify(t(tx("تمت إضافة الطبيب.", "Doctor added.")), "success");
    }

    cancelEdit();
    loadRows();
  };

  const remove = async (id: unknown) => {
    if (!supabase || typeof id !== "string") return;
    const { error } = await supabase.from("doctors").delete().eq("id", id);
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
        title={tx("إدارة الأطباء", "Doctors")}
        description={tx(
          "ملفات الأطباء والاستشاريين المرتبطة بالأقسام. لا تظهر للعامة إلا عند النشر.",
          "Doctor and consultant profiles linked to departments. They appear publicly only when published."
        )}
      />

      <AdminHelpPanel
        title={tx("كيف يظهر الطبيب في الموقع؟", "How doctors appear")}
        description={tx(
          "عند نشر الطبيب وربطه بقسم، يمكن استخدام بياناته في دليل الأطباء والصفحات العامة المرتبطة بالأقسام.",
          "When published and linked to a department, the doctor can appear in doctor directories and related public department views."
        )}
        items={[
          tx("استخدم المسودة إلى أن تكتمل بيانات الطبيب.", "Use Draft until the profile is complete."),
          tx("رابط الصورة اختياري، ويمكن لاحقًا استخدام مكتبة الوسائط لنسخ رابط صورة معتمد.", "Photo URL is optional; the media library can later provide approved image URLs."),
          tx("التخصص والمسمى يساعدان الزائر على البحث والفرز.", "Specialty and title help visitors scan and filter.")
        ]}
      />

      <AdminEditorPanel
        title={tx("إضافة طبيب", "Add doctor")}
        description={tx("أدخل البيانات الأساسية أولًا، ثم أضف النبذة والصورة إذا كانت معتمدة.", "Enter core details first, then add bio and photo when approved.")}
        impact={tx("لن يظهر الطبيب في الموقع العام إلا عند اختيار منشور.", "The doctor will not appear publicly unless status is Published.")}
        editing={Boolean(editingId)}
      >
        <form className="admin-form" onSubmit={save}>
          <AdminField label={tx("المعرف slug", "Slug")} help={tx("مثال: ahmed-alharbi. يستخدم للروابط والبحث.", "Example: ahmed-alharbi. Used for links and search.")}>
            <input required value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
          </AdminField>
          <AdminField label={tx("حالة النشر", "Publishing status")}>
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="draft">{t(tx("مسودة", "Draft"))}</option>
              <option value="published">{t(tx("منشور", "Published"))}</option>
              <option value="archived">{t(tx("مؤرشف", "Archived"))}</option>
            </select>
          </AdminField>
          <AdminField label={tx("الاسم بالعربية", "Arabic full name")}>
            <input required value={form.full_name_ar} onChange={(event) => setForm({ ...form, full_name_ar: event.target.value })} />
          </AdminField>
          <AdminField label={tx("الاسم بالإنجليزية", "English full name")}>
            <input required value={form.full_name_en} onChange={(event) => setForm({ ...form, full_name_en: event.target.value })} />
          </AdminField>
          <AdminField label={tx("المسمى الوظيفي بالعربية", "Arabic job title")}>
            <input value={form.title_ar} onChange={(event) => setForm({ ...form, title_ar: event.target.value })} />
          </AdminField>
          <AdminField label={tx("المسمى الوظيفي بالإنجليزية", "English job title")}>
            <input value={form.title_en} onChange={(event) => setForm({ ...form, title_en: event.target.value })} />
          </AdminField>
          <AdminField label={tx("التخصص بالعربية", "Arabic specialty")}>
            <input value={form.specialty_ar} onChange={(event) => setForm({ ...form, specialty_ar: event.target.value })} />
          </AdminField>
          <AdminField label={tx("التخصص بالإنجليزية", "English specialty")}>
            <input value={form.specialty_en} onChange={(event) => setForm({ ...form, specialty_en: event.target.value })} />
          </AdminField>
          <AdminField label={tx("القسم", "Department")} help={tx("اربط الطبيب بقسم منشور إن وجد.", "Link the doctor to a published department when available.")}>
            <select value={form.department_id} onChange={(event) => setForm({ ...form, department_id: event.target.value })}>
              <option value="">{t(tx("بدون قسم", "No department"))}</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.title_ar}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label={tx("رابط الصورة", "Photo URL")} help={tx("استخدم صورة رسمية معتمدة فقط.", "Use only an approved official image.")}>
            <input value={form.photo_url} onChange={(event) => setForm({ ...form, photo_url: event.target.value })} />
          </AdminField>
          <AdminField wide label={tx("نبذة بالعربية", "Arabic bio")}>
            <textarea value={form.bio_ar} onChange={(event) => setForm({ ...form, bio_ar: event.target.value })} />
          </AdminField>
          <AdminField wide label={tx("نبذة بالإنجليزية", "English bio")}>
            <textarea value={form.bio_en} onChange={(event) => setForm({ ...form, bio_en: event.target.value })} />
          </AdminField>
          <AdminField label={tx("ترتيب العرض", "Sort order")}>
            <input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) || 0 })} />
          </AdminField>
          <AdminFormActions>
            <button className="btn btn-primary">
              <Save size={18} />
              {editingId ? t(tx("تحديث", "Update")) : t(tx("إضافة", "Add"))}
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
          <h2>{t(tx("الأطباء", "Doctors"))}</h2>
          {loading ? <Loader2 className="spin" /> : null}
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t(tx("الاسم", "Name"))}</th>
                <th>{t(tx("التخصص", "Specialty"))}</th>
                <th>{t(tx("الحالة", "Status"))}</th>
                <th>{t(tx("إجراء", "Action"))}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.id)} className={editingId === row.id ? "is-editing" : ""}>
                  <td>{displayRowValue(row, ["full_name_ar"])}</td>
                  <td>{displayRowValue(row, ["specialty_ar"], "-")}</td>
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
                  <td colSpan={4}>{t(tx("لا يوجد أطباء بعد.", "No doctors yet."))}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
