import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeartHandshake, ShieldCheck, Sparkles, Stethoscope, UserRound } from "lucide-react";
import { usePortal } from "../../../providers/PortalProvider";
import { PageHero } from "../../../components/ui/PageHero";
import { SectionHeading } from "../../../components/ui/SectionHeading";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { NursingSignIn } from "../../nursing/NursingSignIn";
import { fetchNursingMedia, getNursingToken, type NursingMedia } from "../../../lib/supabase/nursing";
import { tx } from "../../../utils/i18n";

const VALUES = [
  {
    icon: HeartHandshake,
    title: tx("الرحمة", "Compassion"),
    text: tx("رعاية إنسانية تضع المريض وكرامته أولًا.", "Humane care that puts the patient and their dignity first.")
  },
  {
    icon: ShieldCheck,
    title: tx("السلامة", "Safety"),
    text: tx("ممارسات قائمة على الأدلة تحمي المريض والكادر.", "Evidence-based practice that protects patients and staff.")
  },
  {
    icon: Sparkles,
    title: tx("التميّز", "Excellence"),
    text: tx("تطوير مستمر للمهارات والكفاءات التمريضية.", "Continuous growth of nursing skills and competencies.")
  }
];

export function NursingPage() {
  const { t } = usePortal();
  const navigate = useNavigate();
  const [media, setMedia] = useState<NursingMedia[]>([]);
  const [signInOpen, setSignInOpen] = useState(false);
  const hasSession = Boolean(getNursingToken());

  usePageMeta(
    tx("بوابة التمريض | مستشفى الحديثة العام", "Nursing Portal | Hadetha General Hospital"),
    tx("عن التمريض، فعالياتنا، وبوابة كادر التمريض.", "About nursing, our events, and the nursing staff portal.")
  );

  useEffect(() => {
    let active = true;
    fetchNursingMedia().then((rows) => active && setMedia(rows));
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

      {/* About nursing */}
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
          <div className="nursing-values">
            {VALUES.map((value) => (
              <article className="nursing-value info-card" data-reveal key={value.title.en}>
                <span className="service-icon">
                  <value.icon size={24} />
                </span>
                <h3>{t(value.title)}</h3>
                <p>{t(value.text)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Live media feed */}
      {media.length > 0 ? (
        <section className="section nursing-media-section">
          <div className="container">
            <SectionHeading
              eyebrow={tx("من فعاليات التمريض", "Nursing highlights")}
              title={tx("صور ولقطات من ميدان التمريض", "Photos & moments from the nursing floor")}
            />
            <div className="training-gallery">
              {media.map((item) => (
                <figure className="gallery-item" key={item.id}>
                  {item.media_type === "video" ? (
                    <video src={item.media_url} controls preload="metadata" />
                  ) : (
                    <img src={item.media_url} alt={t(tx(item.title_ar || "", item.title_en || ""))} loading="lazy" />
                  )}
                  {item.caption_ar || item.caption_en ? (
                    <figcaption>{t(tx(item.caption_ar || "", item.caption_en || ""))}</figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
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
