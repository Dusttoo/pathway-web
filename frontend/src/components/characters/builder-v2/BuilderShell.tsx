"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Save, Trash2 } from "lucide-react";
import { IconStepProgress } from "./IconStepProgress";
import { visibleSteps, type StepDef } from "./steps";
import { DEFAULT_STATE, type BuilderState, type StepProps } from "./types";
import {
  useCharacterBuilderDraft,
  useDeleteCharacterBuilderDraft,
  useSaveCharacterBuilderDraft,
} from "@/lib/hooks/use-character-builder-draft";

import { StartStep } from "./steps/StartStep";
import { AncestryStep } from "./steps/AncestryStep";
import { HeritageStep } from "./steps/HeritageStep";
import { LanguagesStep } from "./steps/LanguagesStep";
import { ClassStep } from "./steps/ClassStep";
import { ClassOptionsStep } from "./steps/ClassOptionsStep";
import { CompanionStep } from "./steps/CompanionStep";
import { BackgroundStep } from "./steps/BackgroundStep";
import { AbilitiesStep } from "./steps/AbilitiesStep";
import { SkillsStep } from "./steps/SkillsStep";
import { FeatsStep } from "./steps/FeatsStep";
import { DescriptionStep } from "./steps/DescriptionStep";
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
  languages: LanguagesStep,
  class: ClassStep,
  classOptions: ClassOptionsStep,
  companion: CompanionStep,
  background: BackgroundStep,
  abilities: AbilitiesStep,
  skills: SkillsStep,
  feats: FeatsStep,
  description: DescriptionStep,
  equipment: EquipmentStep,
  spells: SpellsStep,
  review: ReviewStep,
};

export function BuilderShell() {
  const [state, setState] = useState<BuilderState>(DEFAULT_STATE);
  const [stepIndex, setStepIndex] = useState(0);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);

  const draftQuery = useCharacterBuilderDraft<BuilderState>();
  const saveDraft = useSaveCharacterBuilderDraft<BuilderState>();
  const deleteDraft = useDeleteCharacterBuilderDraft();

  const steps = visibleSteps(state);
  const draft = draftQuery.data ?? null;

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
    if (draftMessage) setDraftMessage(null);
  }

  async function handleSaveDraft() {
    const saved = await saveDraft.mutateAsync({
      builder_state: state,
      current_step: stepIndex,
      name: state.name || "Untitled Character",
    });
    setDraftMessage(`Draft saved ${new Date(saved.updated_at).toLocaleString()}`);
  }

  function handleLoadDraft() {
    if (!draft) return;
    setState({ ...DEFAULT_STATE, ...draft.builder_state });
    setStepIndex(Math.max(0, Math.min(draft.current_step ?? 0, steps.length - 1)));
    setDraftMessage("Draft loaded.");
  }

  async function handleDeleteDraft() {
    await deleteDraft.mutateAsync();
    setDraftMessage("Draft deleted.");
  }

  const stepProps: StepProps = {
    state,
    update,
    onNext: () => setStepIndex((i) => Math.min(steps.length - 1, i + 1)),
    onBack: () => setStepIndex((i) => Math.max(0, i - 1)),
    onCreated: async () => {
      if (draft) await deleteDraft.mutateAsync();
    },
  };

  return (
    <div className="space-y-6">
      <IconStepProgress steps={steps} currentIndex={stepIndex} onJump={(i) => setStepIndex(i)} />

      <div className="rounded-lg border border-border bg-muted/30 p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Builder Draft</p>
          <p className="text-xs text-muted-foreground">
            {draft
              ? `Saved draft: ${draft.name} · ${new Date(draft.updated_at).toLocaleString()}`
              : "Save your current progress and come back later."}
          </p>
          {draftMessage && <p className="text-xs text-primary mt-1">{draftMessage}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {draft && (
            <button
              type="button"
              onClick={handleLoadDraft}
              disabled={draftQuery.isLoading}
              className="btn-outline px-3 py-1.5 text-xs"
            >
              Load Draft
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saveDraft.isPending}
            className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5"
          >
            {saveDraft.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Save size={13} />
            )}
            Save Draft
          </button>
          {draft && (
            <button
              type="button"
              onClick={handleDeleteDraft}
              disabled={deleteDraft.isPending}
              className="btn-outline px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              {deleteDraft.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Trash2 size={13} />
              )}
              Delete
            </button>
          )}
        </div>
      </div>

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
            onClick={handleSaveDraft}
            disabled={saveDraft.isPending}
            className="btn-outline px-3 py-2 text-xs hidden sm:flex items-center gap-1.5 disabled:opacity-40"
          >
            {saveDraft.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Save Draft
          </button>
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
