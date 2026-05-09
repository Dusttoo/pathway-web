"use client";

const STEPS = [
  "Identity",
  "Ancestry",
  "Class & Background",
  "Ability Scores & Skills",
  "Review & Create",
];

export function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
      {STEPS.map((label, i) => {
        const stepNum  = i + 1;
        const done     = stepNum < current;
        const active   = stepNum === current;
        return (
          <div key={label} className="flex items-center min-w-0">
            {/* Connector line */}
            {i > 0 && (
              <div
                className={`h-px w-6 shrink-0 mx-1 ${done || active ? "bg-primary" : "bg-border"}`}
              />
            )}
            {/* Step dot + label */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done    ? "bg-primary/60 text-primary-foreground"
                  : active ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                           : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? "✓" : stepNum}
              </div>
              <span
                className={`text-[10px] whitespace-nowrap ${
                  active ? "text-foreground font-semibold" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
