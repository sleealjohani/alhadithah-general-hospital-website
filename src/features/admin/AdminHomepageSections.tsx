import { type FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { logAdminAction } from "../../lib/audit";
import { fetchAllHomeSections, type HomeCard, type HomeSection } from "../../lib/supabase/homepageSections";
import { ensureSlug } from "../../utils/slug";
import { tx } from "../../utils/i18n";
import type { LocalizedText } from "../../types";
import { ActiveBadge, CrudFormActions, Field, TableLoadingRows, useDeleteConfirm } from "./shared";
import { ImageField } from "./ImageField";

/* Built-in homepage blocks — editors can show/hide each one. Keys match the
   isActive(...) calls in HomePage. */
const BUILTIN: Array<{ key: string; label: LocalizedText }> = [
  { key: "hero", label: tx("الواجهة الرئيسية", "Hero banner") },
  { key: "quick_access", label: tx("الروابط السريعة", "Quick access") },
  { key: "institution", label: tx("عن المؤسسة", "Institution") },
  { key: "strategy", label: tx("الاستراتيجية", "Strategy") },
  { key: "digital_services", label: tx("الخدمات الرقمية", "Digital services") },
  { key: "interactive_path", label: tx("المسار التفاعلي", "Interactive path") },
  { key: "journey", label: tx("مسار المستخدم", "User journey") },
  { key: "knowledge_and_news", label: tx("المعرفة والأخبار", "Knowledge & news") }
];
const BUILTIN_KEYS = new Set(BUILTIN.map((item) => item.key));

const emptyCard: HomeCard = {
  image_url: "",
  title_ar: "",
  title_en: "",
  description_ar: "",
  description_en: "",
  url: ""
};

const emptyForm = {
  id: null as string | null,
  section_key: "",
  type: "rich" as "rich" | "cards",
  title_ar: "",
  title_en: "",
  subtitle_ar: "",
  subtitle_en: "",
  body_ar: "",
  body_en: "",
  image_url: "",
  button_label_ar: "",
  button_label_en: "",
  button_url: "",
  cards: [] as HomeCard[],
  is_active: true,
  sort_order: 100
};

export function AdminHomepageSections() {
  const { t, notify } = usePortal();
  const [rows, setRows] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllHomeSections();
    setLoading(false);
    setRows(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const custom = rows.filter((row) => row.content?.type === "rich" || row.content?.type === "cards");
  const builtinState = (key: string) => rows.find((row) => row.section_key === key)?.is_active !== false;

  const cancelEdit = () => setForm(emptyForm);

  const editSection = (row: HomeSection) => {
    const c = row.content || {};
    setForm({
      id: row.id,
      section_key: row.section_key,
      type: c.type === "cards" ? "cards" : "rich",
      title_ar: row.title_ar || "",
      title_en: row.title_en || "",
      subtitle_ar: row.subtitle_ar || "",
      subtitle_en: row.subtitle_en || "",
      body_ar: c.body_ar || "",
      body_en: c.body_en || "",
      image_url: c.image_url || "",
      button_label_ar: c.button_label_ar || "",
      button_label_en: c.button_label_en || "",
      button_url: c.button_url || "",
      cards: c.cards?.length ? c.cards : [],
      is_active: row.is_active,
      sort_order: row.sort_order
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleBuiltin = async (key: string, value: boolean) => {
    if (!supabase) {
      notify(t(tx("Supabase غير متصل.", "Supabase is not connected.")), "error");
      return;
    }
    setRows((current) => {
      const exists = current.some((row) => row.section_key === key);
      return exists
        ? current.map((row) => (row.section_key === key ? { ...row, is_active: value } : row))
        : [
            ...current,
            {
              id: key,
              section_key: key,
              title_ar: null,
              title_en: null,
              subtitle_ar: null,
              subtitle_en: null,
              content: {},
              is_active: value,
              sort_order: 100
            }
          ];
    });
    const { error } = await supabase
      .from("homepage_sections")
      .upsert({ section_key: key, is_active: value }, { onConflict: "section_key" });
    if (error) {
      notify(error.message, "error");
      load();
      return;
    }
    logAdminAction("homepage_section.toggle", "homepage_sections", null, { section_key: key, is_active: value });
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!supabase) {
      notify(t(tx("Supabase غير متصل.", "Supabase is not connected.")), "error");
      return;
    }
    const content =
      form.type === "cards"
        ? { type: "cards", cards: form.cards }
        : {
            type: "rich",
            body_ar: form.body_ar,
            body_en: form.body_en,
            image_url: form.image_url,
            button_label_ar: form.button_label_ar,
            button_label_en: form.button_label_en,
            button_url: form.button_url
          };
    const payload = {
      section_key: form.section_key || `sec-${ensureSlug(form.title_en, form.title_ar)}-${Date.now().toString(36)}`,
      title_ar: form.title_ar || null,
      title_en: form.title_en || null,
      subtitle_ar: form.subtitle_ar || null,
      subtitle_en: form.subtitle_en || null,
      content,
      is_active: form.is_active,
      sort_order: form.sort_order
    };

    setSaving(true);
    if (form.id && !BUILTIN_KEYS.has(form.section_key)) {
      const { error } = await supabase.from("homepage_sections").update(payload).eq("id", form.id);
      setSaving(false);
      if (error) {
        notify(error.message, "error");
        return;
      }
      logAdminAction("homepage_section.update", "homepage_sections", form.id, { section_key: payload.section_key });
      notify(t(tx("تم تحديث القسم.", "Section updated.")), "success");
    } else {
      const { error } = await supabase.from("homepage_sections").insert(payload);
      setSaving(false);
      if (error) {
        notify(error.message, "error");
        return;
      }
      logAdminAction("homepage_section.create", "homepage_sections", null, { section_key: payload.section_key });
      notify(t(tx("تمت إضافة القسم.", "Section added.")), "success");
    }
    cancelEdit();
    load();
  };

  const move = async (row: HomeSection, direction: -1 | 1) => {
    const index = custom.findIndex((item) => item.id === row.id);
    const target = custom[index + direction];
    if (!target || !supabase) return;
    await Promise.all([
      supabase.from("homepage_sections").update({ sort_order: target.sort_order }).eq("id", row.id),
      supabase.from("homepage_sections").update({ sort_order: row.sort_order }).eq("id", target.id)
    ]);
    load();
  };

  const { dialog: deleteDialog, requestDelete } = useDeleteConfirm(async (id) => {
    if (!supabase) return;
    const { error } = await supabase.from("homepage_sections").delete().eq("id", id);
    if (error) {
      notify(error.message, "error");
      return;
    }
    if (form.id === id) cancelEdit();
    logAdminAction("homepage_section.delete", "homepage_sections", id);
    notify(t(tx("تم حذف القسم.", "Section deleted.")), "success");
    load();
  });

  const updateCard = (index: number, patch: Partial<HomeCard>) => {
    setForm((current) => ({
      ...current,
      cards: current.cards.map((card, i) => (i === index ? { ...card, ...patch } : card))
    }));
  };

  return (
    <div className="admin-page">
      <SectionHeading
        title={tx("بناء الصفحة الرئيسية", "Homepage Builder")}
        description={tx(
          "أظهر أو أخفِ الأقسام الجاهزة، وأضف أقسامًا جديدة (نص وصورة وزر) أو شبكات بطاقات بالصور والروابط — كل شيء من هنا.",
          "Show or hide the built-in blocks, and add your own sections (text, image, button) or card grids with images and links — all from here."
        )}
      />

      {/* Built-in blocks visibility */}
      <div className="admin-panel">
        <h2>{t(tx("الأقسام الجاهزة", "Built-in blocks"))}</h2>
        <div className="builtin-toggles">
          {BUILTIN.map((item) => (
            <label className="builtin-toggle" key={item.key}>
              <input
                type="checkbox"
                checked={builtinState(item.key)}
                onChange={(event) => toggleBuiltin(item.key, event.target.checked)}
              />
              <span>{t(item.label)}</span>
              <ActiveBadge active={builtinState(item.key)} />
            </label>
          ))}
        </div>
      </div>

      {/* Custom section editor */}
      <div className="admin-panel">
        <h2>{form.id ? t(tx("تعديل قسم", "Edit section")) : t(tx("إضافة قسم جديد", "Add a new section"))}</h2>
        <form className="admin-form" onSubmit={save}>
          <Field label={tx("نوع القسم", "Section type")}>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "rich" | "cards" })}>
              <option value="rich">{t(tx("نص + صورة + زر", "Text + image + button"))}</option>
              <option value="cards">{t(tx("شبكة بطاقات", "Card grid"))}</option>
            </select>
          </Field>
          <Field label={tx("الحالة", "State")}>
            <select value={form.is_active ? "1" : "0"} onChange={(e) => setForm({ ...form, is_active: e.target.value === "1" })}>
              <option value="1">{t(tx("ظاهر", "Visible"))}</option>
              <option value="0">{t(tx("مخفي", "Hidden"))}</option>
            </select>
          </Field>
          <Field label={tx("العنوان بالعربية", "Arabic title")}>
            <input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} />
          </Field>
          <Field label={tx("العنوان بالإنجليزية", "English title")}>
            <input dir="ltr" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
          </Field>
          <Field label={tx("العنوان الفرعي بالعربية", "Arabic subtitle")}>
            <input value={form.subtitle_ar} onChange={(e) => setForm({ ...form, subtitle_ar: e.target.value })} />
          </Field>
          <Field label={tx("العنوان الفرعي بالإنجليزية", "English subtitle")}>
            <input dir="ltr" value={form.subtitle_en} onChange={(e) => setForm({ ...form, subtitle_en: e.target.value })} />
          </Field>

          {form.type === "rich" ? (
            <>
              <Field label={tx("النص بالعربية", "Arabic body")} wide>
                <textarea value={form.body_ar} onChange={(e) => setForm({ ...form, body_ar: e.target.value })} />
              </Field>
              <Field label={tx("النص بالإنجليزية", "English body")} wide>
                <textarea dir="ltr" value={form.body_en} onChange={(e) => setForm({ ...form, body_en: e.target.value })} />
              </Field>
              <ImageField
                label={tx("صورة القسم", "Section image")}
                value={form.image_url}
                onChange={(url) => setForm((current) => ({ ...current, image_url: url }))}
              />
              <Field label={tx("نص الزر (عربي)", "Button label (Arabic)")}>
                <input value={form.button_label_ar} onChange={(e) => setForm({ ...form, button_label_ar: e.target.value })} />
              </Field>
              <Field label={tx("نص الزر (إنجليزي)", "Button label (English)")}>
                <input dir="ltr" value={form.button_label_en} onChange={(e) => setForm({ ...form, button_label_en: e.target.value })} />
              </Field>
              <Field label={tx("رابط الزر", "Button link")} wide>
                <input dir="ltr" placeholder="https://… or /services" value={form.button_url} onChange={(e) => setForm({ ...form, button_url: e.target.value })} />
              </Field>
            </>
          ) : (
            <div className="cards-editor field-wide">
              <div className="cards-editor-head">
                <strong>{t(tx("البطاقات", "Cards"))}</strong>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setForm((current) => ({ ...current, cards: [...current.cards, { ...emptyCard }] }))}
                >
                  <Plus size={16} />
                  {t(tx("إضافة بطاقة", "Add card"))}
                </button>
              </div>
              {form.cards.length === 0 ? (
                <p className="muted">{t(tx("لا توجد بطاقات بعد — أضف بطاقة.", "No cards yet — add one."))}</p>
              ) : null}
              {form.cards.map((card, index) => (
                <div className="card-editor" key={index}>
                  <div className="card-editor-head">
                    <span>
                      {t(tx("بطاقة", "Card"))} {index + 1}
                    </span>
                    <button
                      type="button"
                      className="icon-button danger"
                      onClick={() => setForm((current) => ({ ...current, cards: current.cards.filter((_, i) => i !== index) }))}
                      aria-label={t(tx("حذف البطاقة", "Remove card"))}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="card-editor-grid">
                    <label>
                      {t(tx("العنوان (عربي)", "Title (Arabic)"))}
                      <input value={card.title_ar || ""} onChange={(e) => updateCard(index, { title_ar: e.target.value })} />
                    </label>
                    <label>
                      {t(tx("العنوان (إنجليزي)", "Title (English)"))}
                      <input dir="ltr" value={card.title_en || ""} onChange={(e) => updateCard(index, { title_en: e.target.value })} />
                    </label>
                    <label>
                      {t(tx("الوصف (عربي)", "Description (Arabic)"))}
                      <input value={card.description_ar || ""} onChange={(e) => updateCard(index, { description_ar: e.target.value })} />
                    </label>
                    <label>
                      {t(tx("الوصف (إنجليزي)", "Description (English)"))}
                      <input dir="ltr" value={card.description_en || ""} onChange={(e) => updateCard(index, { description_en: e.target.value })} />
                    </label>
                    <label className="field-wide">
                      {t(tx("رابط البطاقة", "Card link"))}
                      <input dir="ltr" placeholder="https://… or /page" value={card.url || ""} onChange={(e) => updateCard(index, { url: e.target.value })} />
                    </label>
                  </div>
                  <ImageField
                    label={tx("صورة البطاقة", "Card image")}
                    value={card.image_url || ""}
                    onChange={(url) => updateCard(index, { image_url: url })}
                  />
                </div>
              ))}
            </div>
          )}

          <Field label={tx("ترتيب العرض", "Sort order")}>
            <input
              type="number"
              inputMode="numeric"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
            />
          </Field>
          <CrudFormActions busy={saving} editing={Boolean(form.id)} onCancel={cancelEdit} createLabel={tx("إضافة القسم", "Add section")} />
        </form>
      </div>

      {/* Custom sections list */}
      <div className="admin-panel">
        <div className="admin-toolbar">
          <h2>{t(tx("أقسامك المخصّصة", "Your custom sections"))}</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table" aria-busy={loading}>
            <thead>
              <tr>
                <th>{t(tx("العنوان", "Title"))}</th>
                <th>{t(tx("النوع", "Type"))}</th>
                <th>{t(tx("الحالة", "State"))}</th>
                <th>{t(tx("إجراء", "Action"))}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoadingRows cols={4} />
              ) : (
                custom.map((row, index) => (
                  <tr key={row.id}>
                    <td>{row.title_ar || row.title_en || row.section_key}</td>
                    <td>{row.content.type === "cards" ? t(tx("بطاقات", "Cards")) : t(tx("نص", "Text"))}</td>
                    <td>
                      <ActiveBadge active={row.is_active} />
                    </td>
                    <td>
                      <button className="icon-button" disabled={index === 0} onClick={() => move(row, -1)} aria-label={t(tx("أعلى", "Move up"))}>
                        <ArrowUp size={16} />
                      </button>
                      <button className="icon-button" disabled={index === custom.length - 1} onClick={() => move(row, 1)} aria-label={t(tx("أسفل", "Move down"))}>
                        <ArrowDown size={16} />
                      </button>
                      <button className="icon-button" onClick={() => editSection(row)} aria-label={t(tx("تعديل", "Edit"))}>
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button danger"
                        onClick={() => requestDelete(row.id, row.title_ar || row.section_key)}
                        aria-label={t(tx("حذف", "Delete"))}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {!loading && custom.length === 0 ? (
                <tr>
                  <td colSpan={4}>{t(tx("لا توجد أقسام مخصّصة بعد — أضف واحدًا بالأعلى.", "No custom sections yet — add one above."))}</td>
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
