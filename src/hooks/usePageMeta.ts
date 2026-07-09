import { useEffect } from "react";
import { usePortal } from "../providers/PortalProvider";
import { identity } from "../data/content";
import type { LocalizedText } from "../types";

const DEFAULT_TITLE = "مستشفى الحديثة العام | Hadetha General Hospital";

export function usePageMeta(title: LocalizedText, description?: LocalizedText) {
  const { t } = usePortal();
  const resolvedTitle = t(title);
  const resolvedDescription = description ? t(description) : undefined;
  const siteName = t(identity.name);

  useEffect(() => {
    document.title = resolvedTitle ? `${resolvedTitle} | ${siteName}` : DEFAULT_TITLE;

    let meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.getAttribute("content") ?? null;
    if (resolvedDescription) {
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", resolvedDescription);
    }

    return () => {
      document.title = DEFAULT_TITLE;
      if (meta && previousDescription !== null) meta.setAttribute("content", previousDescription);
    };
  }, [resolvedTitle, resolvedDescription, siteName]);
}
