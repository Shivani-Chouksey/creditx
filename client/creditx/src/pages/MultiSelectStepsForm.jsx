import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import Stepper from "../components/Stepper";
import Stage1 from "./form/Stage1";
import Stage2 from "./form/Stage2";
import Stage3 from "./form/Stage3";
import Stage4 from "./form/Stage4";
import Stage5 from "./form/Stage5";
import { formsApi } from "../api/forms.api";
import { useFormStore } from "../store/formStore";

export default function MultiStepForm() {
  const navigate = useNavigate();

  const currentStage          = useFormStore((s) => s.currentStage);
  const highestCompletedStage = useFormStore((s) => s.highestCompletedStage);
  const hydrateFromServer     = useFormStore((s) => s.hydrateFromServer);
  const hydrateStagesFromForm = useFormStore((s) => s.hydrateStagesFromForm);
  const setStep               = useFormStore((s) => s.setStep);
  const reset                 = useFormStore((s) => s.reset);
  const status                = useFormStore((s) => s.status);

  const [isResuming, setIsResuming] = useState(true);

  /**
   * On mount:
   *   1. Ask the server which stage the user is on (/forms/resume).
   *   2. If there's an active form, fetch its full contents and
   *      populate every stage's fields so the user sees everything
   *      they previously filled.
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const info = await formsApi.getResume();
        if (cancelled || !info) return;

        if (info.hasActiveForm && info.formId) {
          const fullForm = await formsApi.getFormById(info.formId);
          if (cancelled) return;
          hydrateStagesFromForm(fullForm);
        } else {
          hydrateFromServer({
            formId:       info.formId,
            currentStage: info.currentStage,
            status:       "in-progress",
          });
        }
      } catch {
        // Resume is best-effort: on failure we just let the user start fresh.
      } finally {
        if (!cancelled) setIsResuming(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrateFromServer, hydrateStagesFromForm]);

  const handleBack = () => setStep(Math.max(1, currentStage - 1));

  const handleSaved = (nextStage) => {
    if (nextStage > 5) {
      // Finished — take the user to the list and clear draft.
      reset();
      navigate({ to: "/forms" });
      return;
    }
    setStep(nextStage);
  };

  const renderStage = () => {
    const props = {
      onBack: handleBack,
      onSaved: () => handleSaved(currentStage + 1),
    };
    switch (currentStage) {
      case 1: return <Stage1 onSaved={props.onSaved} />;
      case 2: return <Stage2 {...props} />;
      case 3: return <Stage3 {...props} />;
      case 4: return <Stage4 {...props} />;
      case 5: return <Stage5 {...props} />;
      default: return <Stage1 onSaved={props.onSaved} />;
    }
  };

  if (isResuming) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading your progress…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Application Form
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {status === "completed"
                ? "Form submitted"
                : `Complete all 5 stages · Resuming at stage ${currentStage}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: "/forms" })}
            className="text-sm text-blue-600 hover:text-blue-700 self-start sm:self-auto whitespace-nowrap"
          >
            View all forms →
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8">
          <Stepper
            currentStage={currentStage}
            highestCompletedStage={highestCompletedStage}
            onSelect={(n) => {
              // Only allow jumping to previously-reached stages
              if (n <= Math.max(highestCompletedStage + 1, currentStage)) {
                setStep(n);
              }
            }}
          />

          {renderStage()}
        </div>
      </div>
    </div>
  );
}
