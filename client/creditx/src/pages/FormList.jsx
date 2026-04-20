import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { formsApi } from "../api/forms.api";
import { useFormStore } from "../store/formStore";
import DocumentPreview from "../components/form/DocumentPreview";

const STATUS_OPTIONS = [
  { value: "",            label: "All statuses" },
  { value: "in-progress", label: "In progress" },
  { value: "completed",   label: "Completed" },
];

const STAGE_OPTIONS = [
  { value: "",  label: "All stages" },
  { value: "1", label: "1 — Basic Info" },
  { value: "2", label: "2 — Address" },
  { value: "3", label: "3 — Professional" },
  { value: "4", label: "4 — Documents" },
  { value: "5", label: "5 — Review" },
];

const STAGE_LABELS = {
  1: "Basic Info",
  2: "Address",
  3: "Professional",
  4: "Documents",
  5: "Review",
};

const useDebounced = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

const StatusPill = ({ status }) => {
  const cls =
    status === "completed"
      ? "bg-green-100 text-green-700 ring-1 ring-green-200"
      : "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "completed" ? "bg-green-500" : "bg-amber-500"}`} />
      {status === "completed" ? "Completed" : "In progress"}
    </span>
  );
};

const ProgressBar = ({ stage, status }) => {
  const pct =
    status === "completed"
      ? 100
      : Math.round(((Math.max(1, stage) - 1) / 4) * 100);
  return (
    <div className="w-full">
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            status === "completed" ? "bg-green-500" : "bg-blue-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-gray-500 mt-0.5 inline-block">{pct}%</span>
    </div>
  );
};

const TableSkeleton = () => (
  <>
    {Array.from({ length: 4 }).map((_, i) => (
      <tr key={i} className="border-t border-gray-100">
        {Array.from({ length: 6 }).map((__, j) => (
          <td key={j} className="px-4 py-4">
            <div className="h-3 bg-gray-100 rounded animate-pulse" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// ─────────────────────────────────────────────────────────────
// Detail drawer
// ─────────────────────────────────────────────────────────────
const Drawer = ({ open, onClose, formId }) => {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !formId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    formsApi
      .getFormById(formId)
      .then((res) => !cancelled && setForm(res))
      .catch((err) =>
        !cancelled && setError(err.response?.data?.message ?? "Failed to load"),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, formId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl overflow-y-auto">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-base font-semibold text-gray-900">Form Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            ×
          </button>
        </header>

        <div className="p-6 space-y-5 text-sm">
          {loading && <p className="text-gray-400">Loading…</p>}
          {error && <p className="text-red-600">{error}</p>}
          {form && (
            <>
              <div className="flex items-center gap-3">
                <StatusPill status={form.status} />
                <span className="text-xs text-gray-500">
                  Stage {form.currentStage} — {STAGE_LABELS[form.currentStage]}
                </span>
              </div>

              <Section title="Basic Information">
                <KV k="Full name"     v={form.basicInfo?.fullName} />
                <KV k="Email"         v={form.basicInfo?.email} />
                <KV k="Phone"         v={form.basicInfo?.phone} />
                <KV k="Date of birth" v={form.basicInfo?.dateOfBirth} />
                <KV k="Gender"        v={form.basicInfo?.gender} />
              </Section>

              <Section title="Address">
                <KV k="Street"      v={form.addressDetails?.street} />
                <KV k="Line 2"      v={form.addressDetails?.addressLine2} />
                <KV k="City"        v={form.addressDetails?.city} />
                <KV k="State"       v={form.addressDetails?.state} />
                <KV k="Postal code" v={form.addressDetails?.postalCode} />
                <KV k="Country"     v={form.addressDetails?.country} />
              </Section>

              <Section title="Professional">
                <KV k="Company"    v={form.professionalDetails?.companyName} />
                <KV k="Job title"  v={form.professionalDetails?.jobTitle} />
                <KV k="Experience" v={form.professionalDetails?.yearsOfExperience?.toString()} />
                <KV k="Skills"     v={form.professionalDetails?.skills?.join(", ")} />
                <KV k="LinkedIn"   v={form.professionalDetails?.linkedinUrl} />
                <KV k="Bio"        v={form.professionalDetails?.bio} />
              </Section>

              <Section title={`Documents (${form.documents?.length ?? 0})`}>
                {form.documents?.length ? (
                  <ul className="space-y-2">
                    {form.documents.map((d, i) => (
                      <li key={d.storedName ?? i}>
                        <DocumentPreview doc={d} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400">None</p>
                )}
              </Section>

              {form.reviewNotes && (
                <Section title="Review notes">
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                    {form.reviewNotes}
                  </p>
                </Section>
              )}

              <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                <div>Created: {form.createdAt ? new Date(form.createdAt).toLocaleString() : "—"}</div>
                <div>Updated: {form.updatedAt ? new Date(form.updatedAt).toLocaleString() : "—"}</div>
                {form.submittedAt && (
                  <div>Submitted: {new Date(form.submittedAt).toLocaleString()}</div>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div>
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
      {title}
    </h3>
    <div className="bg-gray-50 rounded-lg p-3 space-y-1">{children}</div>
  </div>
);

const KV = ({ k, v }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-4 py-0.5">
    <span className="text-[11px] sm:text-xs text-gray-500 shrink-0">{k}</span>
    <span className="text-xs text-gray-900 sm:text-right break-all">
      {v || <em className="text-gray-400">—</em>}
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Main list page
// ─────────────────────────────────────────────────────────────
export default function FormList() {
  const navigate = useNavigate();
  const hydrateFromServer = useFormStore((s) => s.hydrateFromServer);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState("");
  const [stage, setStage] = useState("");
  const [searchRaw, setSearchRaw] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedFormId, setSelectedFormId] = useState(null);

  const search = useDebounced(searchRaw, 300);

  const [result, setResult] = useState({ data: [], meta: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const query = useMemo(
    () => ({
      page,
      limit,
      ...(status ? { status } : {}),
      ...(stage  ? { stage  } : {}),
      ...(search ? { search } : {}),
      sortBy,
      sortOrder,
    }),
    [page, limit, status, stage, search, sortBy, sortOrder],
  );

  const fetchForms = () => {
    let cancelled = false;
    setLoading(true);
    setError("");
    formsApi
      .listForms(query)
      .then((res) => {
        if (cancelled) return;
        // Defensive: tolerate any shape the server throws at us.
        const data = Array.isArray(res?.data) ? res.data : [];
        const meta = res?.meta ?? null;
        setResult({ data, meta });
      })
      .catch((err) => {
        if (!cancelled)
          setError(err.response?.data?.message ?? "Failed to load forms");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  };

  useEffect(fetchForms, [query]);

  const meta = result.meta;

  const resetFilters = () => {
    setStatus("");
    setStage("");
    setSearchRaw("");
    setSortBy("updatedAt");
    setSortOrder("desc");
    setPage(1);
  };

  const handleRowClick = (form) => setSelectedFormId(form._id);

  const handleResume = (form, e) => {
    e.stopPropagation();
    hydrateFromServer({
      formId: form._id,
      currentStage: form.currentStage,
      status: form.status,
    });
    navigate({ to: "/multi-select-form" });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Your Forms</h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {meta ? `${meta.total} form${meta.total === 1 ? "" : "s"} found` : "Loading…"}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900 whitespace-nowrap"
            >
              ← Dashboard
            </Link>
            <Link
              to="/multi-select-form"
              className="flex-1 sm:flex-none text-center bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap"
            >
              + New Form
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-3">
            <div className="sm:col-span-2 relative">
              <input
                type="search"
                placeholder="Search by name or email…"
                value={searchRaw}
                onChange={(e) => {
                  setPage(1);
                  setSearchRaw(e.target.value);
                }}
                className="w-full border border-gray-300 pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            </div>
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              className="border border-gray-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={stage}
              onChange={(e) => {
                setPage(1);
                setStage(e.target.value);
              }}
              className="border border-gray-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STAGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split(":");
                setSortBy(by);
                setSortOrder(order);
              }}
              className="border border-gray-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="updatedAt:desc">Recently updated</option>
              <option value="updatedAt:asc">Oldest updates</option>
              <option value="createdAt:desc">Newest first</option>
              <option value="createdAt:asc">Oldest first</option>
              <option value="currentStage:desc">Highest stage</option>
              <option value="currentStage:asc">Lowest stage</option>
            </select>
            <select
              value={limit}
              onChange={(e) => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
              className="border border-gray-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[5, 10, 25, 50].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>

          {(status || stage || searchRaw) && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {status && (
                <FilterChip onClear={() => setStatus("")}>
                  Status: {status}
                </FilterChip>
              )}
              {stage && (
                <FilterChip onClear={() => setStage("")}>
                  Stage: {stage}
                </FilterChip>
              )}
              {searchRaw && (
                <FilterChip onClear={() => setSearchRaw("")}>
                  Search: “{searchRaw}”
                </FilterChip>
              )}
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-gray-500 hover:text-gray-900 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── Mobile card list (shown < md) ───────────────────── */}
        <div className="md:hidden space-y-3">
          {loading && (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm p-4 animate-pulse"
                >
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                  <div className="h-2 bg-gray-100 rounded w-full" />
                </div>
              ))}
            </>
          )}
          {!loading && error && (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <p className="text-red-600 mb-2 text-sm">{error}</p>
              <button
                type="button"
                onClick={fetchForms}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Retry
              </button>
            </div>
          )}
          {!loading && !error && result.data.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <p className="text-gray-400 text-sm mb-3">No forms match your filters</p>
              <Link
                to="/multi-select-form"
                className="inline-block bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Start a new form
              </Link>
            </div>
          )}
          {!loading && !error && result.data.map((f) => (
            <button
              key={f._id}
              type="button"
              onClick={() => handleRowClick(f)}
              className="w-full text-left bg-white rounded-xl shadow-sm p-4 active:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">
                    {f.basicInfo?.fullName || <em className="text-gray-400">Unnamed</em>}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {f.basicInfo?.email || "—"}
                  </p>
                </div>
                <StatusPill status={f.status} />
              </div>

              <div className="text-xs text-gray-600 mb-2">
                Stage {f.currentStage} · {STAGE_LABELS[f.currentStage] ?? ""} ·{" "}
                {f.documents?.length ?? 0} doc{(f.documents?.length ?? 0) === 1 ? "" : "s"}
              </div>

              <ProgressBar stage={f.currentStage} status={f.status} />

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-[11px] text-gray-400">
                  {f.updatedAt ? new Date(f.updatedAt).toLocaleDateString() : "—"}
                </span>
                {f.status === "in-progress" ? (
                  <button
                    type="button"
                    onClick={(e) => handleResume(f, e)}
                    className="text-blue-600 text-xs font-medium"
                  >
                    Resume →
                  </button>
                ) : (
                  <span className="text-gray-500 text-xs font-medium">Tap to view</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* ── Desktop table (md+) ─────────────────────────────── */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Applicant</th>
                <th className="px-4 py-3 text-left">Stage</th>
                <th className="px-4 py-3 text-left w-40">Progress</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Docs</th>
                <th className="px-4 py-3 text-left">Updated</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton />}

              {!loading && error && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <p className="text-red-600 mb-2">{error}</p>
                    <button
                      type="button"
                      onClick={fetchForms}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              )}

              {!loading && !error && result.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="text-gray-400 text-sm mb-3">No forms match your filters</div>
                    <Link
                      to="/multi-select-form"
                      className="inline-block bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      Start a new form
                    </Link>
                  </td>
                </tr>
              )}

              {!loading && !error && result.data.map((f) => (
                <tr
                  key={f._id}
                  onClick={() => handleRowClick(f)}
                  className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {f.basicInfo?.fullName || <em className="text-gray-400">Unnamed</em>}
                    </div>
                    <div className="text-xs text-gray-500">
                      {f.basicInfo?.email || ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-800">{f.currentStage}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      {STAGE_LABELS[f.currentStage] ?? ""}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ProgressBar stage={f.currentStage} status={f.status} />
                  </td>
                  <td className="px-4 py-3"><StatusPill status={f.status} /></td>
                  <td className="px-4 py-3 text-gray-700">{f.documents?.length ?? 0}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                    {f.updatedAt ? new Date(f.updatedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {f.status === "in-progress" ? (
                      <button
                        type="button"
                        onClick={(e) => handleResume(f, e)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Resume
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedFormId(f._id); }}
                        className="text-gray-600 hover:text-gray-900 text-xs font-medium"
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Pagination footer */}
          {meta && meta.total > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-t border-gray-100 text-sm">
              <span className="text-xs sm:text-sm text-gray-500">
                Showing {(meta.page - 1) * meta.limit + 1}–
                {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  disabled={!meta.hasPrevPage}
                  onClick={() => setPage(1)}
                  className="px-2 py-1 rounded-md border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                  aria-label="First page"
                >
                  «
                </button>
                <button
                  disabled={!meta.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded-md border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                >
                  Prev
                </button>
                <span className="px-3 text-gray-600">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <button
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded-md border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
                <button
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage(meta.totalPages)}
                  className="px-2 py-1 rounded-md border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                  aria-label="Last page"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Drawer
        open={!!selectedFormId}
        onClose={() => setSelectedFormId(null)}
        formId={selectedFormId}
      />
    </div>
  );
}

const FilterChip = ({ children, onClear }) => (
  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
    {children}
    <button
      type="button"
      onClick={onClear}
      className="text-blue-400 hover:text-blue-700"
      aria-label="Clear filter"
    >
      ×
    </button>
  </span>
);
