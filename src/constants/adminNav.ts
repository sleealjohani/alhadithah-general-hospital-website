import { tx } from "../utils/i18n";

export const adminNav = [
  { path: "/admin", label: tx("المؤشرات", "Dashboard"), icon: "LayoutDashboard" },
  { path: "/admin/content", label: tx("المحتوى", "Content"), icon: "TableProperties" },
  { path: "/admin/submissions", label: tx("الرسائل", "Submissions"), icon: "MessageSquareText" },
  { path: "/admin/tools", label: tx("QR والتصدير", "QR & Export"), icon: "QrCode" },
  { path: "/admin/settings", label: tx("الإعدادات", "Settings"), icon: "Settings" },
  { path: "/admin/setup", label: tx("دليل الإعداد", "Setup Guide"), icon: "UserCog" }
];
