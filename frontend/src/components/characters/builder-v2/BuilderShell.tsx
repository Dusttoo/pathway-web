"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { IconStepProgress } from "./IconStepProgress";
import { visibleSteps, type StepDef } from "./steps";
import { DEFAULT_STATE, type BuilderState, type StepProps } from "./types";

import { StartStep } from "./steps/StartStep";
import { AncestryStep } from "./steps/AncestryStep";
import { HeritageStep } from "./steps/HeritageStep";
import { ClassStep } from "./steps/ClassStep";
import { CompanionStep } from "./steps/CompanionStep";
import { BackgroundStep } from "./steps/BackgroundStep";
import { AbilitiesStep } from "./steps/AbilitiesStep";
import { SkillsStep } from "./steps/SkillsStep";
import { FeatsStep } from "./steps/FeatsStep";
import { DescriptionStep } from "./steps/DescriptionStep";
import { PersonalityStep } from "./steps/PersonalityStep";
import { EquipmentStep } from "./steps/EquipmentStep";
import { SpellsStep } from "./steps/SpellsStep";
import { ReviewStep } from "./steps/ReviewStep";
import { StubStep } from "./steps/StubStep";

// Every step now has a real component — StubStep stays as a safety
// fallback if the step config drifts ahead of the components.
const STEP_COMPONENTS: Partial<Record<StepDef["key"], React.ComponentType<StepProps>>> = {
  start: StartStep,
  ancestry: AncestryStep,
  heritage: HeritageStep,
  class: ClassStep,
  companion: CompanionStep,
  background: BackgroundStep,
  abilities: AbilitiesStep,
  skills: SkillsStep,
  feats: FeatsStep,
  description: DescriptionStep,
  personality: PersonalityStep,
  equipment: EquipmentStep,
  spells: SpellsStep,
  review: ReviewStep,
};

export function BuilderShell() {
  const [state, setState] = useState<BuilderState>(DEFAULT_STATE);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = visibleSteps(state);

  // If a class change makes the current step disappear (e.g. user picked
  // a non-spellcaster and we were on the Spells step), snap back to the
  // last visible step that still exists.
  useEffect(() => {
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [steps.length, stepIndex]);

  const current = steps[stepIndex];
  const StepComponent = current ? STEP_COMPONENTS[current.key] : null;

  function update(patch: Partial<BuilderState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  const stepProps: StepProps = {
    state,
    update,
    onNext: () => setStepIndex((i) => Math.min(steps.length - 1, i + 1)),
    onBack: () => setStepIndex((i) => Math.max(0, i - 1)),
  };

  return (
    <div className="space-y-6">
      <IconStepProgress steps={steps} currentIndex={stepIndex} onJump={(i) => setStepIndex(i)} />

      <div className="card p-6">
        {current && (
          <div className="mb-4 pb-4 border-b border-border flex items-center gap-3">
            <current.icon size={22} className="text-primary" />
            <div>
              <h2 className="text-xl font-semibold leading-tight">{current.label}</h2>
              <p className="text-xs text-muted-foreground">
                Step {stepIndex + 1} of {steps.length}
              </p>
            </div>
          </div>
        )}

        {StepComponent ? (
          <StepComponent {...stepProps} />
        ) : (
          <StubStep {...stepProps} label={current?.label ?? "Step"} />
        )}
      </div>

      {/* Sticky bottom nav so Next is always reachable on long pages
          (the card grids in Ancestry/Class/Background can be tall).
          NB: don't use the .card class here — it forces column flex. */}
      <div className="sticky bottom-2 z-30">
        <div className="flex flex-row justify-between items-center gap-3 rounded-lg border-2 border-border bg-background/95 backdrop-blur-md shadow-lg px-4 py-3">
          <button
            type="button"
            onClick={stepProps.onBack}
            disabled={stepIndex === 0}
            className="btn-outline px-4 flex items-center gap-2 disabled:opacity-40"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Step {stepIndex + 1} / {steps.length} · {current?.label}
          </span>
          <button
            type="button"
            onClick={stepProps.onNext}
            disabled={stepIndex >= steps.length - 1}
            className="btn-primary px-4 flex items-center gap-2 disabled:opacity-40"
          >
            Next <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
