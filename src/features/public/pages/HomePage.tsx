import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, CalendarCheck, HeartPulse, MessageSquareText, ShieldCheck, Siren } from "lucide-react";
import { usePortal } from "../../../providers/PortalProvider";
import { Icon } from "../../../components/ui/Icon";
import { SectionHeading } from "../../../components/ui/SectionHeading";
import { ContentGrid } from "../../../components/ui/ContentGrid";
import { usePublishedItems } from "../../../hooks/usePublishedItems";
import { useHomepageSectionVisibility } from "../../../hooks/useHomepageSectionVisibility";
import { useHomepageHero } from "../../../hooks/useHomepageHero";
import { useQuickLinks } from "../../../hooks/useQuickLinks";
import { journeySteps, knowledgeItems, pageCopy, services } from "../../../data/content";
import { tx } from "../../../utils/i18n";

const HERO_SCRIM =
  "linear-gradient(90deg, rgba(7, 19, 47, 0.88) 0%, rgba(7, 19, 47, 0.72) 38%, rgba(7, 19, 47, 0.16) 72%)";

const XTimeline = lazy(() =>
  import("../../../components/public/XTimeline").then((m) => ({ default: m.XTimeline }))
);

export function HomePage() {
  const { t } = usePortal();
  const liveServices = usePublishedItems("services", services);
  const quickAccess = useQuickLinks();
  const [activePathId, setActivePathId] = useState(quickAccess[0]?.id);
  const activePath = quickAccess.find((item) => item.id === activePathId) || quickAccess[0];
  const isActive = useHomepageSectionVisibility();
  const heroImage = useHomepageHero();

  return (
    <>
      {isActive("hero") && (
      <section
        className="home-hero reference-hero"
        style={
          heroImage
            ? { backgroundImage: `${HERO_SCRIM}, url("${heroImage}")`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        <div className="container home-hero-grid">
          <div className="home-hero-copy" data-reveal>
            <span className="eyebrow">{t(pageCopy.hero.eyebrow)}</span>
            <h1>{t(pageCopy.hero.title)}</h1>
            <p>{t(pageCopy.hero.description)}</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/services">
                <HeartPulse size={18} />
                {t(tx("الخدمات الصحية", "Health services"))}
              </Link>
              <Link className="btn btn-secondary" to="/contact">
                <CalendarCheck size={18} />
                {t(tx("تواصل مع المستشفى", "Contact the hospital"))}
              </Link>
              <Link className="btn btn-ghost" to="/experience">
                <MessageSquareText size={18} />
                {t(tx("شارك ملاحظتك", "Share feedback"))}
              </Link>
            </div>
          </div>
          <HeroExperiencePanel />
        </div>
      </section>
      )}

      {isActive("quick_access") && (
      <section className="quick-ribbon" aria-label={t(tx("روابط رئيسية", "Primary links"))}>
        <div className="quick-ribbon-shape" aria-hidden="true" />
        <div className="container quick-ribbon-grid">
          {quickAccess.slice(0, 3).map((item) => (
            <Link className="quick-ribbon-card" key={item.id} to={item.path || "/"}>
              <span className="watermark-mark" aria-hidden="true" />
              <strong>{t(item.title)}</strong>
              <small>{t(item.description)}</small>
              <span className="arrow-mark">←</span>
            </Link>
          ))}
        </div>
      </section>
      )}

      {isActive("institution") && (
      <section className="institution-section">
        <div className="container institution-grid">
          <div className="vision-stack" data-reveal>
            <article>
              <span>{t(tx("رؤيتنا", "Vision"))}</span>
              <strong>{t(tx("نرتقي معًا بتجربة الوصول للخدمات والمعلومات.", "Elevating access to services and information together."))}</strong>
            </article>
            <article>
              <span>{t(tx("رسالتنا", "Mission"))}</span>
              <strong>{t(tx("تقديم بوابة مستدامة تجعل المحتوى الرسمي واضحًا وقابلًا للتحديث.", "Delivering a sustainable portal where official content is clear and maintainable."))}</strong>
            </article>
          </div>
          <div className="institution-copy" data-reveal>
            <span className="eyebrow">{t(tx("عن البوابة", "About the Portal"))}</span>
            <h2>{t(tx("منصة رقمية للمستشفى وليست صفحة تعريفية فقط", "A hospital digital platform, not just an informational page"))}</h2>
            <p>
              {t(
                tx(
                  "تجمع البوابة ما يحتاجه المستفيد والزائر والموظف في تجربة واضحة: الخدمات، الأقسام، الأدلة، الأخبار، النماذج، وملاحظات تجربة المستفيد.",
                  "The portal brings patients, visitors, and staff into a clear experience: services, departments, guides, news, forms, and beneficiary feedback."
                )
              )}
            </p>
            <Link className="btn btn-sky" to="/about">
              {t(tx("قراءة المزيد", "Read more"))}
            </Link>
          </div>
        </div>
      </section>
      )}

      {isActive("strategy") && (
      <section className="strategy-board-section">
        <div className="container">
          <SectionHeading
            eyebrow={tx("خدمات المستشفى", "Hospital Services")}
            title={tx("واجهة واحدة للوصول إلى الرعاية والمعلومات", "One interface for care and information")}
            description={tx(
              "تنظم الصفحة المسارات الأكثر طلبًا حتى يصل المستخدم إلى الخدمة المناسبة بسرعة ووضوح.",
              "The page organizes the most-requested paths so visitors can reach the right service quickly and clearly."
            )}
          />
          <div className="strategy-tiles">
            <article className="strategy-tile tile-sky" data-reveal>
              <Icon name="Target" size={54} />
              <span>{t(tx("خدمات", "Services"))}</span>
              <strong>6</strong>
              <p>{t(tx("طوارئ، عيادات، مختبر، أشعة، صيدلية، تجربة المستفيد", "Emergency, clinics, lab, radiology, pharmacy, beneficiary experience"))}</p>
            </article>
            <article className="strategy-tile tile-navy" data-reveal>
              <Icon name="ShieldCheck" size={54} />
              <span>{t(tx("جودة", "Quality"))}</span>
              <strong>4</strong>
              <p>{t(tx("سلامة المرضى، السياسات، المبادرات، التحسين", "Patient safety, policies, initiatives, improvement"))}</p>
            </article>
            <article className="strategy-tile tile-sky wide" data-reveal>
              <Icon name="Workflow" size={54} />
              <span>{t(tx("معلومات", "Information"))}</span>
              <strong>24</strong>
              <p>{t(tx("وصول مستمر للأدلة والأخبار والنماذج من أي جهاز", "Continuous access to guides, news, and forms from any device"))}</p>
            </article>
          </div>
        </div>
      </section>
      )}

      {isActive("interactive_path") && (
      <section className="interactive-path-section">
        <div className="container">
          <SectionHeading
            eyebrow={tx("مسارات تفاعلية", "Interactive Paths")}
            title={tx("كل مسار مستقل، وكلها تعمل كنظام واحد", "Each path stands alone, all paths work as one system")}
            description={tx(
              "اختر المسار المناسب لك، وستتغير التفاصيل والروابط مباشرة حسب حاجتك.",
              "Choose the path that fits your visit, and the details update immediately around your need."
            )}
          />
          <div className="path-lab">
            <div className="path-menu" data-reveal>
              {quickAccess.map((item) => (
                <button
                  className={item.id === activePath.id ? "is-active" : ""}
                  key={item.id}
                  onClick={() => setActivePathId(item.id)}
                  onMouseEnter={() => setActivePathId(item.id)}
                >
                  <Icon name={item.icon} />
                  <span>{t(item.title)}</span>
                </button>
              ))}
            </div>
            <article className="path-stage" data-reveal key={activePath.id}>
              <div className="path-stage-icon">
                <Icon name={activePath.icon} size={48} />
              </div>
              <span className="eyebrow">{t(activePath.category)}</span>
              <h3>{t(activePath.title)}</h3>
              <p>{t(activePath.description)}</p>
              <Link className="btn btn-primary" to={activePath.path || "/"}>
                {t(tx("فتح المسار", "Open path"))}
              </Link>
            </article>
          </div>
        </div>
      </section>
      )}

      {isActive("digital_services") && (
      <section className="digital-services-stage">
        <div className="container">
          <SectionHeading
            eyebrow={tx("الخدمات الإلكترونية", "Digital Services")}
            title={tx("خدمات صحية مرتبة حسب احتياج الزائر", "Health services organized around visitor needs")}
            description={tx(
              "تعرض البطاقات أهم الخدمات مع وصف مختصر ومسار واضح للانتقال إلى التفاصيل أو النماذج المرتبطة.",
              "The cards present key services with short descriptions and a clear path to details or related forms."
            )}
            action={<Link className="text-link" to="/services">{t(tx("كل الخدمات", "All services"))}</Link>}
          />
          <div className="digital-services-grid" data-reveal>
            {liveServices.slice(0, 4).map((item) => (
              <Link className="digital-service-card" to={item.path || "/services"} key={item.id}>
                <div>
                  <Icon name={item.icon} size={36} />
                  <span>{t(item.category)}</span>
                </div>
                <strong>{t(item.title)}</strong>
                <p>{t(item.description)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {isActive("journey") && (
      <section className="journey-section">
        <div className="container">
          <SectionHeading
            eyebrow={tx("رحلة المستخدم", "User Journey")}
            title={tx("خطوات واضحة للوصول إلى الخدمة", "Clear steps to reach a service")}
            description={tx(
              "تساعد الحركة الخفيفة والتنظيم المرحلي المستخدم على فهم الطريق من البحث إلى الإجراء.",
              "Subtle motion and staged structure help visitors move from search to action."
            )}
          />
          <div className="journey-track">
            {journeySteps.map((step, index) => (
              <article className="journey-step" key={step.title.en} data-reveal>
                <span className="journey-index">{String(index + 1).padStart(2, "0")}</span>
                <Icon name={step.icon} />
                <h3>{t(step.title)}</h3>
                <p>{t(step.text)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {isActive("knowledge_and_news") && (
      <section className="section">
        <div className="container two-column">
          <div data-reveal>
            <SectionHeading
              eyebrow={tx("مركز المعرفة", "Knowledge Center")}
              title={tx("أدلة وسياسات منظمة للرجوع السريع", "Guides and policies organized for quick reference")}
              description={tx(
                "تصنيف وبحث وبطاقات واضحة للسياسات والأدلة والتعاميم، مع حماية المحتوى الداخلي.",
                "Categorized, searchable cards for policies, guides, and circulars with internal-content protection."
              )}
            />
            <ContentGrid items={knowledgeItems.slice(0, 2)} />
          </div>
          <div data-reveal>
            <SectionHeading
              eyebrow={tx("الأخبار", "News")}
              title={tx("أخبار وإعلانات المستشفى", "Hospital news and announcements")}
              description={tx(
                "مساحة مخصصة للأخبار والتنبيهات والمبادرات التي تهم المستفيدين والموظفين.",
                "A dedicated space for news, notices, and initiatives relevant to visitors and staff."
              )}
            />
            <div className="home-news-stack">
              <Suspense fallback={null}>
                <XTimeline compact card />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
      )}
    </>
  );
}

function HeroExperiencePanel() {
  const { t } = usePortal();

  return (
    <div className="hero-experience hero-service-panel" data-reveal>
      <div className="hero-panel-header">
        <span className="eyebrow">{t(tx("مسارات الرعاية", "Care pathways"))}</span>
        <h2>{t(tx("اختر الخدمة المناسبة قبل زيارتك", "Choose the right service before your visit"))}</h2>
      </div>
      <div className="hero-panel-list">
        <Link to="/services#emergency">
          <span><Siren size={19} /></span>
          <strong>{t(tx("الطوارئ", "Emergency"))}</strong>
          <small>{t(tx("مسار للحالات العاجلة والتعليمات الأساسية", "A path for urgent cases and essential instructions"))}</small>
        </Link>
        <Link to="/services#outpatient">
          <span><CalendarCheck size={19} /></span>
          <strong>{t(tx("العيادات الخارجية", "Outpatient clinics"))}</strong>
          <small>{t(tx("تعرف على الخدمات والعيادات المتاحة", "View available services and clinics"))}</small>
        </Link>
        <Link to="/quality">
          <span><ShieldCheck size={19} /></span>
          <strong>{t(tx("الجودة وسلامة المرضى", "Quality and patient safety"))}</strong>
          <small>{t(tx("مسارات التحسين والمبادرات والسياسات", "Improvement paths, initiatives, and policies"))}</small>
        </Link>
      </div>
      <div className="hero-panel-footer">
        <BriefcaseBusiness size={18} />
        <div>
          <strong>{t(tx("بوابة الموظفين", "Staff portal"))}</strong>
          <span>{t(tx("مسار مستقل للنماذج والروابط الداخلية", "A separate path for forms and internal links"))}</span>
        </div>
      </div>
    </div>
  );
}
