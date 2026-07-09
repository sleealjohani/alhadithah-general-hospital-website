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
  hhcMark: "/assets/hhc-mark.webp"
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

export const pageCopy = {
  common: {
    noOfficialLinks: tx("لا يوجد رابط رسمي معتمد حاليًا.", "No approved official link is available yet."),
    editable: tx("قابل للإدارة من لوحة التحكم", "Manageable from the admin panel"),
    empty: tx("لا يوجد محتوى منشور حاليًا.", "No published content is available yet.")
  },
  hero: {
    eyebrow: tx("بوابة رقمية رسمية", "Official Digital Portal"),
    title: tx("مستشفى الحديثة العام", "Hadetha General Hospital"),
    description: tx(
      "منصة عربية أولًا، ثنائية اللغة، تجمع الخدمات العامة، مركز المعرفة، النماذج، المبادرات، وتواصل المستفيد في تجربة واضحة قابلة للنشر.",
      "An Arabic-first bilingual portal for public services, knowledge, forms, initiatives, and beneficiary communication in a deployable experience."
    )
  }
};

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
    title: tx("تتابع الإدارة", "Admin follows up"),
    text: tx("تظهر الطلبات والمحتوى داخل لوحة التحكم مع صلاحيات واضحة.", "Submissions and content appear in the admin console with clear roles."),
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
      "ملفات وسياسات وأدلة وإجراءات قابلة للإدارة من لوحة التحكم.",
      "Files, policies, guides, and procedures managed from the admin panel."
    ),
    category: tx("مراجع", "Resources"),
    icon: "Library",
    path: "/knowledge",
    audience: "all"
  },
  {
    id: "admin-path",
    title: tx("لوحة التحكم", "Admin Console"),
    description: tx(
      "إدارة المحتوى والرسائل والصلاحيات عبر تسجيل دخول Supabase.",
      "Manage content, messages, and roles through Supabase authentication."
    ),
    category: tx("إدارة", "Admin"),
    icon: "ShieldCheck",
    path: "/admin",
    audience: "admin"
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
      "معلومات عامة عن خدمات المختبر والتعليمات التي يمكن اعتمادها ونشرها من الإدارة.",
      "General laboratory information and publishable instructions managed by admins."
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
      "مساحة لنشر إرشادات الصيدلية المعتمدة وروابط الخدمات الرسمية عند توفرها.",
      "A place for approved pharmacy instructions and official service links when available."
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
      "تعريف بالخدمات الداعمة للمستفيد والموظف حسب ما تعتمده الإدارة.",
      "Support service information for beneficiaries and staff as approved."
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
      "مكتبة منظمة للسياسات والإجراءات، مع صلاحيات نشر وتحميل من لوحة التحكم.",
      "A structured policy and procedure library with admin publishing controls."
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
      "يضاف الرابط الرسمي من لوحة التحكم بعد اعتماده.",
      "The official link is added from the admin panel after approval."
    ),
    category: tx("خدمات وطنية", "National Services"),
    icon: "ExternalLink"
  },
  {
    id: "seha",
    title: tx("منصة صحة", "Seha Platform"),
    description: tx(
      "مساحة جاهزة للرابط المعتمد ولا تعرض رابطًا افتراضيًا.",
      "A prepared slot for the approved link; no default public URL is shown."
    ),
    category: tx("خدمات وطنية", "National Services"),
    icon: "ExternalLink"
  },
  {
    id: "forms",
    title: tx("النماذج الإدارية", "Administrative Forms"),
    description: tx(
      "نماذج قابلة للرفع والتصنيف والبحث من لوحة التحكم.",
      "Forms can be uploaded, categorized, and searched from the admin panel."
    ),
    category: tx("نماذج", "Forms"),
    icon: "ClipboardList"
  },
  {
    id: "surveys",
    title: tx("الاستبيانات و QR", "Surveys & QR"),
    description: tx(
      "روابط الاستبيانات و QR تظهر بعد اعتمادها من الإدارة.",
      "Survey and QR links appear after admin approval."
    ),
    category: tx("تجربة المستفيد", "Experience"),
    icon: "QrCode"
  }
];

export const newsItems: PortalItem[] = [
  {
    id: "portal-ready",
    title: tx("مساحة أخبار قابلة للإدارة", "Manageable News Area"),
    description: tx(
      "تظهر الأخبار الرسمية هنا بعد نشرها من لوحة التحكم. هذا المحتوى مبدئي وآمن للمعاينة.",
      "Official news appears here after publishing from the admin panel. This is safe preview content."
    ),
    category: tx("إعلان", "Announcement"),
    icon: "Newspaper",
    badge: tx("قابل للتعديل", "Editable"),
    updatedAt: "2026-07-09"
  }
];

export const initiatives: PortalItem[] = [
  {
    id: "innovation",
    title: tx("إرسال مبادرة", "Submit an Initiative"),
    description: tx(
      "نموذج لاستقبال المبادرات وتحويلها إلى مراجعة إدارية بدون نشرها للعامة تلقائيًا.",
      "A form for initiative submissions that go to admin review before publication."
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
      "روابط داخلية يضيفها المسؤول عند اعتمادها؛ لا توجد روابط وهمية.",
      "Internal links are added by admins after approval; no fake links are shown."
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
      "نماذج إدارية قابلة للتحميل بعد رفعها واعتمادها.",
      "Administrative forms become downloadable after upload and approval."
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
      "استخدم صفحة الخدمات أو البحث العام. روابط الحجز الرسمية تضاف فقط بعد اعتمادها.",
      "Use the services page or global search. Official booking links are added only after approval."
    ),
    category: tx("الخدمات", "Services"),
    icon: "CircleHelp"
  },
  {
    id: "faq-contact",
    title: tx("لماذا لا تظهر أرقام التواصل؟", "Why are contact numbers not shown?"),
    description: tx(
      "لن يتم عرض أي رقم أو بريد حتى يتم إدخاله واعتماده من إعدادات لوحة التحكم.",
      "No phone or email is shown until it is entered and approved in admin settings."
    ),
    category: tx("التواصل", "Contact"),
    icon: "CircleHelp"
  },
  {
    id: "faq-admin",
    title: tx("كيف يتم إنشاء أول مدير؟", "How is the first admin created?"),
    description: tx(
      "يتم إنشاء المستخدم من Supabase Auth ثم تعيين role = super_admin في جدول profiles حسب دليل الإعداد.",
      "Create the user in Supabase Auth, then set role = super_admin in profiles as documented."
    ),
    category: tx("الإدارة", "Admin"),
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
