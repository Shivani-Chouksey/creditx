import { useForm } from "@tanstack/react-form";
import { useEffect, useState } from "react";
import { formsApi } from "../../api/forms.api";
import { useFormStore } from "../../store/formStore";
import { stage5Schema, zodValidator } from "../../schema/form.schema";
import { TextAreaField } from "../../components/form/FormField";
import DocumentPreview from "../../components/form/DocumentPreview";

const Row = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-4 py-1.5 border-b border-gray-100 last:border-0">
    <span className="text-[11px] sm:text-xs text-gray-500 shrink-0">{label}</span>
    <span className="text-xs text-gray-900 sm:text-right break-all">
      {value || <em className="text-gray-400">Not provided</em>}
    </span>
  </div>
);

const Section = ({ title, children }) => (
  <div>
    <h3 className="text-sm font-semibold text-gray-800 mb-2">{title}</h3>
    <div className="bg-gray-50 rounded-lg p-3">{children}</div>
  </div>
);

export default function Stage5({ onSaved, onBack }) {
  const { stageData, formId, markStageComplete } = useFormStore();
  const [serverError, setServerError] = useState("");
  const [formSnapshot, setFormSnapshot] = useState(null);

  useEffect(() => {
    if (!formId) return;
    formsApi
      .getFormById(formId)
      .then(setFormSnapshot)
      .catch(() => {});
  }, [formId]);

  const form = useForm({
    defaultValues: stageData.stage5,
    validators: { onSubmit: zodValidator(stage5Schema) },
    onSubmit: async ({ value }) => {
      setServerError("");
      try {
        const parsed = stage5Schema.parse(value);
        const saved = await formsApi.saveStage5(parsed);
        markStageComplete(5, saved);
        onSaved?.(saved);
      } catch (err) {
        setServerError(err.response?.data?.message ?? "Could not submit the form");
      }
    },
  });

  const basic = formSnapshot?.basicInfo ?? stageData.stage1;
  const addr = formSnapshot?.addressDetails ?? stageData.stage2;
  const prof = formSnapshot?.professionalDetails ?? stageData.stage3;
  const docs = formSnapshot?.documents ?? [];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-900">Stage 5 — Review & Submit</h2>

      <Section title="Basic Information">
        <Row label="Full name"     value={basic?.fullName} />
        <Row label="Email"         value={basic?.email} />
        <Row label="Phone"         value={basic?.phone} />
        <Row label="Date of birth" value={basic?.dateOfBirth} />
        <Row label="Gender"        value={basic?.gender} />
      </Section>

      <Section title="Address">
        <Row label="Street"       value={addr?.street} />
        <Row label="Line 2"       value={addr?.addressLine2} />
        <Row label="City"         value={addr?.city} />
        <Row label="State"        value={addr?.state} />
        <Row label="Postal code"  value={addr?.postalCode} />
        <Row label="Country"      value={addr?.country} />
      </Section>

      <Section title="Professional">
        <Row label="Company"    value={prof?.companyName} />
        <Row label="Job title"  value={prof?.jobTitle} />
        <Row label="Experience" value={prof?.yearsOfExperience?.toString()} />
        <Row
          label="Skills"
          value={Array.isArray(prof?.skills) ? prof.skills.join(", ") : ""}
        />
        <Row label="LinkedIn"   value={prof?.linkedinUrl} />
        <Row label="Bio"        value={prof?.bio} />
      </Section>

      <Section title={`Documents (${docs.length})`}>
        {docs.length === 0 ? (
          <p className="text-xs text-gray-400">No documents on file</p>
        ) : (
          <ul className="space-y-2">
            {docs.map((d, i) => (
              <li key={d.storedName ?? i}>
                <DocumentPreview doc={d} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <TextAreaField form={form} name="reviewNotes" label="Review notes (optional)" rows={3} />

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <form.Subscribe selector={(s) => [s.isSubmitting]}>
        {([isSubmitting]) => (
          <div className="flex justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="bg-gray-100 text-gray-700 py-2 px-4 sm:px-6 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 text-white py-2 px-4 sm:px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
            >
              {isSubmitting ? "Submitting…" : "Submit Form"}
            </button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
