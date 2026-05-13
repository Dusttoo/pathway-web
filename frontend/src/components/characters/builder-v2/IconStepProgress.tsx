"use client";

import { Check } from "lucide-react";
import type { StepDef } from "./steps";

type Props = {
  steps: StepDef[];
  currentIndex: number;
  onJump?: (index: number) => void;
};

export function IconStepProgress({ steps, currentIndex, onJump }: Props) {
  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2 -mx-1 px-1">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const done = i < currentIndex;
        const active = i === currentIndex;
        const reachable = !!onJump;

        return (
          <div key={step.key} className="flex items-start shrink-0">
            {/* Connector line between dots */}
            {i > 0 && (
              <div
                className={`h-px w-4 sm:w-6 shrink-0 mt-6 transition-colors ${
                  done || active ? "bg-primary/70" : "bg-border"
                }`}
              />
            )}

            <button
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onJump?.(i)}
              className="flex flex-col items-center gap-1.5 shrink-0 px-1 group disabled:cursor-default"
              aria-current={active ? "step" : undefined}
              title={step.label}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all
                  ${
                    active
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg shadow-primary/20"
                      : done
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }
                  ${reachable ? "group-hover:scale-105" : ""}`}
              >
                {done ? <Check size={18} strokeWidth={3} /> : <Icon size={20} />}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "text-foreground"
                    : done
                      ? "text-muted-foreground"
                      : "text-muted-foreground/70"
                }`}
              >
                {step.label}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
