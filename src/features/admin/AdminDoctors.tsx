import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { displayRowValue } from "../../utils/format";
import { tx } from "../../utils/i18n";

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
      notify(t(tx("تم إضافة الطبيب.", "Doctor added.")), "success");
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
          "ملفات الأطباء والاستشاريين، مرتبطة بالأقسام، وتظهر للعامة عند النشر فقط.",
          "Doctor and consultant profiles, linked to departments, shown publicly only when published."
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
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="draft">{t(tx("مسودة", "Draft"))}</option>
            <option value="published">{t(tx("منشور", "Published"))}</option>
            <option value="archived">{t(tx("مؤرشف", "Archived"))}</option>
          </select>
          <input
            required
            placeholder={t(tx("الاسم بالعربية", "Arabic full name"))}
            value={form.full_name_ar}
            onChange={(event) => setForm({ ...form, full_name_ar: event.target.value })}
          />
          <input
            required
            placeholder={t(tx("الاسم بالإنجليزية", "English full name"))}
            value={form.full_name_en}
            onChange={(event) => setForm({ ...form, full_name_en: event.target.value })}
          />
          <input
            placeholder={t(tx("المسمى الوظيفي بالعربية", "Arabic job title"))}
            value={form.title_ar}
            onChange={(event) => setForm({ ...form, title_ar: event.target.value })}
          />
          <input
            placeholder={t(tx("المسمى الوظيفي بالإنجليزية", "English job title"))}
            value={form.title_en}
            onChange={(event) => setForm({ ...form, title_en: event.target.value })}
          />
          <input
            placeholder={t(tx("التخصص بالعربية", "Arabic specialty"))}
            value={form.specialty_ar}
            onChange={(event) => setForm({ ...form, specialty_ar: event.target.value })}
          />
          <input
            placeholder={t(tx("التخصص بالإنجليزية", "English specialty"))}
            value={form.specialty_en}
            onChange={(event) => setForm({ ...form, specialty_en: event.target.value })}
          />
          <select
            value={form.department_id}
            onChange={(event) => setForm({ ...form, department_id: event.target.value })}
          >
            <option value="">{t(tx("بدون قسم", "No department"))}</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.title_ar}
              </option>
            ))}
          </select>
          <input
            placeholder={t(tx("رابط الصورة", "Photo URL"))}
            value={form.photo_url}
            onChange={(event) => setForm({ ...form, photo_url: event.target.value })}
          />
          <textarea
            placeholder={t(tx("نبذة بالعربية", "Arabic bio"))}
            value={form.bio_ar}
            onChange={(event) => setForm({ ...form, bio_ar: event.target.value })}
          />
          <textarea
            placeholder={t(tx("نبذة بالإنجليزية", "English bio"))}
            value={form.bio_en}
            onChange={(event) => setForm({ ...form, bio_en: event.target.value })}
          />
          <input
            type="number"
            placeholder={t(tx("ترتيب العرض", "Sort order"))}
            value={form.sort_order}
            onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) || 0 })}
          />
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
        </form>
      </div>

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
