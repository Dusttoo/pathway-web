"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Backpack,
  BookOpen,
  Check,
  Circle,
  Gauge,
  GraduationCap,
  HeartPulse,
  Loader2,
  Menu,
  Save,
  Shield,
  Sparkles,
  Trash2,
} from "lucide-react";
import { visibleSteps, type StepDef } from "./steps";
import { BeginnerLayout } from "./BeginnerLayout";
import { TermModeProvider } from "./glossary";
import { STEP_GUIDES } from "./step-guides";
import { stepHint } from "./step-hints";
import { DEFAULT_STATE, type AbilityKey, type BuilderFocus, type BuilderState, type StepProps } from "./types";
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
import { ProgressionStep } from "./steps/ProgressionStep";
import { DescriptionStep } from "./steps/DescriptionStep";
import { EquipmentStep } from "./steps/EquipmentStep";
import { SpellsStep } from "./steps/SpellsStep";
import { ReviewStep } from "./steps/ReviewStep";
import { StubStep } from "./steps/StubStep";

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
  progression: ProgressionStep,
  description: DescriptionStep,
  equipment: EquipmentStep,
  spells: SpellsStep,
  review: ReviewStep,
};

const SAVE_ABILITY: Record<string, AbilityKey> = {
  fortitude: "con",
  reflex: "dex",
  will: "wis",
};

const ABILITY_LABELS: Array<[AbilityKey, string]> = [
  ["str", "STR"],
  ["dex", "DEX"],
  ["con", "CON"],
  ["int", "INT"],
  ["wis", "WIS"],
  ["cha", "CHA"],
];

const PROF_LABELS = ["U", "T", "E", "M", "L"];

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function signed(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

function profBonus(rank: number, level: number): number {
  return rank > 0 ? level + rank * 2 : 0;
}

function profRank(value: unknown): number {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : 0;
  if (numeric > 4) return Math.max(0, Math.min(4, Math.round(numeric / 2)));
  return Math.max(0, Math.min(4, Math.round(numeric)));
}

function stepStatus(index: number, currentIndex: number) {
  if (index < currentIndex) return "done";
  if (index === currentIndex) return "active";
  return "open";
}

function StepBadge({ step, status }: { step: StepDef; status: "done" | "active" | "open" }) {
  const Icon = step.icon;
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
        status === "active"
          ? "border-[#d8a646] bg-[#d8a646] text-white"
          : status === "done"
            ? "border-[#c9a227]/60 bg-[#c9a227]/20 text-[#f2d269]"
            : "border-[#31445d] bg-[#202a35] text-[#9cabbd]"
      }`}
    >
      {status === "done" ? <Check size={18} /> : <Icon size={18} />}
    </span>
  );
}

function PlanButton({
  step,
  index,
  currentIndex,
  onClick,
}: {
  step: StepDef;
  index: number;
  currentIndex: number;
  onClick: () => void;
}) {
  const status = stepStatus(index, currentIndex);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors ${
        status === "active"
          ? "border-[#d8a646] bg-[#2c3440] text-white"
          : "border-[#31445d] bg-[#202831] text-[#dce5ee] hover:border-[#6f86a3]"
      }`}
    >
      <StepBadge step={step} status={status} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{step.label}</span>
        <span className="block truncate text-[11px] text-[#9cabbd]">
          {status === "done" ? "Complete" : status === "active" ? "Editing now" : "Open"}
        </span>
      </span>
    </button>
  );
}

function IdentityCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-[#31445d] bg-[#202831] px-3 py-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#31445d] text-[#dce5ee]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] uppercase tracking-wide text-[#9cabbd]">{label}</span>
        <span className="block truncate text-sm font-semibold text-white">{value || "Not selected"}</span>
      </span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-[#151a20] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[#9cabbd]">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function ProfPip({ rank }: { rank: number }) {
  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
        rank > 0 ? "bg-[#d8a646] text-white" : "bg-[#31445d] text-[#b8c6d6]"
      }`}
      title={PROF_LABELS[rank] ?? "U"}
    >
      {PROF_LABELS[rank] ?? "U"}
    </span>
  );
}

export function BuilderShell() {
  const [state, setState] = useState<BuilderState>(DEFAULT_STATE);
  const [stepIndex, setStepIndex] = useState(0);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [focus, setFocus] = useState<BuilderFocus | null>(null);
  // Beginner Mode: focused one-step-at-a-time flow + extra guidance, hiding
  // advanced rules. Defaults on for first-time players; the choice is
  // remembered in localStorage so returning users keep their preference.
  const [beginnerMode, setBeginnerMode] = useState(true);

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("pf2e-builder-beginner")
        : null;
    if (saved !== null) setBeginnerMode(saved === "1");
  }, []);

  function toggleBeginnerMode() {
    setBeginnerMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("pf2e-builder-beginner", next ? "1" : "0");
      }
      return next;
    });
  }

  const draftQuery = useCharacterBuilderDraft<BuilderState>();
  const saveDraft = useSaveCharacterBuilderDraft<BuilderState>();
  const deleteDraft = useDeleteCharacterBuilderDraft();

  const steps = visibleSteps(state);
  const draft = draftQuery.data ?? null;

  useEffect(() => {
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [steps.length, stepIndex]);

  const current = steps[stepIndex];
  const StepComponent = current ? STEP_COMPONENTS[current.key] : null;

  const sheetPreview = useMemo(() => {
    const level = Math.max(1, Number(state.level) || 1);
    const conMod = abilityMod(state.abilities.con);
    const maxHp = state.ancestryHp + level * (state.classHp + conMod);
    const ac = 10 + abilityMod(state.abilities.dex) + profBonus(profRank(state.classInitialProfs.unarmored), level);
    const classAbility = (state.keyability?.toLowerCase() || "str") as AbilityKey;
    const classDcRank = profRank(state.classInitialProfs.class_dc ?? state.classInitialProfs.classDC);
    const classDc = classDcRank
      ? 10 + abilityMod(state.abilities[classAbility] ?? state.abilities.str) + profBonus(classDcRank, level)
      : null;
    const saves = Object.entries(SAVE_ABILITY).map(([key, ability]) => {
      const rank = profRank(state.classInitialProfs[key]);
      return {
        key,
        label: key === "fortitude" ? "Fortitude" : key === "reflex" ? "Reflex" : "Will",
        rank,
        total: abilityMod(state.abilities[ability]) + profBonus(rank, level),
      };
    });
    return { level, maxHp, ac, classDc, saves };
  }, [state]);

  function update(patch: Partial<BuilderState>) {
    setState((prev) => ({ ...prev, ...patch }));
    if (draftMessage) setDraftMessage(null);
    if (focus) setFocus(null);
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
    onJump: (stepKey, nextFocus) => {
      const nextIndex = steps.findIndex((step) => step.key === stepKey);
      if (nextIndex >= 0) {
        setFocus(nextFocus ?? null);
        setStepIndex(nextIndex);
      }
    },
    focus,
    beginnerMode,
    onCreated: async () => {
      if (draft) await deleteDraft.mutateAsync();
    },
  };

  const stepNode = StepComponent ? (
    <StepComponent {...stepProps} />
  ) : (
    <StubStep {...stepProps} label={current?.label ?? "Step"} />
  );

  return (
    <TermModeProvider active={beginnerMode}>
    <div className="pb-builder-workspace">
      <div className="pb-builder-subbar">
        <div className="flex min-w-0 items-center gap-3">
          <Menu size={28} className="text-white" />
          <div className="min-w-0">
            <p className="text-2xl font-semibold leading-none text-white">Character Builder</p>
            <p className="mt-1 truncate text-sm text-[#b8c6d6]">
              {state.name || "New Character"} {state.className ? `- ${state.className}` : ""}{" "}
              {sheetPreview.level ? sheetPreview.level : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleBeginnerMode}
            aria-pressed={beginnerMode}
            title={
              beginnerMode
                ? "Beginner Mode is on: guided, one step at a time. Click to switch to the full builder."
                : "Full builder view. Click to turn Beginner Mode back on."
            }
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
              beginnerMode
                ? "border-[#4dbfb0] bg-[#4dbfb0]/15 text-[#9fd5c9]"
                : "border-[#31445d] bg-[#202831] text-[#b8c6d6] hover:border-[#6f86a3]"
            }`}
          >
            <GraduationCap size={15} />
            New to Pathfinder?
            <span
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                beginnerMode ? "bg-[#4dbfb0]" : "bg-[#31445d]"
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  beginnerMode ? "translate-x-3.5" : "translate-x-0.5"
                }`}
              />
            </span>
          </button>
          {draft && (
            <button type="button" onClick={handleLoadDraft} className="rounded-md border border-[#31445d] px-3 py-1.5 text-sm text-white hover:bg-[#202831]">
              Load Draft
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saveDraft.isPending}
            className="inline-flex items-center gap-2 rounded-md border border-[#c9a227] bg-[#c9a227] px-3 py-1.5 text-sm font-semibold text-[#11161c] disabled:opacity-60"
          >
            {saveDraft.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Draft
          </button>
          {draft && (
            <button
              type="button"
              onClick={handleDeleteDraft}
              disabled={deleteDraft.isPending}
              className="inline-flex items-center gap-2 rounded-md border border-[#31445d] px-3 py-1.5 text-sm text-white hover:bg-[#202831] disabled:opacity-60"
            >
              {deleteDraft.isPending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              Delete
            </button>
          )}
        </div>
      </div>

      {(draftMessage || draft) && (
        <div className="border-b border-[#263545] bg-[#1d2530] px-4 py-2 text-xs text-[#b8c6d6]">
          {draftMessage ||
            `Saved draft: ${draft?.name} - ${draft ? new Date(draft.updated_at).toLocaleString() : ""}`}
        </div>
      )}

      {beginnerMode ? (
        <BeginnerLayout
          steps={steps}
          stepIndex={stepIndex}
          current={current}
          guide={current ? STEP_GUIDES[current.key] : undefined}
          hint={current ? stepHint(current.key, state) : null}
          summary={{
            name: state.name,
            ancestry: state.ancestryName,
            className: state.className,
            level: sheetPreview.level,
            ac: sheetPreview.ac,
            hp: sheetPreview.maxHp,
          }}
          onJump={(index) => setStepIndex(index)}
          onBack={stepProps.onBack}
          onNext={stepProps.onNext}
        >
          {stepNode}
        </BeginnerLayout>
      ) : (
      <div className="pb-builder-grid">
        <aside className="pb-builder-plan">
          <div className="space-y-2">
            <IdentityCard icon={<Sparkles size={18} />} label="Ancestry" value={state.ancestryName} />
            <IdentityCard icon={<BookOpen size={18} />} label="Background" value={state.backgroundName} />
            <IdentityCard icon={<Shield size={18} />} label="Class" value={state.className} />
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#d8a646]">Build Plan</h2>
              <span className="text-xs text-[#9cabbd]">
                {stepIndex + 1}/{steps.length}
              </span>
            </div>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <PlanButton
                  key={step.key}
                  step={step}
                  index={index}
                  currentIndex={stepIndex}
                  onClick={() => setStepIndex(index)}
                />
              ))}
            </div>
          </div>
        </aside>

        <aside className="pb-builder-stats">
          <div className="space-y-3">
            <div className="rounded-lg border border-[#263545] bg-[#202831] p-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-[#9cabbd]">
                  Level
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={state.level}
                    onChange={(event) =>
                      update({ level: Math.max(1, Math.min(20, Number(event.target.value) || 1)) })
                    }
                    className="mt-1 h-9 w-full rounded-md border border-[#31445d] bg-[#151a20] px-2 text-sm text-white"
                  />
                </label>
                <label className="text-xs text-[#9cabbd]">
                  XP
                  <input
                    type="number"
                    min={0}
                    value={0}
                    readOnly
                    className="mt-1 h-9 w-full rounded-md border border-[#31445d] bg-[#151a20] px-2 text-sm text-white"
                  />
                </label>
              </div>
              <label className="mt-2 block text-xs text-[#9cabbd]">
                Character Name
                <input
                  type="text"
                  value={state.name}
                  onChange={(event) => update({ name: event.target.value })}
                  placeholder="Character name"
                  className="mt-1 h-9 w-full rounded-md border border-[#31445d] bg-[#151a20] px-2 text-sm text-white placeholder:text-[#6f7f90]"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="AC" value={sheetPreview.ac} />
              <MiniStat label="HP" value={sheetPreview.maxHp} />
              <MiniStat label="Speed" value={`${state.ancestrySpeed || 25} ft`} />
              <MiniStat label="Class DC" value={sheetPreview.classDc ?? "-"} />
            </div>

            <div className="rounded-lg border border-[#263545] bg-[#202831] p-3">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                <Gauge size={16} className="text-[#c9a227]" />
                Abilities
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {ABILITY_LABELS.map(([key, label]) => (
                  <div key={key} className="rounded-md bg-[#151a20] px-2 py-1.5 text-center">
                    <p className="text-[10px] text-[#9cabbd]">{label}</p>
                    <p className="text-sm font-bold text-white">{signed(abilityMod(state.abilities[key]))}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#263545] bg-[#202831] p-3">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                <HeartPulse size={16} className="text-[#4dbfb0]" />
                Saves
              </h3>
              <div className="space-y-2">
                {sheetPreview.saves.map((save) => (
                  <div key={save.key} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2">
                      <ProfPip rank={save.rank} />
                      {save.label}
                    </span>
                    <span className="font-semibold text-white">{signed(save.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#263545] bg-[#202831] p-3">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                <Backpack size={16} className="text-[#c9a227]" />
                Quick Counts
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <MiniStat label="Skills" value={state.trainedSkills.length + state.additionalSkills.length} />
                <MiniStat label="Feats" value={state.selectedFeats.length} />
                <MiniStat label="Items" value={state.selectedItems.length} />
                <MiniStat label="Spells" value={state.selectedSpells.length} />
              </div>
            </div>
          </div>
        </aside>

        <main className="pb-builder-main">
          <div className="border-b border-[#263545] bg-[#161b22] px-4 pt-3">
            <div className="flex gap-1 overflow-x-auto">
              {steps.map((step, index) => {
                const status = stepStatus(index, stepIndex);
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setStepIndex(index)}
                    className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors ${
                      status === "active"
                        ? "border-[#d8a646] text-[#d8a646]"
                        : "border-transparent text-[#9cabbd] hover:text-white"
                    }`}
                  >
                    {status === "done" ? <Check size={14} /> : <Circle size={10} />}
                    {step.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pb-builder-content">
            <div className="rounded-lg border border-[#263545] bg-[#1c242e] p-4">
              {current && (
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#31445d] pb-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <StepBadge step={current} status="active" />
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-semibold text-white">{current.label}</h2>
                      <p className="text-xs text-[#9cabbd]">
                        Step {stepIndex + 1} of {steps.length}
                      </p>
                    </div>
                  </div>
                  <div className="hidden gap-2 sm:flex">
                    <button
                      type="button"
                      onClick={stepProps.onBack}
                      disabled={stepIndex === 0}
                      className="inline-flex items-center gap-2 rounded-md border border-[#31445d] px-3 py-1.5 text-sm text-white hover:bg-[#202831] disabled:opacity-40"
                    >
                      <ArrowLeft size={15} />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={stepProps.onNext}
                      disabled={stepIndex >= steps.length - 1}
                      className="inline-flex items-center gap-2 rounded-md border border-[#d8a646] bg-[#d8a646] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
                    >
                      Next
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              <div className="builder-workspace-surface">{stepNode}</div>
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-[#263545] bg-[#11161c]/95 px-4 py-3 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={stepProps.onBack}
                disabled={stepIndex === 0}
                className="inline-flex items-center gap-2 rounded-md border border-[#31445d] px-4 py-2 text-sm text-white hover:bg-[#202831] disabled:opacity-40"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <button
                type="button"
                onClick={stepProps.onNext}
                disabled={stepIndex >= steps.length - 1}
                className="inline-flex items-center gap-2 rounded-md border border-[#d8a646] bg-[#d8a646] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Next
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </main>
      </div>
      )}
    </div>
    </TermModeProvider>
  );
}
