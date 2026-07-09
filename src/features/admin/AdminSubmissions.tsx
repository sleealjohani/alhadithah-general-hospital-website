import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { readLocalSubmissions } from "../../lib/forms";
import { exportRowsToExcel } from "../../lib/exports";
import { displayRowValue } from "../../utils/format";
import { tx } from "../../utils/i18n";
import type { FormKind, LocalizedText } from "../../types";

export function AdminSubmissions() {
  const { t, notify } = usePortal();
  const tabs: Array<{ kind: FormKind; label: LocalizedText; table: string }> = [
    { kind: "contact", label: tx("رسائل التواصل", "Contact"), table: "contact_messages" },
    { kind: "experience", label: tx("تجربة المستفيد", "Experience"), table: "experience_feedback" },
    { kind: "initiative", label: tx("المبادرات", "Initiatives"), table: "initiative_submissions" },
    { kind: "good_catch", label: tx("Good Catch", "Good Catch"), table: "good_catch_reports" }
  ];
  const [tab, setTab] = useState(tabs[0]);
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setRows(readLocalSubmissions(tab.kind));
        return;
      }
      const { data, error } = await supabase.from(tab.table).select("*").order("created_at", { ascending: false });
      if (error) {
        notify(error.message, "error");
        setRows(readLocalSubmissions(tab.kind));
        return;
      }
      setRows((data || []) as Array<Record<string, unknown>>);
    }
    load();
  }, [notify, tab]);

  return (
    <div className="admin-page">
      <SectionHeading title={tx("الرسائل والطلبات", "Submissions")} />
      <div className="admin-panel">
        <div className="tab-row">
          {tabs.map((item) => (
            <button
              className={tab.kind === item.kind ? "is-active" : ""}
              key={item.kind}
              onClick={() => setTab(item)}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => exportRowsToExcel(`${tab.table}-export`, rows)}
          disabled={rows.length === 0}
        >
          <Download size={18} />
          {t(tx("تصدير CSV متوافق مع Excel", "Export Excel-compatible CSV"))}
        </button>
        <div className="submission-list">
          {rows.map((row) => (
            <article className="submission-card" key={String(row.id)}>
              <strong>{displayRowValue(row, ["subject", "title", "name", "id"], "-")}</strong>
              <p>{displayRowValue(row, ["message", "expectedImpact", "category"])}</p>
              <span>{displayRowValue(row, ["status"], "new")}</span>
            </article>
          ))}
          {rows.length === 0 ? <p className="empty-state">{t(tx("لا توجد رسائل.", "No submissions."))}</p> : null}
        </div>
      </div>
    </div>
  );
}
