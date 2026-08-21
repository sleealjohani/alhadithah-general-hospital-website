import { useState } from "react";
import { CalendarCheck, Search } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { PageHero } from "../../components/ui/PageHero";
import { usePageMeta } from "../../hooks/usePageMeta";
import { tx } from "../../utils/i18n";
import { BookingForm } from "./BookingForm";
import { AppointmentLookup } from "./AppointmentLookup";

/**
 * Public clinic appointments: request a new visit, or look up an existing
 * request by reference number, national ID, or phone to view/modify/cancel it.
 */
export function AppointmentsPage() {
  const { t } = usePortal();
  const [tab, setTab] = useState<"book" | "check">("book");

  usePageMeta(
    tx("حجز موعد في العيادات | مستشفى الحديثة العام", "Book a clinic appointment | Hadetha General Hospital"),
    tx(
      "احجز موعدك في عيادات مستشفى الحديثة العام، وتابع حالة طلبك برقم الطلب أو الهوية أو الجوال.",
      "Book an appointment at Hadetha General Hospital clinics and track your request by reference, ID, or phone."
    )
  );

  return (
    <>
      <PageHero
        eyebrow={tx("المواعيد", "Appointments")}
        title={tx("حجز موعد في العيادات", "Book a clinic appointment")}
        description={tx(
          "اختر العيادة والتاريخ والوقت المناسب، وأدخل بياناتك — وسيصلك رقم طلب فريد يمكنك متابعة حالته في أي وقت.",
          "Choose your clinic, date, and time and enter your details — you'll get a unique reference number you can track at any time."
        )}
      />

      <section className="section">
        <div className="container">
          <div className="appt-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "book"}
              className={tab === "book" ? "is-active" : ""}
              onClick={() => setTab("book")}
            >
              <CalendarCheck size={18} />
              {t(tx("طلب موعد جديد", "Request an appointment"))}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "check"}
              className={tab === "check" ? "is-active" : ""}
              onClick={() => setTab("check")}
            >
              <Search size={18} />
              {t(tx("متابعة طلبي", "Track my request"))}
            </button>
          </div>

          {tab === "book" ? <BookingForm onTrack={() => setTab("check")} /> : <AppointmentLookup />}
        </div>
      </section>
    </>
  );
}
