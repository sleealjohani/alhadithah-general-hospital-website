import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { logAdminAction } from "../../lib/audit";
import { displayRowValue } from "../../utils/format";
import { tx } from "../../utils/i18n";
import { CrudFormActions, Field, StatusBadge, TableLoadingRows, useDeleteConfirm } from "./shared";

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
    const payload = { ...form, department_id: form.department_id || null };
    setSaving(true);
    if (editingId) {
      const { error } = await supabase.from("doctors").update(payload).eq("id", editingId);
      setSaving(false);
      if (error) {
        notify(error.message, "error");
        return;
      }
      logAdminAction("doctor.update", "doctors", editingId, { full_name_ar: form.full_name_ar });
      notify(t(tx("تم تحديث بيانات الطبيب.", "Doctor updated.")), "success");
    } else {
      const { error } = await supabase.from("doctors").insert(payload);
      setSaving(false);
      if (error) {
        notify(error.message, "error");
        return;
      }
      logAdminAction("doctor.create", "doctors", null, { full_name_ar: form.full_name_ar });
      notify(t(tx("تم إضافة الطبيب.", "Doctor added.")), "success");
    }
    cancelEdit();
    loadRows();
  };

  const { dialog: deleteDialog, requestDelete } = useDeleteConfirm(async (id) => {
    if (!supabase) return;
    const { error } = await supabase.from("doctors").delete().eq("id", id);
    if (error) {
      notify(error.message, "error");
      return;
    }
    if (editingId === id) cancelEdit();
    logAdminAction("doctor.delete", "doctors", id);
    notify(t(tx("تم الحذف.", "Deleted.")), "success");
    loadRows();
  });

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
          <Field label={tx("المعرف في الرابط (slug)", "Slug")}>
            <input required dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </Field>
          <Field label={tx("الحالة", "Status")}>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">{t(tx("مسودة", "Draft"))}</option>
              <option value="published">{t(tx("منشور", "Published"))}</option>
              <option value="archived">{t(tx("مؤرشف", "Archived"))}</option>
            </select>
          </Field>
          <Field label={tx("الاسم بالعربية", "Arabic full name")}>
            <input required value={form.full_name_ar} onChange={(e) => setForm({ ...form, full_name_ar: e.target.value })} />
          </Field>
          <Field label={tx("الاسم بالإنجليزية", "English full name")}>
            <input required dir="ltr" value={form.full_name_en} onChange={(e) => setForm({ ...form, full_name_en: e.target.value })} />
          </Field>
          <Field label={tx("المسمى الوظيفي بالعربية", "Arabic job title")}>
            <input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} />
          </Field>
          <Field label={tx("المسمى الوظيفي بالإنجليزية", "English job title")}>
            <input dir="ltr" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
          </Field>
          <Field label={tx("التخصص بالعربية", "Arabic specialty")}>
            <input value={form.specialty_ar} onChange={(e) => setForm({ ...form, specialty_ar: e.target.value })} />
          </Field>
          <Field label={tx("التخصص بالإنجليزية", "English specialty")}>
            <input dir="ltr" value={form.specialty_en} onChange={(e) => setForm({ ...form, specialty_en: e.target.value })} />
          </Field>
          <Field label={tx("القسم", "Department")}>
            <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
              <option value="">{t(tx("بدون قسم", "No department"))}</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.title_ar}
                </option>
              ))}
            </select>
          </Field>
          <Field label={tx("رابط الصورة", "Photo URL")}>
            <input dir="ltr" value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} />
          </Field>
          <Field label={tx("نبذة بالعربية", "Arabic bio")} wide>
            <textarea value={form.bio_ar} onChange={(e) => setForm({ ...form, bio_ar: e.target.value })} />
          </Field>
          <Field label={tx("نبذة بالإنجليزية", "English bio")} wide>
            <textarea dir="ltr" value={form.bio_en} onChange={(e) => setForm({ ...form, bio_en: e.target.value })} />
          </Field>
          <Field label={tx("ترتيب العرض", "Sort order")}>
            <input
              type="number"
              inputMode="numeric"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
            />
          </Field>
          <CrudFormActions
            busy={saving}
            editing={Boolean(editingId)}
            onCancel={cancelEdit}
            createLabel={tx("إضافة", "Add")}
          />
        </form>
      </div>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <h2>{t(tx("الأطباء", "Doctors"))}</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table" aria-busy={loading}>
            <thead>
              <tr>
                <th>{t(tx("الاسم", "Name"))}</th>
                <th>{t(tx("التخصص", "Specialty"))}</th>
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
                    <td>{displayRowValue(row, ["full_name_ar"])}</td>
                    <td>{displayRowValue(row, ["specialty_ar"], "-")}</td>
                    <td>
                      <StatusBadge value={displayRowValue(row, ["status"], "-")} />
                    </td>
                    <td>
                      <button className="icon-button" onClick={() => edit(row)} aria-label={t(tx("تعديل", "Edit"))}>
                        <Pencil size={17} />
                      </button>
                      <button
                        className="icon-button danger"
                        onClick={() => requestDelete(String(row.id), displayRowValue(row, ["full_name_ar", "id"]))}
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
                  <td colSpan={4}>{t(tx("لا يوجد أطباء بعد.", "No doctors yet."))}</td>
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
