const STAGES = [
  { number: 1, label: "Basic Info",   short: "Basic" },
  { number: 2, label: "Address",      short: "Addr"  },
  { number: 3, label: "Professional", short: "Prof"  },
  { number: 4, label: "Documents",    short: "Docs"  },
  { number: 5, label: "Review",       short: "Rev"   },
];

/**
 * Responsive stepper.
 *  - On very narrow screens the connector bars tighten and labels use
 *    a shorter text ("Basic" → visible, "Basic Info" → sm+).
 *  - Active stage label always visible; inactive labels fade at the
 *    smallest breakpoint so the row fits without wrapping.
 */
export default function Stepper({ currentStage, highestCompletedStage, onSelect }) {
  return (
    <ol className="flex items-center w-full mb-6 sm:mb-8">
      {STAGES.map((s, idx) => {
        const isDone      = s.number <= highestCompletedStage;
        const isActive    = s.number === currentStage;
        const isReachable = s.number <= Math.max(highestCompletedStage + 1, currentStage);

        return (
          <li key={s.number} className="flex-1 flex items-center min-w-0">
            <button
              type="button"
              disabled={!isReachable || !onSelect}
              onClick={() => onSelect?.(s.number)}
              className={`flex flex-col items-center gap-1 w-full min-w-0 ${
                isReachable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              }`}
              aria-current={isActive ? "step" : undefined}
              aria-label={`Stage ${s.number}: ${s.label}`}
            >
              <span
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-semibold border-2 shrink-0 transition
                  ${
                    isActive
                      ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100"
                      : isDone
                      ? "bg-green-500 border-green-500 text-white"
                      : "bg-white border-gray-300 text-gray-500"
                  }`}
              >
                {isDone ? "✓" : s.number}
              </span>
              <span
                className={`text-[10px] sm:text-xs font-medium truncate max-w-full px-0.5 ${
                  isActive
                    ? "text-blue-600"
                    : isDone
                    ? "text-green-600"
                    : "text-gray-500"
                } ${isActive ? "" : "hidden xs:inline"}`}
              >
                <span className="sm:hidden">{s.short}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </span>
            </button>
            {idx < STAGES.length - 1 && (
              <span
                className={`h-0.5 flex-1 mx-0.5 sm:mx-1 shrink ${
                  s.number <= highestCompletedStage ? "bg-green-500" : "bg-gray-200"
                }`}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
