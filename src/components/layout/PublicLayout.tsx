import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AccessibilityPanel } from "./AccessibilityPanel";

export function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content">{children || <Outlet />}</main>
      <Footer />
      <AccessibilityPanel />
    </>
  );
}
