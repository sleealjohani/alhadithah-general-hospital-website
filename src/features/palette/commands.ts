import type { LocalizedText } from "../../types";
import { tx } from "../../utils/i18n";

export type PaletteCommand = {
  id: string;
  label: LocalizedText;
  hint?: LocalizedText;
  group: "pages" | "actions";
  /** Route to navigate to, or a named action handled by the palette. */
  to?: string;
  action?: "toggle-theme" | "toggle-locale" | "toggle-contrast";
};

export const paletteCommands: PaletteCommand[] = [
  { id: "home", group: "pages", to: "/", label: tx("الصفحة الرئيسية", "Home") },
  { id: "about", group: "pages", to: "/about", label: tx("عن المستشفى", "About the hospital") },
  { id: "services", group: "pages", to: "/services", label: tx("الخدمات", "Services") },
  { id: "departments", group: "pages", to: "/departments", label: tx("الأقسام", "Departments") },
  { id: "knowledge", group: "pages", to: "/knowledge", label: tx("مركز المعرفة", "Knowledge center") },
  { id: "links", group: "pages", to: "/links", label: tx("الروابط", "Links") },
  { id: "news", group: "pages", to: "/news", label: tx("الأخبار", "News") },
  { id: "initiatives", group: "pages", to: "/initiatives", label: tx("المبادرات", "Initiatives") },
  { id: "experience", group: "pages", to: "/experience", label: tx("تجربة المريض", "Patient experience") },
  { id: "quality", group: "pages", to: "/quality", label: tx("الجودة وسلامة المرضى", "Quality & patient safety") },
  { id: "nursing", group: "pages", to: "/nursing", label: tx("التمريض", "Nursing") },
  { id: "reports", group: "pages", to: "/reports", label: tx("التقارير", "Reports") },
  { id: "employees", group: "pages", to: "/employees", label: tx("دليل الموظفين", "Employee directory") },
  { id: "contact", group: "pages", to: "/contact", label: tx("تواصل معنا", "Contact us") },
  { id: "faq", group: "pages", to: "/faq", label: tx("الأسئلة الشائعة", "FAQ") },
  { id: "admin", group: "pages", to: "/admin", label: tx("دخول الموظفين", "Staff access") },
  {
    id: "theme",
    group: "actions",
    action: "toggle-theme",
    label: tx("تبديل الوضع الليلي/النهاري", "Toggle dark/light theme")
  },
  {
    id: "locale",
    group: "actions",
    action: "toggle-locale",
    label: tx("تبديل اللغة", "Switch language")
  },
  {
    id: "contrast",
    group: "actions",
    action: "toggle-contrast",
    label: tx("تبديل التباين العالي", "Toggle high contrast")
  }
];

/** Rank: word-start match beats substring; matches in either language count. */
export function scoreCommand(command: PaletteCommand, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  let best = -1;
  for (const text of [command.label.ar, command.label.en]) {
    const value = text.toLowerCase();
    if (value.startsWith(q)) best = Math.max(best, 3);
    else if (value.split(/\s+/).some((word) => word.startsWith(q))) best = Math.max(best, 2);
    else if (value.includes(q)) best = Math.max(best, 1);
  }
  return best;
}
