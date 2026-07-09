import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { usePortal } from "../../../providers/PortalProvider";
import { PageHero } from "../../../components/ui/PageHero";
import { fetchPageBySlug, type CmsPageRow } from "../../../lib/supabase/pages";
import { tx } from "../../../utils/i18n";
import { NotFoundContent } from "./NotFoundPage";

const DEFAULT_TITLE = "مستشفى الحديثة العام | Hadetha General Hospital";

export function CmsPage() {
  const { slug = "" } = useParams();
  const { t, locale } = usePortal();
  const [status, setStatus] = useState<"loading" | "found" | "missing">("loading");
  const [page, setPage] = useState<CmsPageRow | null>(null);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setPage(null);
    fetchPageBySlug(slug).then((row) => {
      if (!active) return;
      if (row) {
        setPage(row);
        setStatus("found");
      } else {
        setStatus("missing");
      }
    });
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!page) return undefined;

    const seoTitle = locale === "ar" ? page.seo_title_ar || page.title_ar : page.seo_title_en || page.title_en;
    document.title = `${seoTitle} | ${locale === "ar" ? page.title_en : page.title_ar}`;

    const description = locale === "ar" ? page.seo_description_ar : page.seo_description_en;
    let meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.getAttribute("content") ?? null;
    if (description) {
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }

    return () => {
      document.title = DEFAULT_TITLE;
      if (meta && previousDescription !== null) meta.setAttribute("content", previousDescription);
    };
  }, [locale, page]);

  if (status === "loading") {
    return (
      <main className="loading-page">
        <Loader2 className="spin" />
      </main>
    );
  }

  if (status === "missing" || !page) {
    return <NotFoundContent />;
  }

  return (
    <>
      <PageHero
        eyebrow={tx("صفحة", "Page")}
        title={tx(page.title_ar, page.title_en)}
        description={tx(page.excerpt_ar || "", page.excerpt_en || "")}
        compact
      />
      <section className="section">
        <div className="container">
          <article className="rich-panel" style={{ whiteSpace: "pre-wrap" }}>
            {t(tx(page.content_ar || "", page.content_en || ""))}
          </article>
        </div>
      </section>
    </>
  );
}
