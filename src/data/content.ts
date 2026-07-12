import { tx } from "../utils/i18n";
import type { LocalizedText, PortalItem } from "../types";

export const identity = {
  name: tx("مستشفى الحديثة العام", "Hadetha General Hospital"),
  cluster: tx("تجمع الجوف الصحي", "Al-Jouf Health Cluster"),
  portal: tx("البوابة الرقمية", "Digital Portal"),
  tagline: tx(
    "نقطة دخول موحدة للخدمات والمعلومات والروابط والنماذج والإعلانات.",
    "A unified entry point for services, information, links, forms, and announcements."
  ),
  logo: "/assets/aljouf-cluster-logo.webp",
  hhcMark: "/assets/hhc-mark.webp",
  /* Official Al-Hadeethah brand, extracted from the letterhead. */
  mark: "/assets/brand/brand-mark.webp",
  markWhite: "/assets/brand/brand-mark-white.webp",
  lockup: "/assets/brand/hospital-logo.webp",
  lockupWhite: "/assets/brand/hospital-logo-white.webp",
  wave: "/assets/brand/brand-wave.webp"
};

export const navItems = [
  { path: "/", label: tx("الرئيسية", "Home") },
  { path: "/about", label: tx("عن المستشفى", "About") },
  { path: "/services", label: tx("الخدمات", "Services") },
  { path: "/departments", label: tx("الأقسام", "Departments") },
  { path: "/knowledge", label: tx("مركز المعرفة", "Knowledge") },
  { path: "/links", label: tx("النماذج والروابط", "Forms & Links") },
  { path: "/news", label: tx("الأخبار", "News") },
  { path: "/contact", label: tx("تواصل معنا", "Contact") }
];

/* Grouped mega-menu: a few top categories, each opening a dropdown panel of
   related pages. Covers every page in six clean top-level items. */
export type MegaMenuChild = { path: string; label: LocalizedText };
export type MegaMenuItem = { label: LocalizedText; path?: string; children?: MegaMenuChild[] };

export const megaMenu: MegaMenuItem[] = [
  { path: "/", label: tx("الرئيسية", "Home") },
  {
    label: tx("عن المستشفى", "About"),
    children: [
      { path: "/about", label: tx("نبذة عن المستشفى", "About the hospital") },
      { path: "/employees", label: tx("دليل الموظفين", "Employee directory") }
    ]
  },
  {
    label: tx("الخدمات والأقسام", "Services & Departments"),
    children: [
      { path: "/services", label: tx("دليل الخدمات", "Services directory") },
      { path: "/departments", label: tx("الأقسام", "Departments") },
      { path: "/nursing", label: tx("التمريض", "Nursing") },
      { path: "/quality", label: tx("الجودة وسلامة المرضى", "Quality & patient safety") }
    ]
  },
  {
    label: tx("مركز المعرفة", "Knowledge"),
    children: [
      { path: "/knowledge", label: tx("مركز المعرفة", "Knowledge center") },
      { path: "/reports", label: tx("التقارير", "Reports") },
      { path: "/links", label: tx("النماذج والروابط", "Forms & links") },
      { path: "/faq", label: tx("الأسئلة الشائعة", "FAQ") }
    ]
  },
  {
    label: tx("الأخبار والمبادرات", "News & Initiatives"),
    children: [
      { path: "/news", label: tx("الأخبار والإعلانات", "News & announcements") },
      { path: "/initiatives", label: tx("المبادرات", "Initiatives") },
      { path: "/experience", label: tx("تجربة المستفيد", "Patient experience") }
    ]
  },
  { path: "/contact", label: tx("تواصل معنا", "Contact us") }
];

export const pageCopy = {
  common: {
    noOfficialLinks: tx("الرابط غير متاح حاليًا.", "The link is not available at this time."),
    editable: tx("يتم تحديثه دوريًا", "Updated regularly"),
    empty: tx("لا يوجد محتوى منشور حاليًا.", "No published content is available yet.")
  },
  hero: {
    eyebrow: tx("بوابة رقمية رسمية", "Official Digital Portal"),
    title: tx("مستشفى الحديثة العام", "Hadetha General Hospital"),
    description: tx(
      "منصة عربية أولًا، ثنائية اللغة، تجمع الخدمات العامة، مركز المعرفة، النماذج، المبادرات، وتواصل المستفيد في تجربة صحية واضحة.",
      "An Arabic-first bilingual portal for public services, knowledge, forms, initiatives, and beneficiary communication in a clear hospital experience."
    )
  }
};

/* Trust figures for the animated count-up band. Edit these to the hospital's
   real numbers (beds, clinics, staff, years of service) any time. */
export const heroStats: { value: number; suffix: string; label: LocalizedText }[] = [
  { value: 6, suffix: "", label: tx("خدمات رئيسية", "Core services") },
  { value: 24, suffix: "/7", label: tx("جاهزية الطوارئ", "Emergency readiness") },
  { value: 4, suffix: "", label: tx("ركائز الجودة", "Quality pillars") },
  { value: 100, suffix: "%", label: tx("وصول رقمي", "Digital access") }
];

export const journeySteps = [
  {
    title: tx("يدخل المستخدم", "User enters"),
    text: tx("واجهة واضحة تحدد المسار المناسب مباشرة.", "A clear interface identifies the right path immediately."),
    icon: "Home"
  },
  {
    title: tx("يختار المسار", "Chooses a path"),
    text: tx("خدمات، موظفين، معرفة، تواصل، أو مبادرات.", "Services, employees, knowledge, contact, or initiatives."),
    icon: "ListChecks"
  },
  {
    title: tx("يتخذ إجراء", "Takes action"),
    text: tx("فتح رابط، إرسال نموذج، البحث عن ملف، أو قراءة إعلان.", "Open a link, submit a form, find a file, or read an announcement."),
    icon: "Zap"
  },
  {
    title: tx("يتابع الفريق المختص", "The right team follows up"),
    text: tx("تصل الملاحظات والطلبات إلى المسار المناسب للمتابعة حسب نوع الخدمة.", "Feedback and requests move to the right path for follow-up based on service type."),
    icon: "LayoutDashboard"
  }
];

export const quickAccess: PortalItem[] = [
  {
    id: "patient-path",
    title: tx("مسار المستفيد", "Beneficiary Path"),
    description: tx(
      "الوصول السريع للخدمات الصحية، التعليمات، الروابط المهمة، ونموذج الملاحظات.",
      "Quick access to health services, instructions, important links, and feedback."
    ),
    category: tx("عام", "Public"),
    icon: "HeartPulse",
    path: "/services",
    audience: "public"
  },
  {
    id: "employee-path",
    title: tx("بوابة الموظفين", "Employee Portal"),
    description: tx(
      "منطقة منظمة للسياسات والنماذج والتعاميم وروابط الجودة وسلامة المرضى.",
      "A structured area for policies, forms, circulars, and quality links."
    ),
    category: tx("داخلي", "Internal"),
    icon: "BriefcaseBusiness",
    path: "/employees",
    audience: "employee"
  },
  {
    id: "knowledge-path",
    title: tx("مركز المعرفة", "Knowledge Center"),
    description: tx(
      "ملفات وسياسات وأدلة وإجراءات منظمة للرجوع السريع عند الحاجة.",
      "Files, policies, guides, and procedures organized for quick reference."
    ),
    category: tx("مراجع", "Resources"),
    icon: "Library",
    path: "/knowledge",
    audience: "all"
  },
  {
    id: "quality-path",
    title: tx("الجودة وسلامة المرضى", "Quality & Patient Safety"),
    description: tx(
      "مسار للمبادرات والسياسات وروابط التحسين المرتبطة بسلامة المرضى وجودة الخدمة.",
      "A path for initiatives, policies, and improvement links related to patient safety and service quality."
    ),
    category: tx("جودة", "Quality"),
    icon: "ShieldCheck",
    path: "/quality",
    audience: "all"
  }
];

export const services: PortalItem[] = [
  {
    id: "emergency",
    title: tx("الطوارئ", "Emergency"),
    description: tx(
      "استقبال الحالات الطارئة وفق مسارات فرز واضحة، مع عرض التعليمات الرسمية بعد اعتمادها.",
      "Emergency intake through clear triage paths, with official instructions shown after approval."
    ),
    category: tx("خدمات عاجلة", "Urgent Care"),
    icon: "Siren",
    path: "/services#emergency"
  },
  {
    id: "outpatient",
    title: tx("العيادات الخارجية", "Outpatient Clinics"),
    description: tx(
      "تعريف بالخدمات والعيادات المتاحة، مع ربطها لاحقًا بمنصات الحجز الرسمية.",
      "Service and clinic information, ready to connect with official booking platforms."
    ),
    category: tx("رعاية مجدولة", "Scheduled Care"),
    icon: "CalendarCheck",
    path: "/services#outpatient"
  },
  {
    id: "laboratory",
    title: tx("المختبر", "Laboratory"),
    description: tx(
      "معلومات عامة عن خدمات المختبر والتعليمات المهمة قبل أو بعد إجراء الفحوصات.",
      "General laboratory information and important instructions before or after tests."
    ),
    category: tx("خدمات تشخيصية", "Diagnostic"),
    icon: "FlaskConical",
    path: "/services#laboratory"
  },
  {
    id: "radiology",
    title: tx("الأشعة", "Radiology"),
    description: tx(
      "عرض منظم لخدمات الأشعة والتعليمات العامة بدون نشر بيانات حساسة.",
      "Structured radiology service information without exposing sensitive data."
    ),
    category: tx("خدمات تشخيصية", "Diagnostic"),
    icon: "ScanLine",
    path: "/services#radiology"
  },
  {
    id: "pharmacy",
    title: tx("الصيدلية", "Pharmacy"),
    description: tx(
      "إرشادات عامة حول خدمات الصيدلية وطريقة الاستفادة من المعلومات الدوائية المتاحة.",
      "General guidance about pharmacy services and available medication information."
    ),
    category: tx("خدمات مساندة", "Support"),
    icon: "Pill",
    path: "/services#pharmacy"
  },
  {
    id: "patient-experience",
    title: tx("تجربة المستفيد", "Beneficiary Experience"),
    description: tx(
      "استقبال الملاحظات والمقترحات وتحويلها لمسار إداري واضح للمتابعة.",
      "Collect feedback and suggestions through a clear administrative workflow."
    ),
    category: tx("تحسين الخدمة", "Service Improvement"),
    icon: "MessageSquareText",
    path: "/experience"
  }
];

export const departments: PortalItem[] = [
  {
    id: "medical",
    title: tx("الأقسام الطبية", "Medical Departments"),
    description: tx(
      "تصنيف للأقسام الطبية ونطاق عمل كل قسم، مع ربط الخدمات والنماذج المرتبطة.",
      "Medical department grouping with related services and forms."
    ),
    category: tx("طبي", "Clinical"),
    icon: "Stethoscope",
    path: "/departments#medical"
  },
  {
    id: "technical",
    title: tx("الأقسام الفنية", "Technical Departments"),
    description: tx(
      "المختبر، الأشعة، التعقيم، والخدمات الفنية التي تدعم رحلة المستفيد.",
      "Laboratory, radiology, sterilization, and other technical services."
    ),
    category: tx("فني", "Technical"),
    icon: "Microscope",
    path: "/departments#technical"
  },
  {
    id: "nursing",
    title: tx("التمريض", "Nursing"),
    description: tx(
      "مساحة للتمريض تشمل الإعلانات الداخلية والأدلة والنماذج المعتمدة.",
      "A nursing area for internal announcements, guides, and approved forms."
    ),
    category: tx("تمريض", "Nursing"),
    icon: "BadgePlus",
    path: "/nursing"
  },
  {
    id: "quality",
    title: tx("الجودة وسلامة المرضى", "Quality & Patient Safety"),
    description: tx(
      "سياسات ومبادرات وروابط OVR و Good Catch ضمن إطار منظم.",
      "Policies, initiatives, OVR, and Good Catch links in a structured area."
    ),
    category: tx("جودة", "Quality"),
    icon: "ShieldCheck",
    path: "/quality"
  },
  {
    id: "admin",
    title: tx("الأقسام الإدارية", "Administrative Departments"),
    description: tx(
      "مسارات إدارية للنماذج والتعاميم والطلبات غير السريرية.",
      "Administrative paths for forms, circulars, and non-clinical requests."
    ),
    category: tx("إداري", "Administrative"),
    icon: "Building2",
    path: "/departments#admin"
  },
  {
    id: "support",
    title: tx("الخدمات المساندة", "Support Services"),
    description: tx(
      "تعريف بالخدمات الداعمة للمستفيد والموظف ضمن مسارات المستشفى.",
      "Support service information for beneficiaries and staff within hospital service paths."
    ),
    category: tx("مساند", "Support"),
    icon: "Workflow",
    path: "/departments#support"
  }
];

export const knowledgeItems: PortalItem[] = [
  {
    id: "policies",
    title: tx("السياسات والإجراءات", "Policies & Procedures"),
    description: tx(
      "مكتبة منظمة للسياسات والإجراءات التي يحتاجها الموظفون والفرق المختصة.",
      "A structured policy and procedure library for staff and specialized teams."
    ),
    category: tx("سياسات", "Policies"),
    icon: "FileText",
    fileType: "PDF / DOCX"
  },
  {
    id: "guides",
    title: tx("الأدلة الإرشادية", "Guides"),
    description: tx(
      "أدلة تشغيلية وتعريفية قابلة للتصنيف والبحث.",
      "Operational and informational guides that can be categorized and searched."
    ),
    category: tx("أدلة", "Guides"),
    icon: "BookOpen",
    fileType: "PDF"
  },
  {
    id: "circulars",
    title: tx("التعاميم", "Circulars"),
    description: tx(
      "تعاميم داخلية تظهر للموظفين فقط عند تفعيل صلاحيات الوصول.",
      "Internal circulars shown only to staff when access controls are enabled."
    ),
    category: tx("داخلي", "Internal"),
    icon: "Megaphone",
    fileType: "PDF"
  },
  {
    id: "media-library",
    title: tx("مكتبة الوسائط", "Media Library"),
    description: tx(
      "مساحة للصور والملفات المعتمدة رسميًا، بدون صور مرضى أو بيانات شخصية.",
      "A space for officially approved media, without patient photos or personal data."
    ),
    category: tx("وسائط", "Media"),
    icon: "Images",
    fileType: "WEBP / PNG / PDF"
  }
];

export const importantLinks: PortalItem[] = [
  {
    id: "sehhaty",
    title: tx("صحتي", "Sehhaty"),
    description: tx(
      "رابط للخدمات الوطنية ذات العلاقة عند توفره في قنوات المستشفى الرسمية.",
      "A link to related national services when available through official hospital channels."
    ),
    category: tx("خدمات وطنية", "National Services"),
    icon: "ExternalLink"
  },
  {
    id: "seha",
    title: tx("منصة صحة", "Seha Platform"),
    description: tx(
      "مسار مخصص للخدمات الصحية الوطنية ذات العلاقة بالمستفيد.",
      "A path for national health services relevant to beneficiaries."
    ),
    category: tx("خدمات وطنية", "National Services"),
    icon: "ExternalLink"
  },
  {
    id: "forms",
    title: tx("النماذج الإدارية", "Administrative Forms"),
    description: tx(
      "نماذج إدارية وخدمية منظمة للبحث والوصول السريع.",
      "Administrative and service forms organized for quick search and access."
    ),
    category: tx("نماذج", "Forms"),
    icon: "ClipboardList"
  },
  {
    id: "surveys",
    title: tx("الاستبيانات و QR", "Surveys & QR"),
    description: tx(
      "روابط الاستبيانات ورموز QR الخاصة بتجربة المستفيد عند توفرها.",
      "Survey links and QR codes for beneficiary experience when available."
    ),
    category: tx("تجربة المستفيد", "Experience"),
    icon: "QrCode"
  }
];

export const newsItems: PortalItem[] = [
  {
    id: "portal-ready",
    title: tx("أخبار وإعلانات المستشفى", "Hospital News and Announcements"),
    description: tx(
      "تظهر أخبار المستشفى وإعلاناته في هذا القسم لمتابعة المستجدات الرسمية.",
      "Hospital news and announcements appear here for official updates."
    ),
    category: tx("إعلان", "Announcement"),
    icon: "Newspaper",
    badge: tx("إعلان", "Announcement"),
    updatedAt: "2026-07-09"
  }
];

export const initiatives: PortalItem[] = [
  {
    id: "innovation",
    title: tx("إرسال مبادرة", "Submit an Initiative"),
    description: tx(
      "نموذج لاستقبال المبادرات والأفكار التحسينية وتحويلها للمسار المختص.",
      "A form for initiatives and improvement ideas to reach the right review path."
    ),
    category: tx("ابتكار", "Innovation"),
    icon: "Lightbulb",
    path: "/initiatives"
  },
  {
    id: "good-catch",
    title: tx("Good Catch", "Good Catch"),
    description: tx(
      "مسار مبسط للإبلاغ عن الملاحظات التحسينية المرتبطة بسلامة المرضى.",
      "A simple path for improvement reports related to patient safety."
    ),
    category: tx("سلامة", "Safety"),
    icon: "Target",
    path: "/initiatives#good-catch"
  }
];

export const employeeLinks: PortalItem[] = [
  {
    id: "internal-systems",
    title: tx("الأنظمة الداخلية", "Internal Systems"),
    description: tx(
      "روابط داخلية للأنظمة والخدمات التي يحتاجها الموظف أثناء العمل.",
      "Internal links for systems and services staff need during work."
    ),
    category: tx("أنظمة", "Systems"),
    icon: "Network"
  },
  {
    id: "quality-links",
    title: tx("روابط الجودة", "Quality Links"),
    description: tx(
      "مسارات OVR و Good Catch والسياسات المرتبطة بالجودة.",
      "OVR, Good Catch, and quality policy paths."
    ),
    category: tx("جودة", "Quality"),
    icon: "ShieldCheck",
    path: "/quality"
  },
  {
    id: "employee-forms",
    title: tx("نماذج الموظفين", "Employee Forms"),
    description: tx(
      "نماذج الموظفين الإدارية والخدمية في مساحة واحدة.",
      "Staff administrative and service forms in one place."
    ),
    category: tx("نماذج", "Forms"),
    icon: "FileCheck2",
    path: "/links"
  }
];

export const faqs: PortalItem[] = [
  {
    id: "faq-services",
    title: tx("كيف أجد خدمة معينة؟", "How do I find a specific service?"),
    description: tx(
      "استخدم صفحة الخدمات أو البحث العام للوصول إلى الخدمة أو القسم المطلوب بسرعة.",
      "Use the services page or global search to reach the needed service or department quickly."
    ),
    category: tx("الخدمات", "Services"),
    icon: "CircleHelp"
  },
  {
    id: "faq-contact",
    title: tx("لماذا لا تظهر أرقام التواصل؟", "Why are contact numbers not shown?"),
    description: tx(
      "استخدم نموذج التواصل لإرسال استفسارك أو ملاحظتك إلى المسار المناسب.",
      "Use the contact form to send your question or feedback to the appropriate path."
    ),
    category: tx("التواصل", "Contact"),
    icon: "CircleHelp"
  },
  {
    id: "faq-feedback",
    title: tx("كيف أرسل ملاحظة أو اقتراح؟", "How do I send feedback or a suggestion?"),
    description: tx(
      "يمكنك استخدام نموذج تجربة المستفيد أو نموذج التواصل، وسيتم توجيه الرسالة حسب نوعها.",
      "Use the beneficiary-experience or contact form, and the message will be routed according to its type."
    ),
    category: tx("تجربة المستفيد", "Beneficiary Experience"),
    icon: "CircleHelp"
  }
];

export const reportItems: PortalItem[] = [
  {
    id: "statistics",
    title: tx("الإحصاء والتقارير", "Statistics & Reports"),
    description: tx(
      "مساحة لإدارة التقارير المعتمدة دون نشر أرقام غير موثقة.",
      "A place for approved reports without publishing unverified statistics."
    ),
    category: tx("تقارير", "Reports"),
    icon: "BarChart3",
    path: "/reports"
  }
];

export const allPublicContent = [
  ...services,
  ...departments,
  ...knowledgeItems,
  ...importantLinks,
  ...newsItems,
  ...initiatives,
  ...employeeLinks,
  ...faqs,
  ...reportItems
];

export const contentTables = [
  { table: "services", label: tx("الخدمات", "Services") },
  { table: "departments", label: tx("الأقسام", "Departments") },
  { table: "clinics", label: tx("العيادات", "Clinics") },
  { table: "news_posts", label: tx("الأخبار", "News") },
  { table: "events", label: tx("الفعاليات", "Events") },
  { table: "knowledge_items", label: tx("مركز المعرفة", "Knowledge") },
  { table: "important_links", label: tx("الروابط", "Links") },
  { table: "faqs", label: tx("الأسئلة الشائعة", "FAQ") }
];

export const roleLabels: Record<string, LocalizedText> = {
  super_admin: tx("مدير عام", "Super Admin"),
  admin: tx("مدير", "Admin"),
  editor: tx("محرر", "Editor"),
  reviewer: tx("مراجع", "Reviewer"),
  viewer: tx("مشاهد", "Viewer")
};
