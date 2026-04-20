import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../../apiClient";
import { API_URLS } from "../../api_endpoints";
import { formsApi } from "../api/forms.api";
import { useFormStore } from "../store/formStore";

const STAGE_LABELS = {
  1: "Basic Info",
  2: "Address",
  3: "Professional",
  4: "Documents",
  5: "Review",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const hydrateFromServer = useFormStore((s) => s.hydrateFromServer);
  const resetDraft = useFormStore((s) => s.reset);

  const [resume, setResume] = useState(null);
  const [recent, setRecent] = useState([]);
  const [allForms, setAllForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.all([
      formsApi.getResume().catch(() => null),
      // Backend caps limit at 50 — use listAllForms to walk pages for stats.
      formsApi.listAllForms({ pageSize: 50 }).catch(() => []),
    ])
      .then(([resumeRes, allRes]) => {
        if (cancelled) return;
        setResume(resumeRes);
        const all = Array.isArray(allRes) ? allRes : [];
        setAllForms(all);
        // Top 5 most recently updated — no need for a second API call.
        const top5 = [...all]
          .sort((a, b) => {
            const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return tb - ta;
          })
          .slice(0, 5);
        setRecent(top5);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err.response?.data?.message ?? "Could not load dashboard");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total      = allForms.length;
    const completed  = allForms.filter((f) => f.status === "completed").length;
    const inProgress = allForms.filter((f) => f.status === "in-progress").length;
    const docsCount  = allForms.reduce(
      (sum, f) => sum + (f.documents?.length ?? 0),
      0,
    );
    const completionRate =
      total === 0 ? 0 : Math.round((completed / total) * 100);

    // Real-data derived metrics
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const createdThisWeek = allForms.filter(
      (f) => f.createdAt && now - new Date(f.createdAt).getTime() < weekMs,
    ).length;

    const submittedThisWeek = allForms.filter(
      (f) =>
        f.status === "completed" &&
        f.submittedAt &&
        now - new Date(f.submittedAt).getTime() < weekMs,
    ).length;

    const avgStage =
      inProgress === 0
        ? 0
        : (
            allForms
              .filter((f) => f.status === "in-progress")
              .reduce((sum, f) => sum + (f.currentStage ?? 1), 0) / inProgress
          ).toFixed(1);

    const avgDocsPerForm =
      total === 0 ? 0 : (docsCount / total).toFixed(1);

    const lastUpdated = allForms.reduce((latest, f) => {
      if (!f.updatedAt) return latest;
      const t = new Date(f.updatedAt).getTime();
      return t > latest ? t : latest;
    }, 0);

    return {
      total,
      completed,
      inProgress,
      docsCount,
      completionRate,
      createdThisWeek,
      submittedThisWeek,
      avgStage,
      avgDocsPerForm,
      lastUpdated,
    };
  }, [allForms]);

  const relativeTime = (ms) => {
    if (!ms) return "never";
    const diff = Date.now() - ms;
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7)  return `${days}d ago`;
    return new Date(ms).toLocaleDateString();
  };

  const handleResume = () => {
    if (resume?.hasActiveForm) {
      hydrateFromServer({
        formId: resume.formId,
        currentStage: resume.currentStage,
        status: "in-progress",
      });
    }
    navigate({ to: "/multi-select-form" });
  };

  const handleNewForm = () => {
    resetDraft();
    navigate({ to: "/multi-select-form" });
  };

  const [loggingOut, setLoggingOut] = useState(false);
  const handleLogout = async () => {
    if (loggingOut) return;
    const ok = window.confirm("Sign out of CreditX?");
    if (!ok) return;
    setLoggingOut(true);
    try {
      await apiClient.post(API_URLS.AUTH.LOGOUT, {}).catch(() => {});
    } finally {
      localStorage.removeItem("accessToken");
      resetDraft();
      navigate({ to: "/login" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              C
            </div>
            <span className="font-semibold text-gray-900 truncate">CreditX</span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-5 text-sm">
            <Link to="/dashboard" className="text-gray-900 font-medium hidden sm:inline">Dashboard</Link>
            <Link to="/forms" className="text-gray-500 hover:text-gray-900">All Forms</Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-1.5 text-gray-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Sign out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
              <span className="hidden sm:inline">{loggingOut ? "Signing out…" : "Logout"}</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5 sm:space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Welcome back 👋</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Here's an overview of your applications.
          </p>
        </div>

        {/* Resume banner */}
        {!loading && resume?.hasActiveForm && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 shadow-md">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider opacity-80">
                Resume application
              </p>
              <h3 className="text-base sm:text-lg font-semibold mt-1 truncate">
                Stage {resume.currentStage} — {resume.currentStageLabel}
              </h3>
              <div className="mt-2 bg-white/20 rounded-full h-1.5 w-full sm:w-64 overflow-hidden">
                <div
                  className="h-full bg-white"
                  style={{ width: `${resume.completionPercent ?? 0}%` }}
                />
              </div>
              <p className="text-[11px] sm:text-xs mt-1 opacity-90">
                {resume.completionPercent}% complete
              </p>
            </div>
            <button
              type="button"
              onClick={handleResume}
              className="bg-white text-blue-700 font-medium px-4 py-2 rounded-lg text-sm hover:bg-blue-50 whitespace-nowrap w-full md:w-auto"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Total forms"
            value={loading ? "—" : stats.total}
            accent="bg-blue-50 text-blue-700"
            icon="📄"
            hint={
              loading
                ? "Loading…"
                : stats.createdThisWeek > 0
                ? `+${stats.createdThisWeek} this week`
                : "No new forms this week"
            }
            footer={
              !loading && stats.lastUpdated > 0
                ? `Last activity · ${relativeTime(stats.lastUpdated)}`
                : null
            }
            onClick={() => navigate({ to: "/forms" })}
          />
          <StatCard
            label="Completed"
            value={loading ? "—" : stats.completed}
            accent="bg-green-50 text-green-700"
            icon="✅"
            hint={
              loading
                ? "Loading…"
                : stats.submittedThisWeek > 0
                ? `${stats.submittedThisWeek} submitted this week`
                : `${stats.completionRate}% success rate`
            }
            footer={
              !loading && stats.total > 0
                ? `${stats.completed} of ${stats.total} submitted`
                : null
            }
            onClick={() =>
              navigate({ to: "/forms", search: { status: "completed" } })
            }
          />
          <StatCard
            label="In progress"
            value={loading ? "—" : stats.inProgress}
            accent="bg-amber-50 text-amber-700"
            icon="🕒"
            hint={
              loading
                ? "Loading…"
                : stats.inProgress > 0
                ? `Avg stage · ${stats.avgStage} / 5`
                : "All caught up"
            }
            footer={
              !loading && resume?.hasActiveForm
                ? `Resume at stage ${resume.currentStage}`
                : null
            }
            onClick={() =>
              navigate({ to: "/forms", search: { status: "in-progress" } })
            }
          />
          <StatCard
            label="Documents"
            value={loading ? "—" : stats.docsCount}
            accent="bg-indigo-50 text-indigo-700"
            icon="📎"
            hint={
              loading
                ? "Loading…"
                : stats.total > 0
                ? `${stats.avgDocsPerForm} avg per form`
                : "No uploads yet"
            }
            footer={
              !loading && stats.docsCount > 0
                ? `Across ${stats.total} form${stats.total === 1 ? "" : "s"}`
                : null
            }
            onClick={() => navigate({ to: "/forms" })}
          />
        </div>

        {/* Completion rate */}
        {!loading && stats.total > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Completion rate
              </h3>
              <span className="text-2xl font-bold text-blue-600">
                {stats.completionRate}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.completed} of {stats.total} forms submitted
            </p>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent forms */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Recent Forms</h2>
              <Link
                to="/forms"
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                View all →
              </Link>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm text-gray-400 mb-3">No forms yet</p>
                <button
                  type="button"
                  onClick={handleNewForm}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Start your first form
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recent.map((f) => (
                  <li
                    key={f._id}
                    className="px-5 py-3 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {f.basicInfo?.fullName || <em className="text-gray-400">Draft</em>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {f.basicInfo?.email || "—"} · Stage {f.currentStage} —{" "}
                        {STAGE_LABELS[f.currentStage]}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          f.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {f.status === "completed" ? "Done" : "Draft"}
                      </span>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {f.updatedAt
                          ? new Date(f.updatedAt).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>

            <div className="space-y-3">
              <ActionButton
                onClick={handleNewForm}
                title="Start new form"
                description="Begin a fresh 5-stage application"
                icon="＋"
                primary
              />
              {resume?.hasActiveForm && (
                <ActionButton
                  onClick={handleResume}
                  title="Resume draft"
                  description={`Pick up at Stage ${resume.currentStage}`}
                  icon="↻"
                />
              )}
              <ActionButton
                onClick={() => navigate({ to: "/forms" })}
                title="Browse all forms"
                description="View, filter, and inspect submissions"
                icon="📋"
              />
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Stages
              </h3>
              <ol className="space-y-1.5 text-xs text-gray-600">
                <li>1 · Basic Information</li>
                <li>2 · Address Details</li>
                <li>3 · Professional Details</li>
                <li>4 · Document Upload</li>
                <li>5 · Review & Submit</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

const StatCard = ({ label, value, accent, icon, hint, footer, onClick }) => {
  const Element = onClick ? "button" : "div";
  return (
    <Element
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm p-4 text-left w-full ${
        onClick ? "hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase tracking-wide">
          {label}
        </span>
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${accent}`}
        >
          {icon}
        </span>
      </div>
      <p className="text-2xl font-semibold text-gray-900 mt-2 leading-none">
        {value}
      </p>
      {hint && <p className="text-xs text-gray-500 mt-1.5">{hint}</p>}
      {footer && (
        <p className="text-[11px] text-gray-400 mt-2 pt-2 border-t border-gray-100 truncate">
          {footer}
        </p>
      )}
    </Element>
  );
};

const ActionButton = ({ onClick, title, description, icon, primary }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 text-left px-3 py-3 rounded-lg transition ${
      primary
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : "bg-gray-50 text-gray-900 hover:bg-gray-100"
    }`}
  >
    <span
      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold ${
        primary ? "bg-white/20" : "bg-white"
      }`}
    >
      {icon}
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-medium">{title}</span>
      <span
        className={`block text-xs truncate ${primary ? "text-white/80" : "text-gray-500"}`}
      >
        {description}
      </span>
    </span>
    <span className={primary ? "text-white" : "text-gray-400"}>→</span>
  </button>
);
