import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { PublicLayout } from "../components/layout/PublicLayout";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { SkeletonPage } from "../components/ui/Skeleton";

const HomePage = lazy(() => import("../features/public/pages/HomePage").then((m) => ({ default: m.HomePage })));
const AboutPage = lazy(() => import("../features/public/pages/AboutPage").then((m) => ({ default: m.AboutPage })));
const ServicesPage = lazy(() => import("../features/public/pages/ServicesPage").then((m) => ({ default: m.ServicesPage })));
const DepartmentsPage = lazy(() => import("../features/public/pages/DepartmentsPage").then((m) => ({ default: m.DepartmentsPage })));
const KnowledgePage = lazy(() => import("../features/public/pages/KnowledgePage").then((m) => ({ default: m.KnowledgePage })));
const LinksPage = lazy(() => import("../features/public/pages/LinksPage").then((m) => ({ default: m.LinksPage })));
const NewsPage = lazy(() => import("../features/public/pages/NewsPage").then((m) => ({ default: m.NewsPage })));
const InitiativesPage = lazy(() => import("../features/public/pages/InitiativesPage").then((m) => ({ default: m.InitiativesPage })));
const ExperiencePage = lazy(() => import("../features/public/pages/ExperiencePage").then((m) => ({ default: m.ExperiencePage })));
const QualityPage = lazy(() => import("../features/public/pages/QualityPage").then((m) => ({ default: m.QualityPage })));
const NursingPage = lazy(() => import("../features/public/pages/NursingPage").then((m) => ({ default: m.NursingPage })));
const ReportsPage = lazy(() => import("../features/public/pages/ReportsPage").then((m) => ({ default: m.ReportsPage })));
const EmployeesPage = lazy(() => import("../features/public/pages/EmployeesPage").then((m) => ({ default: m.EmployeesPage })));
const ContactPage = lazy(() => import("../features/public/pages/ContactPage").then((m) => ({ default: m.ContactPage })));
const FaqPage = lazy(() => import("../features/public/pages/FaqPage").then((m) => ({ default: m.FaqPage })));
const SearchPage = lazy(() => import("../features/public/pages/SearchPage").then((m) => ({ default: m.SearchPage })));
const CmsPage = lazy(() => import("../features/public/pages/CmsPage").then((m) => ({ default: m.CmsPage })));
const NotFoundPage = lazy(() => import("../features/public/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

const AdminLoginPage = lazy(() => import("../features/auth/AdminLoginPage").then((m) => ({ default: m.AdminLoginPage })));
const AdminLayout = lazy(() => import("../features/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })));

export function AppRoutes() {
  return (
    <Suspense fallback={<SkeletonPage />}>
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
    </Suspense>
  );
}
