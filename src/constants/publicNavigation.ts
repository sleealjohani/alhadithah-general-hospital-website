import type { NavMenuItem } from "../types";
import { tx } from "../utils/i18n";

export type DefaultHeaderNavigationItem = {
  label_ar: string;
  label_en: string;
  path: string;
  icon: string;
  sort_order: number;
};

export const defaultHeaderNavigationItems: DefaultHeaderNavigationItem[] = [
  { label_ar: "الرئيسية", label_en: "Home", path: "/", icon: "Home", sort_order: 10 },
  { label_ar: "عن المستشفى", label_en: "About", path: "/about", icon: "FileText", sort_order: 20 },
  { label_ar: "الخدمات", label_en: "Services", path: "/services", icon: "HeartPulse", sort_order: 30 },
  { label_ar: "الأقسام", label_en: "Departments", path: "/departments", icon: "Building2", sort_order: 40 },
  { label_ar: "مركز المعرفة", label_en: "Knowledge", path: "/knowledge", icon: "Library", sort_order: 50 },
  { label_ar: "النماذج والروابط", label_en: "Forms & Links", path: "/links", icon: "ClipboardList", sort_order: 60 },
  { label_ar: "الأخبار", label_en: "News", path: "/news", icon: "Newspaper", sort_order: 70 },
  { label_ar: "المبادرات", label_en: "Initiatives", path: "/initiatives", icon: "Lightbulb", sort_order: 80 },
  { label_ar: "تجربة المستفيد", label_en: "Patient Experience", path: "/experience", icon: "MessageSquareText", sort_order: 90 },
  { label_ar: "الجودة وسلامة المرضى", label_en: "Quality & Patient Safety", path: "/quality", icon: "ShieldCheck", sort_order: 100 },
  { label_ar: "التمريض", label_en: "Nursing", path: "/nursing", icon: "BadgePlus", sort_order: 110 },
  { label_ar: "التقارير", label_en: "Reports", path: "/reports", icon: "BarChart3", sort_order: 120 },
  { label_ar: "دليل الموظفين", label_en: "Employee Directory", path: "/employees", icon: "UserRound", sort_order: 130 },
  { label_ar: "تواصل معنا", label_en: "Contact", path: "/contact", icon: "Send", sort_order: 140 },
  { label_ar: "الأسئلة الشائعة", label_en: "FAQ", path: "/faq", icon: "CircleHelp", sort_order: 150 }
];

export const defaultHeaderNavigationMenu: NavMenuItem[] = defaultHeaderNavigationItems.map((item) => ({
  path: item.path,
  label: tx(item.label_ar, item.label_en),
  icon: item.icon,
  sortOrder: item.sort_order
}));
