import { useForm } from "@tanstack/react-form";
import { useEffect, useState } from "react";
import { formsApi } from "../../api/forms.api";
import { useFormStore } from "../../store/formStore";
import {
  ACCEPTED_MIME_TYPES,
  MAX_DOCUMENTS,
  MAX_FILE_SIZE_MB,
  MIN_DOCUMENTS,
  stage4Schema,
  zodValidator,
} from "../../schema/form.schema";
import { TextAreaField } from "../../components/form/FormField";
import { SubmitButton } from "../../components/form/SubmitButton";
import DocumentPreview from "../../components/form/DocumentPreview";

const bytesToMb = (bytes) => (bytes / (1024 * 1024)).toFixed(2);

export default function Stage4({ onSaved, onBack }) {
  const { stageData, updateStage, markStageComplete, formId } = useFormStore();
  const [serverError, setServerError] = useState("");

  // Documents already stored on the server (can't be re-attached to a
  // <input type=file>, but can be displayed and deleted via API).
  const [existingDocs, setExistingDocs] = useState([]);
  const [loadingDocs, setLoadingDocs]   = useState(false);

  const loadExisting = async () => {
    if (!formId) {
      setExistingDocs([]);
      return;
    }
    setLoadingDocs(true);
    try {
      const full = await formsApi.getFormById(formId);
      setExistingDocs(Array.isArray(full?.documents) ? full.documents : []);
    } catch {
      /* silent — show the upload UI without the existing list */
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  // Skip the min-count check when the user is adding to an existing
  // set of server-side documents (they already satisfy the minimum).
  const stage4Validator = ({ value }) => {
    const existingCount = existingDocs.length;
    const newCount      = value.documents?.length ?? 0;
    const totalAfter    = existingCount + newCount;

    if (existingCount === 0 && newCount < MIN_DOCUMENTS) {
      return {
        fields: {
          documents: `Upload at least ${MIN_DOCUMENTS} documents`,
        },
      };
    }
    if (totalAfter > MAX_DOCUMENTS) {
      return {
        fields: {
          documents: `You can have at most ${MAX_DOCUMENTS} documents (you already have ${existingCount})`,
        },
      };
    }
    return zodValidator(stage4Schema)({ value });
  };

  const form = useForm({
    defaultValues: {
      documents: [],
      notes: stageData.stage4.notes ?? "",
    },
    validators: {
      onMount:  stage4Validator,
      onChange: stage4Validator,
      onSubmit: stage4Validator,
    },
    onSubmit: async ({ value }) => {
      setServerError("");
      try {
        // If they already have enough documents, just save notes and
        // advance — no need to force another upload.
        if (existingDocs.length >= MIN_DOCUMENTS && (!value.documents || value.documents.length === 0)) {
          updateStage("stage4", { notes: value.notes ?? "" });
          markStageComplete(4, { _id: formId, status: "in-progress", currentStage: 5 });
          onSaved?.();
          return;
        }

        const saved = await formsApi.saveStage4(
          {
            documents: value.documents ?? [],
            notes:     value.notes,
          },
          formId,
        );
        updateStage("stage4", { notes: value.notes ?? "" });
        markStageComplete(4, saved);
        onSaved?.(saved);
      } catch (err) {
        const msg = err.response?.data?.message;
        setServerError(
          Array.isArray(msg) ? msg.join(", ") : msg ?? "Failed to upload documents",
        );
      }
    },
  });

  // `stage4Validator` closes over `existingDocs`. Re-run it when the
  // list loads/changes so `canSubmit` reflects the latest count without
  // requiring the user to touch the form first.
  useEffect(() => {
    if (typeof form.validateAllFields === "function") {
      form.validateAllFields("change");
    } else if (typeof form.validate === "function") {
      form.validate("change");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingDocs.length]);

  const handleDeleteExisting = async (index) => {
    if (!formId) return;
    const ok = window.confirm(
      "Remove this document? This cannot be undone.",
    );
    if (!ok) return;
    try {
      await formsApi.removeDocument(formId, index);
      await loadExisting();
    } catch (err) {
      setServerError(
        err.response?.data?.message ?? "Failed to remove document",
      );
    }
  };

  const availableSlots = Math.max(0, MAX_DOCUMENTS - existingDocs.length);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-900">Stage 4 — Document Upload</h2>

      <p className="text-xs text-gray-500">
        Upload between {MIN_DOCUMENTS} and {MAX_DOCUMENTS} files. Allowed: PDF, JPEG, PNG, DOC,
        DOCX · Max {MAX_FILE_SIZE_MB} MB each.
      </p>

      {/* Existing (server-stored) documents */}
      {loadingDocs ? (
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
          Loading existing documents…
        </div>
      ) : existingDocs.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Already uploaded ({existingDocs.length})
          </p>
          <ul className="space-y-2">
            {existingDocs.map((doc, idx) => (
              <li key={`${doc.storedName ?? doc.originalName}-${idx}`}>
                <DocumentPreview
                  doc={doc}
                  tone="green"
                  onDelete={() => handleDeleteExisting(idx)}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* New files to upload this session */}
      <form.Field name="documents">
        {(field) => {
          const files  = field.state.value ?? [];
          const errors = field.state.meta.errors;
          const canAddMore = availableSlots > 0;

          return (
            <div>
              <label
                htmlFor="documents"
                className={`block border-2 border-dashed rounded-lg p-6 text-center transition
                  ${
                    canAddMore
                      ? "border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30"
                      : "border-gray-200 bg-gray-50 cursor-not-allowed"
                  }`}
              >
                <p className="text-sm text-gray-600">
                  {canAddMore ? (
                    <>
                      <span className="text-blue-600 font-medium">Click to browse</span> or drop files here
                    </>
                  ) : (
                    "You've reached the maximum number of documents."
                  )}
                </p>
                {canAddMore && (
                  <p className="text-xs text-gray-400 mt-1">
                    {availableSlots} slot{availableSlots === 1 ? "" : "s"} remaining
                  </p>
                )}
                <input
                  id="documents"
                  type="file"
                  multiple
                  accept={ACCEPTED_MIME_TYPES.join(",")}
                  disabled={!canAddMore}
                  className="hidden"
                  onChange={(e) => {
                    const incoming = Array.from(e.target.files ?? []);
                    const merged   = [...files, ...incoming].slice(0, availableSlots);
                    field.handleChange(merged);
                    e.target.value = "";
                  }}
                />
              </label>

              {files.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {files.map((file, idx) => (
                    <li
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {bytesToMb(file.size)} MB · {file.type || "unknown"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          field.handleChange(files.filter((_, i) => i !== idx))
                        }
                        className="text-red-500 hover:text-red-700 text-xs font-medium ml-2"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {errors.length > 0 && (
                <p className="mt-2 text-xs text-red-600">
                  {typeof errors[0] === "string" ? errors[0] : errors[0]?.message}
                </p>
              )}
            </div>
          );
        }}
      </form.Field>

      <TextAreaField form={form} name="notes" label="Notes (optional)" rows={3} />

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <div className="flex justify-between gap-2 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="bg-gray-100 text-gray-700 py-2 px-4 sm:px-6 rounded-lg hover:bg-gray-200 text-sm font-medium"
        >
          Back
        </button>
        <SubmitButton form={form} loadingText="Uploading…">
          {existingDocs.length >= MIN_DOCUMENTS ? "Continue" : "Upload & Continue"}
        </SubmitButton>
      </div>
    </form>
  );
}
