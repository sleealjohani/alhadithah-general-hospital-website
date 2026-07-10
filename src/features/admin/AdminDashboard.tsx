import { useEffect, useState } from "react";
import { usePortal } from "../../providers/PortalProvider";
import { Icon } from "../../components/ui/Icon";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { Skeleton } from "../../components/ui/Skeleton";
import { supabase } from "../../lib/supabase/client";
import { tx } from "../../utils/i18n";
import type { LocalizedText } from "../../types";

type Metric = { label: LocalizedText; value: number | string | null; icon: string };
type ActivityRow = { id: string; action: string; entity_table: string | null; created_at: string };

const SUBMISSION_TABLES = [
  "contact_messages",
  "experience_feedback",
  "initiative_submissions",
  "good_catch_reports"
];

async function countRows(table: string, filter?: { column: string; value: string }): Promise<number> {
  if (!supabase) return 0;
  let request = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) request = request.eq(filter.column, filter.value);
  const { count, error } = await request;
  if (error) throw error;
  return count ?? 0;
}

export function AdminDashboard() {
  const { t, locale } = usePortal();
  const [metrics, setMetrics] = useState<Metric[] | null>(null);
  const [activity, setActivity] = useState<ActivityRow[] | null>(null);

  /* Real numbers from real queries — head-only counts, so the dashboard
     stays cheap even as tables grow. */
  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase) {
        setMetrics([{ label: tx("مصدر البيانات", "Data source"), value: "Local", icon: "ShieldCheck" }]);
        setActivity([]);
        return;
      }
      try {
        const [newSubmissions, services, news, doctors, pages] = await Promise.all([
          Promise.all(
            SUBMISSION_TABLES.map((table) => countRows(table, { column: "status", value: "new" }))
          ).then((counts) => counts.reduce((sum, value) => sum + value, 0)),
          countRows("services", { column: "status", value: "published" }),
          countRows("news_posts", { column: "status", value: "published" }),
          countRows("doctors"),
          countRows("pages", { column: "status", value: "published" })
        ]);
        if (!active) return;
        setMetrics([
          { label: tx("رسائل جديدة", "New submissions"), value: newSubmissions, icon: "Inbox" },
          { label: tx("خدمات منشورة", "Published services"), value: services, icon: "Stethoscope" },
          { label: tx("أخبار منشورة", "Published news"), value: news, icon: "Newspaper" },
          { label: tx("الأطباء", "Doctors"), value: doctors, icon: "UserRound" },
          { label: tx("صفحات منشورة", "Published pages"), value: pages, icon: "FileText" }
        ]);
      } catch {
        if (active) setMetrics([]);
      }

      const { data } = await supabase
        .from("activity_logs")
        .select("id,action,entity_table,created_at")
        .order("created_at", { ascending: false })
        .limit(6);
      if (active) setActivity((data as ActivityRow[]) || []);
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="admin-page">
      <SectionHeading
        title={tx("لوحة المؤشرات", "Dashboard")}
        description={tx(
          "أرقام حية من قاعدة البيانات: الرسائل الجديدة والمحتوى المنشور.",
          "Live numbers from the database: new submissions and published content."
        )}
      />
      <div className="admin-metrics">
        {metrics === null
          ? Array.from({ length: 5 }, (_, i) => (
              <article className="admin-metric" key={i} aria-busy="true">
                <Skeleton variant="title" />
                <Skeleton variant="text" />
              </article>
            ))
          : metrics.map((metric) => (
              <article className="admin-metric" key={metric.label.en}>
                <Icon name={metric.icon} />
                <span>{t(metric.label)}</span>
                <strong>{metric.value}</strong>
              </article>
            ))}
      </div>
      <div className="admin-panel">
        <h2>{t(tx("آخر النشاطات الإدارية", "Recent admin activity"))}</h2>
        {activity === null ? (
          <Skeleton variant="block" />
        ) : activity.length === 0 ? (
          <p className="muted">{t(tx("لا يوجد نشاط مسجل بعد.", "No recorded activity yet."))}</p>
        ) : (
          <ul className="activity-list">
            {activity.map((row) => (
              <li key={row.id}>
                <code>{row.action}</code>
                <span>{row.entity_table}</span>
                <time dateTime={row.created_at}>
                  {new Date(row.created_at).toLocaleString(locale === "ar" ? "ar-SA" : "en-GB")}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
