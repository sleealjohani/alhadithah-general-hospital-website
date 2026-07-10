import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/* Scroll positions per history entry, so back/forward lands where the
   visitor left off while fresh navigations start at the top. */
const positions = new Map<string, number>();

export function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const key = location.key;
    return () => {
      positions.set(key, window.scrollY);
    };
  }, [location.key]);

  useEffect(() => {
    if (navigationType === "POP") {
      window.scrollTo({ top: positions.get(location.key) ?? 0, behavior: "instant" });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [location.key, navigationType]);

  return null;
}
