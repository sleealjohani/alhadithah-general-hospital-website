import type { ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AccessibilityPanel } from "./AccessibilityPanel";

export function PublicLayout({ children }: { children?: ReactNode }) {
  const location = useLocation();

  return (
    <>
      <Header />
      <main className="page-transition" id="main-content" key={location.pathname}>
        {children || <Outlet />}
      </main>
      <Footer />
      <AccessibilityPanel />
    </>
  );
}
