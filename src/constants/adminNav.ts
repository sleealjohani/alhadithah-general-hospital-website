import { tx } from "../utils/i18n";

export const adminNav = [
  { path: "/admin", label: tx("المؤشرات", "Dashboard"), icon: "LayoutDashboard" },
  { path: "/admin/content", label: tx("المحتوى", "Content"), icon: "TableProperties" },
  { path: "/admin/pages", label: tx("الصفحات", "Pages"), icon: "FileText" },
  { path: "/admin/navigation", label: tx("قائمة التنقل", "Navigation"), icon: "ListChecks" },
  { path: "/admin/homepage", label: tx("أقسام الرئيسية", "Homepage Sections"), icon: "Home" },
  { path: "/admin/doctors", label: tx("الأطباء", "Doctors"), icon: "Stethoscope" },
  { path: "/admin/media", label: tx("مكتبة الوسائط", "Media Library"), icon: "Images" },
  { path: "/admin/submissions", label: tx("الرسائل", "Submissions"), icon: "MessageSquareText" },
  { path: "/admin/tools", label: tx("QR والتصدير", "QR & Export"), icon: "QrCode" },
  { path: "/admin/settings", label: tx("الإعدادات", "Settings"), icon: "Settings" },
  { path: "/admin/setup", label: tx("دليل الإعداد", "Setup Guide"), icon: "UserCog" }
];
