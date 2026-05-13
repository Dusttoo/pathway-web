"use client";

import { useState } from "react";
import { StepProgress } from "./StepProgress";
import { ClassBackgroundStep } from "./ClassBackgroundStep";
import { FeatsStep } from "./FeatsStep";
import { SpellsStep } from "./SpellsStep";
import { StartStep } from "./StartStep";
import { AbilitySkillStep } from "./AbilitySkillStep";
import { ReviewStep } from "./ReviewStep";
import { DEFAULT_STATE, type BuilderState } from "./types";

export function BuilderForm() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<BuilderState>(DEFAULT_STATE);

  function update(patch: Partial<BuilderState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  const stepProps = {
    state,
    update,
    onNext: () => setStep((s) => s + 1),
    onBack: () => setStep((s) => s - 1),
  };

  return (
    <div>
      <StepProgress current={step} />
      {step === 1 && <StartStep {...stepProps} />}
      {step === 2 && <ClassBackgroundStep {...stepProps} />}
      {step === 3 && <FeatsStep {...stepProps} />}
      {step === 4 && <SpellsStep {...stepProps} />}
      {step === 5 && <AbilitySkillStep {...stepProps} />}
      {step === 6 && <ReviewStep {...stepProps} />}
    </div>
  );
}
