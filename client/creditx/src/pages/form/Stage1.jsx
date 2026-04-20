import { useForm } from "@tanstack/react-form";
import { formsApi } from "../../api/forms.api";
import { useFormStore } from "../../store/formStore";
import { GENDERS, stage1Schema, zodValidator } from "../../schema/form.schema";
import {
  SelectField,
  TextField,
} from "../../components/form/FormField";
import { useState } from "react";

const GENDER_OPTIONS = GENDERS.map((g) => ({
  value: g,
  label: g
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" "),
}));

export default function Stage1({ onSaved }) {
  const { stageData, updateStage, markStageComplete } = useFormStore();
  const [serverError, setServerError] = useState("");

  const form = useForm({
    defaultValues: stageData.stage1,
    validators: { onSubmit: zodValidator(stage1Schema) },
    onSubmit: async ({ value }) => {
      setServerError("");
      try {
        const parsed = stage1Schema.parse(value);
        const saved = await formsApi.saveStage1(parsed);
        updateStage("stage1", parsed);
        markStageComplete(1, saved);
        onSaved?.(saved);
      } catch (err) {
        setServerError(err.response?.data?.message ?? "Failed to save stage 1");
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-900">Stage 1 — Basic Information</h2>

      <TextField form={form} name="fullName" label="Full name" required />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField form={form} name="email" label="Email" type="email" required />
        <TextField form={form} name="phone" label="Phone" placeholder="+919876543210" required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField form={form} name="dateOfBirth" label="Date of birth" type="date" />
        <SelectField form={form} name="gender" label="Gender" options={GENDER_OPTIONS} />
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <form.Subscribe selector={(s) => [s.isSubmitting]}>
        {([isSubmitting]) => (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white py-2 px-4 sm:px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {isSubmitting ? "Saving…" : "Save & Continue"}
            </button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
