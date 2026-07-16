import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, UserRound } from "lucide-react";
import { usePortal } from "../../../providers/PortalProvider";
import { PageHero } from "../../../components/ui/PageHero";
import { SectionHeading } from "../../../components/ui/SectionHeading";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { NursingSignIn } from "../../nursing/NursingSignIn";
import { NursingCarousel } from "../../nursing/NursingCarousel";
import { NurseOfMonth } from "../../nursing/NurseOfMonth";
import {
  fetchActiveSpotlight,
  fetchNursingMedia,
  getNursingToken,
  type NursingMedia,
  type NursingSpotlight
} from "../../../lib/supabase/nursing";
import { tx } from "../../../utils/i18n";

export function NursingPage() {
  const { t } = usePortal();
  const navigate = useNavigate();
  const [media, setMedia] = useState<NursingMedia[]>([]);
  const [spotlight, setSpotlight] = useState<NursingSpotlight | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const hasSession = Boolean(getNursingToken());

  usePageMeta(
    tx("بوابة التمريض | مستشفى الحديثة العام", "Nursing Portal | Hadetha General Hospital"),
    tx("عن التمريض، فعالياتنا، وبوابة كادر التمريض.", "About nursing, our events, and the nursing staff portal.")
  );

  useEffect(() => {
    let active = true;
    fetchNursingMedia().then((rows) => active && setMedia(rows));
    fetchActiveSpotlight().then((row) => active && setSpotlight(row));
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHero
        eyebrow={tx("التمريض", "Nursing")}
        title={tx("التمريض في مستشفى الحديثة العام", "Nursing at Hadetha General Hospital")}
        description={tx(
          "قلب الرعاية الصحية — كادر تمريضي يقدّم رعاية آمنة ورحيمة على مدار الساعة، مع بوابة رقمية تخدم كل ممرض وممرضة.",
          "The heart of care — a nursing team delivering safe, compassionate, round-the-clock care, with a digital portal serving every nurse."
        )}
      />

      {/* About nursing — landscape auto-scrolling media reel */}
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow={tx("عن التمريض", "About Nursing")}
            title={tx("رعاية تُبنى على الرحمة والكفاءة", "Care built on compassion and competence")}
            description={tx(
              "يمثّل التمريض ركيزة الرعاية في المستشفى، من الطوارئ إلى العيادات والأقسام الداخلية، بفريق متعدد التخصصات يعمل وفق أعلى معايير الجودة وسلامة المرضى.",
              "Nursing is the backbone of care across emergency, clinics, and inpatient wards — a multidisciplinary team working to the highest standards of quality and patient safety."
            )}
          />
        </div>
        {media.length > 0 ? (
          <div className="nursing-reel-wrap" data-reveal>
            <NursingCarousel media={media} />
          </div>
        ) : null}
      </section>

      {/* Nurse of the Month — the main character of the page */}
      {spotlight ? (
        <section className="section nom-section">
          <div className="container">
            <SectionHeading
              eyebrow={tx("تكريم", "Recognition")}
              title={tx("ممرض/ممرضة الشهر", "Nurse of the Month")}
              description={tx(
                "نحتفي بمن قدّم رعاية استثنائية هذا الشهر — اضغط أو مرّر المؤشر على البطاقة لاكتشاف إنجازاته.",
                "Celebrating exceptional care this month — tap or hover the card to reveal the achievements."
              )}
            />
            <NurseOfMonth spotlight={spotlight} />
          </div>
        </section>
      ) : null}

      {/* Staff sign-in */}
      <section className="section">
        <div className="container">
          <div className="nursing-signin-band info-card">
            <span className="service-icon nursing-signin-icon">
              <UserRound size={28} />
            </span>
            <div>
              <span className="eyebrow">{t(tx("خاص بالكادر", "Staff only"))}</span>
              <h2>{t(tx("بوابة كادر التمريض", "Nursing staff portal"))}</h2>
              <p>
                {t(
                  tx(
                    "دخول آمن بالرقم الوظيفي ورقم سري: اطّلع على السياسات، قدّم خطة إجازتك، وحدّث ملفك المهني وشهاداتك.",
                    "Secure sign-in with your employee number and a PIN: review policies, submit your vacation plan, and manage your professional profile and certificates."
                  )
                )}
              </p>
            </div>
            {hasSession ? (
              <button className="btn btn-primary" onClick={() => navigate("/nursing/portal")}>
                <Stethoscope size={18} />
                {t(tx("ادخل البوابة", "Enter portal"))}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => setSignInOpen(true)}>
                <UserRound size={18} />
                {t(tx("تسجيل دخول الكادر", "Staff sign-in"))}
              </button>
            )}
          </div>
        </div>
      </section>

      {signInOpen ? (
        <NursingSignIn onClose={() => setSignInOpen(false)} onSuccess={() => navigate("/nursing/portal")} />
      ) : null}
    </>
  );
}
