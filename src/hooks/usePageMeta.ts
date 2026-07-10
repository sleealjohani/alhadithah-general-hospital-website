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
    const fullTitle = resolvedTitle ? `${resolvedTitle} | ${siteName}` : DEFAULT_TITLE;
    document.title = fullTitle;

    const setMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, key);
        document.head.appendChild(meta);
      }
      const previous = meta.getAttribute("content");
      meta.setAttribute("content", content);
      return () => {
        if (previous !== null) meta.setAttribute("content", previous);
      };
    };

    const restores = [
      setMeta('meta[property="og:title"]', "property", "og:title", fullTitle),
      setMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle),
      setMeta('meta[property="og:url"]', "property", "og:url", window.location.href)
    ];
    if (resolvedDescription) {
      restores.push(
        setMeta('meta[name="description"]', "name", "description", resolvedDescription),
        setMeta('meta[property="og:description"]', "property", "og:description", resolvedDescription),
        setMeta('meta[name="twitter:description"]', "name", "twitter:description", resolvedDescription)
      );
    }

    return () => {
      document.title = DEFAULT_TITLE;
      restores.forEach((restore) => restore());
    };
  }, [resolvedTitle, resolvedDescription, siteName]);
}
