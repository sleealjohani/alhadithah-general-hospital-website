import { Route, Routes } from "react-router-dom";
import { PublicLayout } from "../components/layout/PublicLayout";
import { HomePage } from "../features/public/pages/HomePage";
import { AboutPage } from "../features/public/pages/AboutPage";
import { ServicesPage } from "../features/public/pages/ServicesPage";
import { DepartmentsPage } from "../features/public/pages/DepartmentsPage";
import { KnowledgePage } from "../features/public/pages/KnowledgePage";
import { LinksPage } from "../features/public/pages/LinksPage";
import { NewsPage } from "../features/public/pages/NewsPage";
import { InitiativesPage } from "../features/public/pages/InitiativesPage";
import { ExperiencePage } from "../features/public/pages/ExperiencePage";
import { QualityPage } from "../features/public/pages/QualityPage";
import { NursingPage } from "../features/public/pages/NursingPage";
import { ReportsPage } from "../features/public/pages/ReportsPage";
import { EmployeesPage } from "../features/public/pages/EmployeesPage";
import { ContactPage } from "../features/public/pages/ContactPage";
import { FaqPage } from "../features/public/pages/FaqPage";
import { SearchPage } from "../features/public/pages/SearchPage";
import { CmsPage } from "../features/public/pages/CmsPage";
import { NotFoundPage } from "../features/public/pages/NotFoundPage";
import { AdminLoginPage } from "../features/auth/AdminLoginPage";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { AdminLayout } from "../features/admin/AdminLayout";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/links" element={<LinksPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/initiatives" element={<InitiativesPage />} />
        <Route path="/experience" element={<ExperiencePage />} />
        <Route path="/quality" element={<QualityPage />} />
        <Route path="/nursing" element={<NursingPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/pages/:slug" element={<CmsPage />} />
      </Route>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
