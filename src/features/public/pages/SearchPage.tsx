import { useState } from "react";
import { Search } from "lucide-react";
import { usePortal } from "../../../providers/PortalProvider";
import { PageHero } from "../../../components/ui/PageHero";
import { ContentGrid } from "../../../components/ui/ContentGrid";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { allPublicContent } from "../../../data/content";
import { tx } from "../../../utils/i18n";

export function SearchPage() {
  const { t } = usePortal();
  usePageMeta(
    tx("بحث موحد داخل البوابة", "Unified Portal Search"),
    tx(
      "بحث سريع في المحتوى المبدئي، ويمكن ربطه ببيانات Supabase المنشورة.",
      "Fast search across starter content, ready to connect to published Supabase records."
    )
  );
  const [query, setQuery] = useState("");
  const results = allPublicContent.filter((item) => {
    const text = `${t(item.title)} ${t(item.description)} ${t(item.category)}`.toLowerCase();
    return query.trim() && text.includes(query.toLowerCase());
  });

  return (
    <>
      <PageHero
        eyebrow={tx("البحث", "Search")}
        title={tx("بحث موحد داخل البوابة", "Unified Portal Search")}
        description={tx(
          "بحث سريع في المحتوى المبدئي، ويمكن ربطه ببيانات Supabase المنشورة.",
          "Fast search across starter content, ready to connect to published Supabase records."
        )}
        compact
      />
      <section className="section">
        <div className="container">
          <label className="search-field search-field-large">
            <Search size={22} />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(tx("اكتب كلمة للبحث", "Type a search term"))}
            />
          </label>
          <ContentGrid items={results} />
        </div>
      </section>
    </>
  );
}
