export type Locale = "ar" | "en";

export type LocalizedText = {
  ar: string;
  en: string;
};

export type PortalItem = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  category: LocalizedText;
  icon: string;
  path?: string;
  url?: string;
  image?: string;
  badge?: LocalizedText;
  audience?: "public" | "employee" | "admin" | "all";
  status?: "published" | "draft";
  fileType?: string;
  updatedAt?: string;
};

export type FormKind = "contact" | "experience" | "initiative" | "good_catch";

export type Theme = "light" | "dark";

export type ToastTone = "success" | "error" | "info";

export type Toast = {
  id: string;
  tone: ToastTone;
  message: string;
};

export type AdminRole = "super_admin" | "admin" | "editor" | "reviewer" | "viewer";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AdminRole;
  status: "active" | "disabled";
  created_at: string;
};

export type NavMenuItem = {
  path?: string;
  url?: string;
  label: LocalizedText;
  icon?: string;
};

export type PublicContentRow = {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  category_ar: string | null;
  category_en: string | null;
  icon: string | null;
  url: string | null;
  path: string | null;
  status: string | null;
  sort_order: number | null;
  metadata: { image_url?: string } | null;
  created_at: string | null;
  updated_at: string | null;
};
