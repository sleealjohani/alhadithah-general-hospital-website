import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { usePortal } from "../../../providers/PortalProvider";
import { PageHero } from "../../../components/ui/PageHero";
import { SkeletonPage } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { fetchPageBySlug, type CmsPageRow } from "../../../lib/supabase/pages";
import { tx } from "../../../utils/i18n";
import { NotFoundContent } from "./NotFoundPage";

export function CmsPage() {
  const { slug = "" } = useParams();
  const { t } = usePortal();
  const [status, setStatus] = useState<"loading" | "found" | "missing" | "error">("loading");
  const [page, setPage] = useState<CmsPageRow | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setPage(null);
    fetchPageBySlug(slug).then((result) => {
      if (!active) return;
      if (result.status === "found") setPage(result.page);
      setStatus(result.status);
    });
    return () => {
      active = false;
    };
  }, [slug, attempt]);

  usePageMeta(
    page ? tx(page.seo_title_ar || page.title_ar, page.seo_title_en || page.title_en) : tx("", ""),
    page ? tx(page.seo_description_ar || page.excerpt_ar || "", page.seo_description_en || page.excerpt_en || "") : undefined
  );

  if (status === "loading") {
    return <SkeletonPage />;
  }

  if (status === "error") {
    return (
      <section className="section">
        <div className="container">
          <ErrorState
            title={t(tx("تعذر تحميل الصفحة", "The page couldn't be loaded"))}
            description={t(
              tx("تحقق من اتصالك بالإنترنت ثم أعد المحاولة.", "Check your connection and try again.")
            )}
            retryLabel={t(tx("إعادة المحاولة", "Try again"))}
            onRetry={retry}
          />
        </div>
      </section>
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
          {page.og_image_url ? (
            <img className="cms-hero-image" src={page.og_image_url} alt="" loading="lazy" />
          ) : null}
          <article className="rich-panel" style={{ whiteSpace: "pre-wrap" }}>
            {t(tx(page.content_ar || "", page.content_en || ""))}
          </article>
        </div>
      </section>
    </>
  );
}
