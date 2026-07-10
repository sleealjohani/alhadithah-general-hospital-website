import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronRight, ChevronLeft, Download, Search, Trash2 } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { supabase } from "../../lib/supabase/client";
import { logAdminAction } from "../../lib/audit";
import { readLocalSubmissions } from "../../lib/forms";
import { exportRowsToExcel } from "../../lib/exports";
import { displayRowValue } from "../../utils/format";
import { tx } from "../../utils/i18n";
import type { FormKind, LocalizedText } from "../../types";

const PAGE_SIZE = 20;
const STATUSES = ["new", "in_review", "closed", "archived"] as const;
type SubmissionStatus = (typeof STATUSES)[number];
type Row = Record<string, unknown> & { id: string; status?: string };

const TABS: Array<{ kind: FormKind; label: LocalizedText; table: string }> = [
  { kind: "contact", label: tx("رسائل التواصل", "Contact"), table: "contact_messages" },
  { kind: "experience", label: tx("تجربة المستفيد", "Experience"), table: "experience_feedback" },
  { kind: "initiative", label: tx("المبادرات", "Initiatives"), table: "initiative_submissions" },
  { kind: "good_catch", label: tx("Good Catch", "Good Catch"), table: "good_catch_reports" }
];

const STATUS_LABELS: Record<SubmissionStatus, LocalizedText> = {
  new: tx("جديد", "New"),
  in_review: tx("قيد المراجعة", "In review"),
  closed: tx("مغلق", "Closed"),
  archived: tx("مؤرشف", "Archived")
};

export function AdminSubmissions() {
  const { t, notify } = usePortal();

  /* Tab, status filter, search, sort, and page all live in the URL, so a
     filtered view can be bookmarked or shared with a colleague. */
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.find((item) => item.kind === searchParams.get("tab")) ?? TABS[0];
  const statusFilter = searchParams.get("status") ?? "all";
  const query = searchParams.get("q") ?? "";
  const sortDesc = searchParams.get("sort") !== "oldest";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || (key === "page" && value === "1")) next.delete(key);
        else next.set(key, value);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  /* Debounced search input that writes through to the URL. */
  const [searchDraft, setSearchDraft] = useState(query);
  useEffect(() => setSearchDraft(query), [query]);
  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchDraft !== query) setParams({ q: searchDraft, page: null });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchDraft, query, setParams]);

  const load = useCallback(async () => {
    if (!supabase) {
      setRows(readLocalSubmissions(tab.kind) as Row[]);
      setTotal(0);
      setState("ready");
      return;
    }
    setState("loading");
    let request = supabase.from(tab.table).select("*", { count: "exact" });
    if (statusFilter !== "all") request = request.eq("status", statusFilter);
    if (query.trim()) {
      const term = `%${query.trim().replace(/%/g, "")}%`;
      request = request.or(`subject.ilike.${term},name.ilike.${term},message.ilike.${term},email.ilike.${term}`);
    }
    const from = (page - 1) * PAGE_SIZE;
    const { data, error, count } = await request
      .order("created_at", { ascending: !sortDesc })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      setState("error");
      return;
    }
    setRows((data || []) as Row[]);
    setTotal(count ?? 0);
    setState("ready");
    setSelected(new Set());
  }, [tab.kind, tab.table, statusFilter, query, sortDesc, page]);

  useEffect(() => {
    load();
  }, [load, attempt]);

  /* Live feed: new submissions on the open tab appear without a refresh. */
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel(`submissions-${tab.table}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: tab.table }, (payload) => {
        const row = payload.new as Row;
        notify(t(tx("وصلت رسالة جديدة.", "A new submission arrived.")), "info");
        if (page === 1 && sortDesc && statusFilter === "all" && !query) {
          setRows((current) => [row, ...current].slice(0, PAGE_SIZE));
          setTotal((current) => current + 1);
        }
      })
      .subscribe();
    return () => {
      supabase?.removeChannel(channel);
    };
  }, [tab.table, page, sortDesc, statusFilter, query, notify, t]);

  /* Optimistic status change with rollback. */
  const updateStatus = async (id: string, status: SubmissionStatus) => {
    const previous = rows;
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)));
    if (!supabase) return;
    const { error } = await supabase.from(tab.table).update({ status }).eq("id", id);
    if (error) {
      setRows(previous);
      notify(error.message, "error");
      return;
    }
    logAdminAction("submission.status", tab.table, id, { status });
  };

  const bulkDelete = async () => {
    setConfirming(false);
    const ids = Array.from(selected);
    const previous = rows;
    setRows((current) => current.filter((row) => !selected.has(row.id)));
    setSelected(new Set());
    if (!supabase) return;
    const { error } = await supabase.from(tab.table).delete().in("id", ids);
    if (error) {
      setRows(previous);
      notify(error.message, "error");
      return;
    }
    setTotal((current) => current - ids.length);
    logAdminAction("submission.bulk_delete", tab.table, null, { ids });
    notify(t(tx("تم حذف العناصر المحددة.", "Selected items deleted.")), "success");
  };

  /* j/k moves the active row, Enter expands it, Esc collapses, x selects. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)
        return;
      const index = rows.findIndex((row) => row.id === activeId);
      switch (event.key) {
        case "j":
          setActiveId(rows[Math.min(index + 1, rows.length - 1)]?.id ?? null);
          break;
        case "k":
          setActiveId(rows[Math.max(index - 1, 0)]?.id ?? null);
          break;
        case "Enter":
          if (activeId) setExpandedId((current) => (current === activeId ? null : activeId));
          break;
        case "Escape":
          setExpandedId(null);
          break;
        case "x":
          if (activeId) {
            setSelected((current) => {
              const next = new Set(current);
              if (next.has(activeId)) next.delete(activeId);
              else next.add(activeId);
              return next;
            });
          }
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rows, activeId]);

  useEffect(() => {
    if (!activeId) return;
    listRef.current
      ?.querySelector(`[data-row-id="${activeId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allVisibleSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));
  const deleteChallenge = useMemo(() => tab.table.replace(/_/g, "-"), [tab.table]);

  return (
    <div className="admin-page">
      <SectionHeading title={tx("الرسائل والطلبات", "Submissions")} />
      <div className="admin-panel">
        <div className="tab-row" role="tablist">
          {TABS.map((item) => (
            <button
              className={tab.kind === item.kind ? "is-active" : ""}
              role="tab"
              aria-selected={tab.kind === item.kind}
              key={item.kind}
              onClick={() => setParams({ tab: item.kind === "contact" ? null : item.kind, page: null, status: null, q: null })}
            >
              {t(item.label)}
            </button>
          ))}
        </div>

        <div className="admin-toolbar">
          <label className="search-field">
            <Search size={17} />
            <input
              ref={searchRef}
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder={t(tx("ابحث في الموضوع أو الاسم أو الرسالة", "Search subject, name, or message"))}
            />
          </label>
          <select
            value={statusFilter}
            aria-label={t(tx("تصفية بالحالة", "Filter by status"))}
            onChange={(event) => setParams({ status: event.target.value === "all" ? null : event.target.value, page: null })}
          >
            <option value="all">{t(tx("كل الحالات", "All statuses"))}</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(STATUS_LABELS[status])}
              </option>
            ))}
          </select>
          <select
            value={sortDesc ? "newest" : "oldest"}
            aria-label={t(tx("الترتيب", "Sort"))}
            onChange={(event) => setParams({ sort: event.target.value === "oldest" ? "oldest" : null, page: null })}
          >
            <option value="newest">{t(tx("الأحدث أولًا", "Newest first"))}</option>
            <option value="oldest">{t(tx("الأقدم أولًا", "Oldest first"))}</option>
          </select>
          <button
            className="btn btn-secondary"
            onClick={() => exportRowsToExcel(`${tab.table}-export`, rows)}
            disabled={rows.length === 0}
          >
            <Download size={18} />
            {t(tx("تصدير CSV", "Export CSV"))}
          </button>
        </div>

        {selected.size > 0 ? (
          <div className="bulk-bar" role="toolbar" aria-label={t(tx("إجراءات جماعية", "Bulk actions"))}>
            <span>
              {selected.size} {t(tx("محدد", "selected"))}
            </span>
            <select
              defaultValue=""
              aria-label={t(tx("تغيير الحالة للمحدد", "Set status for selected"))}
              onChange={(event) => {
                const status = event.target.value as SubmissionStatus;
                if (!status) return;
                selected.forEach((id) => updateStatus(id, status));
                logAdminAction("submission.bulk_status", tab.table, null, {
                  ids: Array.from(selected),
                  status
                });
                event.target.value = "";
              }}
            >
              <option value="" disabled>
                {t(tx("تغيير الحالة…", "Set status…"))}
              </option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(STATUS_LABELS[status])}
                </option>
              ))}
            </select>
            <button className="btn btn-danger" onClick={() => setConfirming(true)}>
              <Trash2 size={16} />
              {t(tx("حذف المحدد", "Delete selected"))}
            </button>
          </div>
        ) : null}

        {state === "error" ? (
          <ErrorState
            title={t(tx("تعذر تحميل الرسائل", "Couldn't load submissions"))}
            retryLabel={t(tx("إعادة المحاولة", "Try again"))}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : state === "loading" ? (
          <div className="submission-list" aria-busy="true">
            {Array.from({ length: 5 }, (_, i) => (
              <div className="skeleton skeleton-block" key={i} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title={t(tx("لا توجد رسائل.", "No submissions."))}
            description={
              query || statusFilter !== "all"
                ? t(tx("جرّب تعديل عوامل التصفية.", "Try adjusting the filters."))
                : undefined
            }
            action={
              query || statusFilter !== "all" ? (
                <button className="btn btn-secondary" onClick={() => setParams({ q: null, status: null, page: null })}>
                  {t(tx("مسح عوامل التصفية", "Clear filters"))}
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="submission-list" ref={listRef}>
            <label className="select-all">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={(event) =>
                  setSelected(event.target.checked ? new Set(rows.map((row) => row.id)) : new Set())
                }
              />
              {t(tx("تحديد الكل في هذه الصفحة", "Select all on this page"))}
            </label>
            {rows.map((row) => (
              <article
                className={`submission-card ${activeId === row.id ? "is-active" : ""}`}
                data-row-id={row.id}
                key={row.id}
                onClick={() => setActiveId(row.id)}
              >
                <div className="submission-head">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    aria-label={t(tx("تحديد", "Select"))}
                    onChange={(event) =>
                      setSelected((current) => {
                        const next = new Set(current);
                        if (event.target.checked) next.add(row.id);
                        else next.delete(row.id);
                        return next;
                      })
                    }
                  />
                  <button
                    type="button"
                    className="submission-title"
                    onClick={() => setExpandedId((current) => (current === row.id ? null : row.id))}
                    aria-expanded={expandedId === row.id}
                  >
                    {displayRowValue(row, ["subject", "title", "name", "id"], "-")}
                  </button>
                  <select
                    value={(row.status as string) || "new"}
                    aria-label={t(tx("الحالة", "Status"))}
                    onChange={(event) => updateStatus(row.id, event.target.value as SubmissionStatus)}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {t(STATUS_LABELS[status])}
                      </option>
                    ))}
                  </select>
                </div>
                <p className={expandedId === row.id ? "is-expanded" : ""}>
                  {displayRowValue(row, ["message", "expectedImpact", "category"])}
                </p>
                {expandedId === row.id ? (
                  <dl className="submission-details">
                    {["name", "email", "phone", "category", "department", "location", "created_at"].map((key) =>
                      row[key] ? (
                        <div key={key}>
                          <dt>{key}</dt>
                          <dd dir="auto">{String(row[key])}</dd>
                        </div>
                      ) : null
                    )}
                  </dl>
                ) : null}
              </article>
            ))}
          </div>
        )}

        {pageCount > 1 ? (
          <nav className="pagination" aria-label={t(tx("تنقل بين الصفحات", "Pagination"))}>
            <button
              className="icon-button"
              disabled={page <= 1}
              aria-label={t(tx("الصفحة السابقة", "Previous page"))}
              onClick={() => setParams({ page: String(page - 1) })}
            >
              <ChevronRight className="rtl-only" size={17} />
              <ChevronLeft className="ltr-only" size={17} />
            </button>
            <span>
              {page} / {pageCount}
            </span>
            <button
              className="icon-button"
              disabled={page >= pageCount}
              aria-label={t(tx("الصفحة التالية", "Next page"))}
              onClick={() => setParams({ page: String(page + 1) })}
            >
              <ChevronLeft className="rtl-only" size={17} />
              <ChevronRight className="ltr-only" size={17} />
            </button>
          </nav>
        ) : null}

        <p className="keyboard-hint muted">
          {t(
            tx(
              "اختصارات: j/k للتنقل، Enter للتفاصيل، x للتحديد",
              "Shortcuts: j/k to move, Enter for details, x to select"
            )
          )}
        </p>
      </div>

      {confirming ? (
        <ConfirmDialog
          danger
          title={t(tx("حذف نهائي", "Permanent deletion"))}
          description={t(
            tx(
              `سيتم حذف ${selected.size} من العناصر نهائيًا ولا يمكن التراجع.`,
              `${selected.size} item(s) will be permanently deleted. This cannot be undone.`
            )
          )}
          confirmLabel={t(tx("حذف نهائيًا", "Delete permanently"))}
          challenge={deleteChallenge}
          onConfirm={bulkDelete}
          onCancel={() => setConfirming(false)}
        />
      ) : null}
    </div>
  );
}
