import { useState } from "react";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, HeartPulse, LayoutDashboard, Library, ShieldCheck } from "lucide-react";
import { usePortal } from "../../../providers/PortalProvider";
import { Icon } from "../../../components/ui/Icon";
import { SectionHeading } from "../../../components/ui/SectionHeading";
import { ContentGrid } from "../../../components/ui/ContentGrid";
import { usePublishedItems } from "../../../hooks/usePublishedItems";
import { useHomepageSectionVisibility } from "../../../hooks/useHomepageSectionVisibility";
import { identity, journeySteps, knowledgeItems, newsItems, pageCopy, quickAccess, services } from "../../../data/content";
import { tx } from "../../../utils/i18n";

export function HomePage() {
  const { t } = usePortal();
  const liveServices = usePublishedItems("services", services);
  const liveNews = usePublishedItems("news_posts", newsItems);
  const [activePathId, setActivePathId] = useState(quickAccess[0].id);
  const activePath = quickAccess.find((item) => item.id === activePathId) || quickAccess[0];
  const isActive = useHomepageSectionVisibility();

  return (
    <>
      {isActive("hero") && (
      <section className="home-hero reference-hero">
        <div className="hero-glow hero-glow-one" aria-hidden="true" />
        <div className="hero-glow hero-glow-two" aria-hidden="true" />
        <div className="hero-radar" aria-hidden="true" />
        <div className="container home-hero-grid">
          <div className="home-hero-copy" data-reveal>
            <span className="eyebrow">{t(pageCopy.hero.eyebrow)}</span>
            <h1>
              {t(tx("بكم نرتقي بتجربة مستشفى الحديثة الرقمية.", "Together, we elevate Hadetha Hospital's digital experience."))}
            </h1>
            <p>
              {t(
                tx(
                  "بوابة رسمية تجمع مسارات المستفيد والموظف والإدارة في تجربة واحدة؛ كل قسم مستقل في وظيفته، لكنه متصل بباقي المنظومة من خلال البحث، الصلاحيات، ومركز المعرفة.",
                  "An official portal connecting beneficiary, employee, and admin paths in one experience; each section is independent in purpose, yet connected through search, permissions, and the knowledge center."
                )
              )}
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/services">
                <HeartPulse size={18} />
                {t(tx("ابدأ من الخدمات", "Start with services"))}
              </Link>
              <Link className="btn btn-secondary" to="/employees">
                <BriefcaseBusiness size={18} />
                {t(tx("مسار الموظفين", "Employee path"))}
              </Link>
              <Link className="btn btn-ghost" to="/admin">
                <LayoutDashboard size={18} />
                {t(tx("إدارة البوابة", "Manage portal"))}
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
                  "البوابة مبنية كمنظومة: خدمات عامة، مركز معرفة، نماذج وروابط، مبادرات، تجربة مستفيد، وجودة وسلامة. تظهر للمستخدم كرحلة بسيطة، وتظهر للإدارة كنظام محتوى منظم.",
                  "The portal is built as a system: public services, knowledge center, forms and links, initiatives, beneficiary experience, and quality and safety. Users see a simple journey; admins see structured content governance."
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
            eyebrow={tx("في استراتيجيتنا", "In Our Strategy")}
            title={tx("أربعة مسارات، وخمس قدرات، وست وحدات تشغيل", "Four paths, five capabilities, and six operating modules")}
            description={tx(
              "استخدمنا إيقاع الصحة القابضة في عرض الاستراتيجية، لكن المحتوى هنا خاص ببوابة المستشفى وقابل للتعديل.",
              "We used the Health Holding strategic rhythm, while keeping the content specific to the hospital portal and editable."
            )}
          />
          <div className="strategy-tiles">
            <article className="strategy-tile tile-sky" data-reveal>
              <Icon name="Target" size={54} />
              <span>{t(tx("مسارات", "Paths"))}</span>
              <strong>4</strong>
              <p>{t(tx("مستفيد، موظف، إدارة، زائر", "Beneficiary, employee, admin, visitor"))}</p>
            </article>
            <article className="strategy-tile tile-navy" data-reveal>
              <Icon name="ShieldCheck" size={54} />
              <span>{t(tx("قدرات", "Capabilities"))}</span>
              <strong>5</strong>
              <p>{t(tx("بحث، لغة، ثيم، صلاحيات، نماذج", "Search, language, theme, roles, forms"))}</p>
            </article>
            <article className="strategy-tile tile-sky wide" data-reveal>
              <Icon name="Workflow" size={54} />
              <span>{t(tx("وحدات", "Modules"))}</span>
              <strong>6</strong>
              <p>{t(tx("الخدمات، المعرفة، الروابط، الأخبار، المبادرات، الرسائل", "Services, knowledge, links, news, initiatives, submissions"))}</p>
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
              "مرر أو اختر المسار لتتغير اللوحة. هذا يخلق إحساس موقع حي بدل واجهة مسطحة.",
              "Hover or choose a path and the panel changes. This creates a living site, not a flat interface."
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
            <article className="path-stage" data-reveal>
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
            title={tx("مرحلة رقمية عميقة للخدمات والنماذج", "A deep digital stage for services and forms")}
            description={tx(
              "بدل قائمة روابط، تظهر الخدمات داخل مساحة داكنة تشبه أقسام الخدمات الإلكترونية في المرجع، مع بطاقات قابلة للإدارة من Supabase.",
              "Instead of a link list, services sit in a dark digital stage like the reference e-service sections, with Supabase-managed cards."
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
            title={tx("حركة الصفحة تخدم الفهم", "Motion that explains the journey")}
            description={tx(
              "كل خطوة تقود للتي بعدها بدل عرض محتوى متراكم بلا ترتيب.",
              "Each step leads to the next instead of stacking content without order."
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
              title={tx("مركز معرفة لا يبدو كمجلد ملفات", "A knowledge center that does not feel like a folder")}
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
              title={tx("أخبار رسمية عند الاعتماد", "Official news when approved")}
              description={tx(
                "لن تظهر أخبار رسمية إلا بعد نشرها من لوحة التحكم.",
                "Official news appears only after admin publication."
              )}
            />
            <ContentGrid items={liveNews.slice(0, 2)} />
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
    <div className="hero-experience" data-reveal>
      <div className="hero-screen">
        <div className="screen-topbar">
          <span />
          <span />
          <span />
        </div>
        <div className="screen-content">
          <div className="screen-logo">
            <img src={identity.logo} alt={t(identity.cluster)} />
          </div>
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="floating-chip chip-one">
            <HeartPulse size={17} />
            {t(tx("خدمات", "Services"))}
          </div>
          <div className="floating-chip chip-two">
            <Library size={17} />
            {t(tx("معرفة", "Knowledge"))}
          </div>
          <div className="floating-chip chip-three">
            <ShieldCheck size={17} />
            {t(tx("إدارة آمنة", "Secure admin"))}
          </div>
        </div>
      </div>
      <div className="hero-status-card">
        <span>{t(tx("جاهزية النشر", "Deployment readiness"))}</span>
        <strong>{t(tx("Netlify + Supabase", "Netlify + Supabase"))}</strong>
        <div className="status-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
