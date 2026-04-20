import { useForm } from "@tanstack/react-form";
import { formsApi } from "../../api/forms.api";
import { useFormStore } from "../../store/formStore";
import { GENDERS, stage1Schema, zodValidator } from "../../schema/form.schema";
import {
  SelectField,
  TextField,
  digitsOnly,
} from "../../components/form/FormField";
import { useState } from "react";
import { SubmitButton } from "../../components/form/SubmitButton";

const GENDER_OPTIONS = GENDERS.map((g) => ({
  value: g,
  label: g
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" "),
}));

export default function Stage1({ onSaved }) {
  const { stageData, updateStage, markStageComplete, formId } = useFormStore();
  const [serverError, setServerError] = useState("");

  const form = useForm({
    defaultValues: stageData.stage1,
    validators: {
      onMount:  zodValidator(stage1Schema),
      onChange: zodValidator(stage1Schema),
      onSubmit: zodValidator(stage1Schema),
    },
    onSubmit: async ({ value }) => {
      setServerError("");
      try {
        const parsed = stage1Schema.parse(value);
        const saved = await formsApi.saveStage1(parsed, formId);
        updateStage("stage1", parsed);
        markStageComplete(1, saved);
        onSaved?.(saved);
      } catch (err) {
        const msg = err.response?.data?.message;
        setServerError(
          Array.isArray(msg) ? msg.join(", ") : msg ?? "Failed to save stage 1",
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
      <h2 className="text-lg font-semibold text-gray-900">Stage 1 — Basic Information</h2>

      <TextField form={form} name="fullName" label="Full name" required />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField form={form} name="email" label="Email" type="email" required />
        <TextField
          form={form}
          name="phone"
          label="Phone"
          placeholder="10-digit mobile number"
          required
          type="tel"
          inputMode="numeric"
          pattern="\d{10}"
          maxLength={10}
          sanitize={digitsOnly}
          autoComplete="tel-national"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField form={form} name="dateOfBirth" label="Date of birth" type="date" />
        <SelectField form={form} name="gender" label="Gender" options={GENDER_OPTIONS} />
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <div className="flex justify-end">
        <SubmitButton form={form}>Save & Continue</SubmitButton>
      </div>
    </form>
  );
}
