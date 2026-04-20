import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { formsApi } from "../../api/forms.api";
import { useFormStore } from "../../store/formStore";
import { stage3Schema, zodValidator } from "../../schema/form.schema";
import {
  NumberField,
  TextAreaField,
  TextField,
} from "../../components/form/FormField";
import { SubmitButton } from "../../components/form/SubmitButton";

export default function Stage3({ onSaved, onBack }) {
  const { stageData, updateStage, markStageComplete, formId } = useFormStore();
  const [serverError, setServerError] = useState("");
  const [skillInput, setSkillInput] = useState("");

  const form = useForm({
    defaultValues: stageData.stage3,
    validators: {
      onMount:  zodValidator(stage3Schema),
      onChange: zodValidator(stage3Schema),
      onSubmit: zodValidator(stage3Schema),
    },
    onSubmit: async ({ value }) => {
      setServerError("");
      try {
        const parsed = stage3Schema.parse(value);
        const saved = await formsApi.saveStage3(parsed, formId);
        updateStage("stage3", parsed);
        markStageComplete(3, saved);
        onSaved?.(saved);
      } catch (err) {
        const msg = err.response?.data?.message;
        setServerError(
          Array.isArray(msg) ? msg.join(", ") : msg ?? "Failed to save stage 3",
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
      <h2 className="text-lg font-semibold text-gray-900">Stage 3 — Professional Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField form={form} name="companyName" label="Company name" required />
        <TextField form={form} name="jobTitle" label="Job title" required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NumberField
          form={form}
          name="yearsOfExperience"
          label="Years of experience"
          min={0}
          max={60}
          required
        />
        <TextField
          form={form}
          name="linkedinUrl"
          label="LinkedIn URL"
          placeholder="https://linkedin.com/in/…"
        />
      </div>

      {/* Skills chip input */}
      <form.Field name="skills">
        {(field) => {
          const skills = field.state.value ?? [];
          const addSkill = () => {
            const trimmed = skillInput.trim();
            if (!trimmed) return;
            if (skills.includes(trimmed)) {
              setSkillInput("");
              return;
            }
            field.handleChange([...skills, trimmed]);
            setSkillInput("");
          };
          return (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
              <div className="flex gap-2">
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Add a skill and press Enter"
                  className="flex-1 border border-gray-300 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="bg-gray-100 text-gray-700 px-4 rounded-lg text-sm hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
              {skills.length > 0 && (
                <ul className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill) => (
                    <li
                      key={skill}
                      className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() =>
                          field.handleChange(skills.filter((s) => s !== skill))
                        }
                        className="text-blue-400 hover:text-blue-700"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {field.state.meta.errors?.[0] && (
                <p className="mt-1 text-xs text-red-600">
                  {typeof field.state.meta.errors[0] === "string"
                    ? field.state.meta.errors[0]
                    : field.state.meta.errors[0]?.message}
                </p>
              )}
            </div>
          );
        }}
      </form.Field>

      <TextAreaField form={form} name="bio" label="Bio" rows={3} />

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
