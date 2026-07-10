import { useState } from "react";
import { Search } from "lucide-react";
import { usePortal } from "../../../providers/PortalProvider";
import { PageHero } from "../../../components/ui/PageHero";
import { ContentGrid } from "../../../components/ui/ContentGrid";
import { usePublishedItems } from "../../../hooks/usePublishedItems";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { tx } from "../../../utils/i18n";
import type { LocalizedText, PortalItem } from "../../../types";

export function DirectoryPage({
  table,
  fallback,
  eyebrow,
  title,
  description
}: {
  table: string;
  fallback: PortalItem[];
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
}) {
  const { t } = usePortal();
  usePageMeta(title, description);
  const items = usePublishedItems(table, fallback);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = Array.from(new Set(items.map((item) => t(item.category))));
  const filtered = items.filter((item) => {
    const haystack = `${t(item.title)} ${t(item.description)} ${t(item.category)}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesCategory = category === "all" || t(item.category) === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={description} compact />
      <section className="section">
        <div className="container">
          <div className="directory-tools">
            <label className="search-field">
              <Search size={19} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t(tx("ابحث في المحتوى", "Search content"))}
              />
            </label>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">{t(tx("كل التصنيفات", "All categories"))}</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <ContentGrid
            items={filtered}
            emptyAction={
              query || category !== "all" ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setQuery("");
                    setCategory("all");
                  }}
                >
                  {t(tx("مسح عوامل التصفية", "Clear filters"))}
                </button>
              ) : undefined
            }
          />
        </div>
      </section>
    </>
  );
}
