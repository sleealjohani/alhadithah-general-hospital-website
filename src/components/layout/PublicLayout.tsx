import { lazy, Suspense, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useCardGlow } from "../../hooks/useCardGlow";

/* Lazy so the motion runtime never rides in the critical bundle — the
   progress bar is decorative chrome and can hydrate a beat later. */
const ScrollProgress = lazy(() =>
  import("../motion/ScrollProgress").then((m) => ({ default: m.ScrollProgress }))
);

export function PublicLayout({ children }: { children?: ReactNode }) {
  const location = useLocation();
  useCardGlow();

  return (
    <>
      <Suspense fallback={null}>
        <ScrollProgress />
      </Suspense>
      <Header />
      <main className="page-transition" id="main-content" key={location.pathname}>
        {children || <Outlet />}
      </main>
      <Footer />
    </>
  );
}
