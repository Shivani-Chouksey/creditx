/**
 * Shared document viewer used wherever server-stored documents are
 * shown (FormList drawer, Stage 4 existing files, Stage 5 review).
 *
 * - Images render as a small thumbnail that opens full-size on click.
 * - PDFs / Docs render with a file-type badge + "Open" link.
 * - Every row exposes the original filename, size, and a "View" /
 *   "Download" affordance.
 */

// Strip /api/v1 off the API base URL to get the static-files origin.
// The Nest server serves /uploads/... at the root, not under /api/v1.
const API_BASE   = import.meta.env.VITE_API_BASE_URL ?? "";
const FILE_ORIGIN = API_BASE.replace(/\/api(\/v\d+)?\/?$/, "");

export const documentUrl = (doc) => {
  if (!doc) return null;
  const path =
    doc.publicPath ||
    (doc.storedName ? `/uploads/documents/${doc.storedName}` : null);
  if (!path) return null;
  return `${FILE_ORIGIN}${path}`;
};

const isImage = (mime = "") => mime.startsWith("image/");

const badgeFor = (mime = "", name = "") => {
  if (mime.includes("pdf") || name.toLowerCase().endsWith(".pdf"))
    return { label: "PDF",  className: "bg-red-100 text-red-700" };
  if (mime.includes("word") || /\.docx?$/i.test(name))
    return { label: "DOC",  className: "bg-blue-100 text-blue-700" };
  if (isImage(mime))
    return { label: "IMG",  className: "bg-green-100 text-green-700" };
  return   { label: "FILE", className: "bg-gray-100 text-gray-700" };
};

const prettySize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Single document row.
 *
 * Props:
 *  - doc:       { originalName, storedName, publicPath, mimetype, size, uploadedAt }
 *  - onDelete?: optional handler — renders a delete button when provided
 *  - tone?:     "green" | "blue" | "neutral" — background tint (context-dependent)
 */
export default function DocumentPreview({ doc, onDelete, tone = "neutral" }) {
  const url   = documentUrl(doc);
  const badge = badgeFor(doc?.mimetype, doc?.originalName);
  const img   = isImage(doc?.mimetype);

  const toneCls =
    tone === "green"
      ? "bg-green-50 border-green-200"
      : tone === "blue"
      ? "bg-blue-50 border-blue-100"
      : "bg-gray-50 border-gray-200";

  return (
    <div
      className={`flex items-center justify-between gap-3 border rounded-lg p-2.5 ${toneCls}`}
    >
      {/* Thumbnail or file-type badge */}
      <a
        href={url || undefined}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0"
        aria-label={`Open ${doc?.originalName}`}
      >
        {img && url ? (
          <img
            src={url}
            alt={doc.originalName}
            className="w-12 h-12 object-cover rounded-md border border-white"
            loading="lazy"
          />
        ) : (
          <span
            className={`w-12 h-12 rounded-md flex items-center justify-center text-[10px] font-bold ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
      </a>

      {/* Filename + meta */}
      <div className="flex-1 min-w-0">
        <a
          href={url || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-gray-900 hover:text-blue-700 truncate"
          title={doc?.originalName}
        >
          {doc?.originalName || "—"}
        </a>
        <p className="text-[11px] text-gray-500">
          {prettySize(doc?.size)} · {doc?.mimetype || "unknown"}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded"
          >
            View
          </a>
        )}
        {url && (
          <a
            href={url}
            download={doc?.originalName}
            className="text-xs text-gray-500 hover:text-gray-800 font-medium px-2 py-1 rounded hidden sm:inline"
          >
            ↓
          </a>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
