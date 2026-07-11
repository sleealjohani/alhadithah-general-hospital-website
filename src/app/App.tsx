import { BrowserRouter } from "react-router-dom";
import { PortalProvider } from "../providers/PortalProvider";
import { AuthProvider } from "../features/auth/AuthContext";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { ScrollToTop } from "../components/layout/ScrollToTop";
import { ScrollProgress } from "../components/motion/ScrollProgress";
import { PaletteHost } from "../features/palette/PaletteHost";
import { AppRoutes } from "./routes";

export function App() {
  useScrollReveal();
  return (
    <ErrorBoundary>
      <PortalProvider>
        <AuthProvider>
          <BrowserRouter>
            <ScrollProgress />
            <ScrollToTop />
            <PaletteHost />
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </PortalProvider>
    </ErrorBoundary>
  );
}
