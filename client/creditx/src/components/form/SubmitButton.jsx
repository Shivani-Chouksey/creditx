/**
 * Submit button that subscribes to a TanStack Form and reflects the
 * form's real validity + submission state.
 *
 *  - Disabled while the form is invalid or submitting.
 *  - Disabled styling is clearly distinct so the user knows why the
 *    CTA can't be clicked (gray bg, muted text, not-allowed cursor).
 *  - Spinner icon shows while submitting.
 *  - When invalid, a helper hint nudges the user to fix errors above.
 *
 * Usage:
 *   <SubmitButton form={form}>Save & Continue</SubmitButton>
 */
const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const baseCls =
  "inline-flex items-center justify-center gap-2 py-2 px-6 rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1";
const enabledCls =
  "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm focus:ring-blue-500";
const enabledGreenCls =
  "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-sm focus:ring-green-500";
const disabledCls =
  "bg-gray-200 text-gray-400 cursor-not-allowed";

export function SubmitButton({
  form,
  children = "Save & Continue",
  loadingText = "Saving…",
  tone = "blue", // "blue" | "green"
  showHint = true,
}) {
  return (
    <form.Subscribe
      selector={(s) => [s.isSubmitting, s.canSubmit, s.isValid]}
    >
      {([isSubmitting, canSubmit, isValid]) => {
        const disabled = !canSubmit || isSubmitting;
        const paletteEnabled = tone === "green" ? enabledGreenCls : enabledCls;
        return (
          <div className="flex flex-col items-end gap-1">
            <button
              type="submit"
              disabled={disabled}
              aria-disabled={disabled}
              className={`${baseCls} ${disabled ? disabledCls : paletteEnabled}`}
            >
              {isSubmitting && <Spinner />}
              {isSubmitting ? loadingText : children}
            </button>
            {showHint && !isValid && !isSubmitting && (
              <span className="text-[11px] text-gray-400">
                Complete all required fields to continue
              </span>
            )}
          </div>
        );
      }}
    </form.Subscribe>
  );
}
