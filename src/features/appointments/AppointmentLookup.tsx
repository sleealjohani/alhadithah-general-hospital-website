import { useEffect, useState } from "react";
import { CalendarClock, Info, Loader2, MapPin, Search, Trash2, X } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { tx } from "../../utils/i18n";
import {
  bookableDates,
  cancelAppointment,
  fetchBookableClinics,
  fetchSlots,
  lookupAppointments,
  rescheduleAppointment,
  shortTime,
  type AppointmentClinic,
  type AppointmentPublic,
  type AppointmentStatus,
  type Slot
} from "../../lib/supabase/appointments";

const STATUS_TEXT: Record<AppointmentStatus, ReturnType<typeof tx>> = {
  pending: tx("قيد المراجعة", "Under review"),
  approved: tx("مؤكد", "Confirmed"),
  rescheduled: tx("أُعيد جدولته", "Rescheduled"),
  completed: tx("مكتمل", "Completed"),
  cancelled: tx("ملغي", "Cancelled"),
  no_show: tx("لم يحضر", "No show")
};
const STATUS_TONE: Record<AppointmentStatus, string> = {
  pending: "warning",
  approved: "success",
  rescheduled: "info",
  completed: "success",
  cancelled: "danger",
  no_show: "danger"
};

export function AppointmentLookup() {
  const { t, locale, notify } = usePortal();
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<AppointmentPublic[] | null>(null);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (identifier.trim().length < 4) {
      setError(t(tx("أدخل رقم الطلب أو الهوية أو الجوال.", "Enter your reference, ID, or phone number.")));
      return;
    }
    setBusy(true);
    setError("");
    const res = await lookupAppointments(identifier.trim());
    setBusy(false);
    if (res.error) {
      setError(t(tx("تعذّر الاتصال بالخدمة. حاول لاحقًا.", "The service is unavailable. Try again later.")));
      return;
    }
    setItems(res.items);
    if (res.items.length === 0) {
      setError(t(tx("لم نجد أي طلب مرتبط بهذا الرقم.", "We couldn't find a request for that number.")));
    }
  };

  const dateLabel = (iso: string) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", { dateStyle: "full" }).format(
      new Date(`${iso}T00:00:00`)
    );

  return (
    <div className="appt-lookup">
      <form className="appt-lookup-form" onSubmit={search}>
        <label className="appt-field">
          {t(tx("رقم الطلب أو رقم الهوية أو الجوال", "Reference number, national ID, or phone"))}
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            dir="ltr"
            placeholder={t(tx("مثال: HGH-260821-4821", "e.g. HGH-260821-4821"))}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? <Loader2 className="spin" size={18} /> : <Search size={18} />}
          {t(tx("بحث", "Search"))}
        </button>
      </form>

      {error ? (
        <p className="appt-error" role="alert">
          {error}
        </p>
      ) : null}

      {items && items.length > 0 ? (
        <div className="appt-results">
          {items.map((item) => (
            <AppointmentCard
              key={item.reference}
              item={item}
              dateLabel={dateLabel}
              onChanged={() => {
                notify(t(tx("تم تحديث طلبك.", "Your request was updated.")), "success");
                search();
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AppointmentCard({
  item,
  dateLabel,
  onChanged
}: {
  item: AppointmentPublic;
  dateLabel: (iso: string) => string;
  onChanged: () => void;
}) {
  const { t, notify } = usePortal();
  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const [busy, setBusy] = useState(false);
  const locked = item.status === "cancelled" || item.status === "completed";
  const instructions = t(tx(item.instructions_ar || "", item.instructions_en || ""));
  const location = t(tx(item.location_ar || "", item.location_en || ""));

  const doCancel = async () => {
    if (!window.confirm(t(tx("هل تريد إلغاء هذا الموعد؟", "Cancel this appointment?")))) return;
    setBusy(true);
    const { error } = await cancelAppointment(item.reference);
    setBusy(false);
    if (error) return notify(t(tx("تعذّر الإلغاء.", "Couldn't cancel.")), "error");
    onChanged();
  };

  return (
    <article className="appt-card">
      <header className="appt-card-head">
        <div>
          <span className="appt-card-ref">{item.reference}</span>
          <h3>{t(tx(item.clinic_name_ar || "", item.clinic_name_en || ""))}</h3>
        </div>
        <span className={`badge badge-${STATUS_TONE[item.status]}`}>{t(STATUS_TEXT[item.status])}</span>
      </header>

      <ul className="appt-card-meta">
        <li>
          <CalendarClock size={16} />
          {dateLabel(item.appointment_date)} · {shortTime(item.appointment_time)}
        </li>
        <li>
          <Info size={16} />
          {item.full_name}
        </li>
        {location ? (
          <li>
            <MapPin size={16} />
            {location}
          </li>
        ) : null}
      </ul>

      {item.admin_note ? (
        <div className="appt-note">
          <strong>{t(tx("ملاحظة من المستشفى", "Note from the hospital"))}</strong>
          <p>{item.admin_note}</p>
        </div>
      ) : null}

      {instructions && !locked ? (
        <div className="appt-instructions">
          <strong>{t(tx("تعليمات الحضور", "Attendance instructions"))}</strong>
          <p>{instructions}</p>
        </div>
      ) : null}

      {!locked ? (
        mode === "view" ? (
          <div className="appt-card-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setMode("reschedule")}>
              <CalendarClock size={16} />
              {t(tx("تعديل الموعد", "Change appointment"))}
            </button>
            <button type="button" className="btn btn-ghost" onClick={doCancel} disabled={busy}>
              <Trash2 size={16} />
              {t(tx("إلغاء الموعد", "Cancel appointment"))}
            </button>
          </div>
        ) : (
          <Reschedule reference={item.reference} onDone={onChanged} onClose={() => setMode("view")} />
        )
      ) : null}
    </article>
  );
}

/* Inline reschedule: reloads clinics/slots so the new pick is always valid. */
function Reschedule({
  reference,
  onDone,
  onClose
}: {
  reference: string;
  onDone: () => void;
  onClose: () => void;
}) {
  const { t, locale, notify } = usePortal();
  const [clinics, setClinics] = useState<AppointmentClinic[] | null>(null);
  const [clinicId, setClinicId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchBookableClinics().then((cs) => {
      setClinics(cs);
      setClinicId(cs[0]?.id ?? "");
    });
  }, []);

  const clinic = clinics?.find((c) => c.id === clinicId) ?? null;
  const dates = clinic ? bookableDates(clinic) : [];

  const pickDate = async (iso: string) => {
    setDate(iso);
    setTime("");
    setSlots(null);
    if (clinicId && iso) setSlots(await fetchSlots(clinicId, iso));
  };

  const save = async () => {
    if (!date || !time) return;
    setBusy(true);
    const { error } = await rescheduleAppointment(reference, date, time);
    setBusy(false);
    if (error) {
      notify(
        error === "slot_full"
          ? t(tx("اكتمل هذا الموعد، اختر وقتًا آخر.", "That slot is full, pick another time."))
          : t(tx("تعذّر التعديل.", "Couldn't reschedule.")),
        "error"
      );
      return;
    }
    onDone();
    onClose();
  };

  const dateLabel = (iso: string) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long"
    }).format(new Date(`${iso}T00:00:00`));

  return (
    <div className="appt-reschedule">
      <div className="appt-reschedule-head">
        <strong>{t(tx("اختر موعدًا جديدًا", "Pick a new time"))}</strong>
        <button type="button" className="icon-button" onClick={onClose} aria-label={t(tx("إغلاق", "Close"))}>
          <X size={16} />
        </button>
      </div>

      <label className="appt-field">
        {t(tx("العيادة", "Clinic"))}
        <select
          value={clinicId}
          onChange={(e) => {
            setClinicId(e.target.value);
            setDate("");
            setTime("");
            setSlots(null);
          }}
        >
          {(clinics ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {t(tx(c.name_ar, c.name_en))}
            </option>
          ))}
        </select>
      </label>

      <label className="appt-field">
        {t(tx("التاريخ", "Date"))}
        <select value={date} onChange={(e) => pickDate(e.target.value)}>
          <option value="">{t(tx("— اختر تاريخًا —", "— Select a date —"))}</option>
          {dates.map((d) => (
            <option key={d} value={d}>
              {dateLabel(d)}
            </option>
          ))}
        </select>
      </label>

      {slots ? (
        <div className="appt-slots">
          {slots.map((s) => (
            <button
              type="button"
              key={s.time}
              disabled={s.free <= 0}
              className={`appt-slot ${time === s.time ? "is-active" : ""} ${s.free <= 0 ? "is-full" : ""}`}
              onClick={() => setTime(s.time)}
            >
              {s.time}
            </button>
          ))}
        </div>
      ) : null}

      <button type="button" className="btn btn-primary" disabled={!date || !time || busy} onClick={save}>
        {busy ? <Loader2 className="spin" size={16} /> : <CalendarClock size={16} />}
        {t(tx("حفظ الموعد الجديد", "Save new time"))}
      </button>
    </div>
  );
}
