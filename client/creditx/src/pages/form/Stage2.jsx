import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { formsApi } from "../../api/forms.api";
import { useFormStore } from "../../store/formStore";
import { stage2Schema, zodValidator } from "../../schema/form.schema";
import { TextField } from "../../components/form/FormField";
import { SubmitButton } from "../../components/form/SubmitButton";

export default function Stage2({ onSaved, onBack }) {
  const { stageData, updateStage, markStageComplete, formId } = useFormStore();
  const [serverError, setServerError] = useState("");

  const form = useForm({
    defaultValues: stageData.stage2,
    validators: {
      onMount:  zodValidator(stage2Schema),
      onChange: zodValidator(stage2Schema),
      onSubmit: zodValidator(stage2Schema),
    },
    onSubmit: async ({ value }) => {
      setServerError("");
      try {
        const parsed = stage2Schema.parse(value);
        const saved = await formsApi.saveStage2(parsed, formId);
        updateStage("stage2", parsed);
        markStageComplete(2, saved);
        onSaved?.(saved);
      } catch (err) {
        const msg = err.response?.data?.message;
        setServerError(
          Array.isArray(msg) ? msg.join(", ") : msg ?? "Failed to save stage 2",
        );
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
      <h2 className="text-lg font-semibold text-gray-900">Stage 2 — Address Details</h2>

      <TextField form={form} name="street" label="Street address" required />
      <TextField form={form} name="addressLine2" label="Apartment / suite / floor" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField form={form} name="city" label="City" required />
        <TextField form={form} name="state" label="State / province" required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField form={form} name="postalCode" label="Postal code" required />
        <TextField form={form} name="country" label="Country" required />
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <div className="flex justify-between gap-2 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="bg-gray-100 text-gray-700 py-2 px-4 sm:px-6 rounded-lg hover:bg-gray-200 text-sm font-medium"
        >
          Back
        </button>
        <SubmitButton form={form}>Save & Continue</SubmitButton>
      </div>
    </form>
  );
}
