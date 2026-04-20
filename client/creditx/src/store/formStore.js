import { create } from "zustand";
import { persist } from "zustand/middleware";

const emptyStageData = () => ({
  stage1: {
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  },
  stage2: {
    street: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  },
  stage3: {
    companyName: "",
    jobTitle: "",
    yearsOfExperience: "",
    skills: [],
    linkedinUrl: "",
    bio: "",
  },
  stage4: {
    notes: "",
  },
  stage5: {
    reviewNotes: "",
  },
});

/**
 * Client-side mirror of the active form draft.
 *  - `formId` / `currentStage` / `status` come from the server.
 *  - `stageData` holds the working values for each stage so that
 *    moving Back/Next does not clear unsaved edits.
 *  - `persist` keeps the user's input across refreshes while they
 *    fill the wizard. Hydration is replaced on `hydrateFromServer`.
 */
export const useFormStore = create(
  persist(
    (set, get) => ({
      formId: null,
      currentStage: 1,          // next stage the user should work on
      highestCompletedStage: 0, // max saved stage
      status: "in-progress",
      stageData: emptyStageData(),

      setStep: (step) => set({ currentStage: step }),

      updateStage: (stageKey, patch) =>
        set((state) => ({
          stageData: {
            ...state.stageData,
            [stageKey]: { ...state.stageData[stageKey], ...patch },
          },
        })),

      hydrateFromServer: ({ formId, currentStage, status }) =>
        set({
          formId: formId ?? null,
          currentStage: currentStage ?? 1,
          highestCompletedStage: Math.max(
            get().highestCompletedStage,
            (currentStage ?? 1) - 1,
          ),
          status: status ?? "in-progress",
        }),

      /**
       * Populate stageData from a full server Form document.
       * Unset server fields fall back to the empty defaults so every
       * controlled input still receives a defined value.
       *
       * Used when the user resumes a draft — we mirror the server's
       * saved values into every stage so every field pre-fills.
       */
      hydrateStagesFromForm: (form) => {
        if (!form) return;
        const empty = emptyStageData();
        const basic  = form.basicInfo           ?? {};
        const addr   = form.addressDetails      ?? {};
        const prof   = form.professionalDetails ?? {};

        set({
          formId: form._id ?? form.id ?? get().formId,
          currentStage: form.currentStage ?? get().currentStage,
          highestCompletedStage: Math.max(
            get().highestCompletedStage,
            (form.currentStage ?? 1) - 1,
          ),
          status: form.status ?? get().status,
          stageData: {
            stage1: {
              ...empty.stage1,
              fullName:    basic.fullName    ?? "",
              email:       basic.email       ?? "",
              phone:       basic.phone       ?? "",
              dateOfBirth: basic.dateOfBirth ?? "",
              gender:      basic.gender      ?? "",
            },
            stage2: {
              ...empty.stage2,
              street:       addr.street       ?? "",
              addressLine2: addr.addressLine2 ?? "",
              city:         addr.city         ?? "",
              state:        addr.state        ?? "",
              postalCode:   addr.postalCode   ?? "",
              country:      addr.country      ?? "",
            },
            stage3: {
              ...empty.stage3,
              companyName:       prof.companyName       ?? "",
              jobTitle:          prof.jobTitle          ?? "",
              yearsOfExperience:
                prof.yearsOfExperience === 0 || prof.yearsOfExperience
                  ? String(prof.yearsOfExperience)
                  : "",
              skills:      Array.isArray(prof.skills) ? prof.skills : [],
              linkedinUrl: prof.linkedinUrl ?? "",
              bio:         prof.bio         ?? "",
            },
            stage4: { ...empty.stage4 },
            stage5: {
              ...empty.stage5,
              reviewNotes: form.reviewNotes ?? "",
            },
          },
        });
      },

      markStageComplete: (stageNumber, serverForm) =>
        set((state) => ({
          formId: serverForm?._id ?? serverForm?.id ?? state.formId,
          currentStage: Math.max(state.currentStage, stageNumber + 1),
          highestCompletedStage: Math.max(
            state.highestCompletedStage,
            stageNumber,
          ),
          status: serverForm?.status ?? state.status,
        })),

      reset: () =>
        set({
          formId: null,
          currentStage: 1,
          highestCompletedStage: 0,
          status: "in-progress",
          stageData: emptyStageData(),
        }),
    }),
    {
      name: "creditx-form-draft",
      partialize: (state) => ({
        formId: state.formId,
        currentStage: state.currentStage,
        highestCompletedStage: state.highestCompletedStage,
        status: state.status,
        stageData: state.stageData,
      }),
    },
  ),
);
