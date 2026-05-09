"use client";

import { useState } from "react";
import { StepProgress }        from "./StepProgress";
import { IdentityStep }        from "./IdentityStep";
import { AncestryStep }        from "./AncestryStep";
import { ClassBackgroundStep } from "./ClassBackgroundStep";
import { AbilitySkillStep }    from "./AbilitySkillStep";
import { ReviewStep }          from "./ReviewStep";
import { DEFAULT_STATE, type BuilderState } from "./types";

export function BuilderForm() {
  const [step,  setStep]  = useState(1);
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
      {step === 1 && <IdentityStep        {...stepProps} />}
      {step === 2 && <AncestryStep        {...stepProps} />}
      {step === 3 && <ClassBackgroundStep {...stepProps} />}
      {step === 4 && <AbilitySkillStep    {...stepProps} />}
      {step === 5 && <ReviewStep          {...stepProps} />}
    </div>
  );
}
