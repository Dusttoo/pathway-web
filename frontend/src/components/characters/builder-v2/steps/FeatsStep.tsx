"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Gift,
  Info,
  Loader2,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useFeats, type FeatParams } from "@/lib/hooks/use-feats";
import type { FeatSlot, StepProps, BuilderState } from "../types";
import type { Tables } from "@/lib/types/database.types";

type Feat = Tables<"feats">;

type FeatWithAon = Feat & {
  aon_url?: string | null;
};

type FeatSlotKind = FeatSlot | "ancestry_paragon";

type SlotInstance = {
  id: string;
  saveSlot: FeatSlot;
  kind: FeatSlotKind;
  label: string;
  level: number;
  description: string;
  filterParams: (state: BuilderState) => FeatParams;
};

type PrereqResult = {
  ok: boolean;
  warnings: string[];
};

const SKILL_NAMES = [
  "acrobatics",
  "arcana",
  "athletics",
  "crafting",
  "deception",
  "diplomacy",
  "intimidation",
  "medicine",
  "nature",
  "occultism",
  "performance",
  "religion",
  "society",
  "stealth",
  "survival",
  "thievery",
];

const PROF_RANKS: Record<string, number> = {
  trained: 1,
  expert: 2,
  master: 3,
  legendary: 4,
};

const SKILL_LABELS = new Map(SKILL_NAMES.map((skill) => [skill, titleCase(skill)]));

const FEAT_DESCRIPTIONS: Record<FeatSlotKind, string> = {
  ancestry: "An ancestry feat comes from your ancestry or versatile heritage choices.",
  ancestry_paragon: "Ancestry Paragon grants extra ancestry feat slots at specific levels.",
  class: "A class feat improves or expands what your class can do.",
  general: "A general feat is a broad character option gained at key levels.",
  skill: "A skill feat improves a trained skill or unlocks a special skill use.",
  archetype: "An archetype feat comes from a dedication or multiclass path.",
  free_archetype:
    "Free Archetype grants separate archetype feat slots without spending class feat slots.",
  impulse:
    "A kineticist impulse feat is granted by your kinetic gate and does not consume class feat slots.",
  bonus: "A bonus feat is granted by a rule, feature, or campaign option.",
};

function levelRange(maxLevel: number): number[] {
  return Array.from({ length: Math.max(1, maxLevel) }, (_, i) => i + 1);
}

function featSlotsForLevel(state: BuilderState): SlotInstance[] {
  const slots: SlotInstance[] = [];

  for (const level of levelRange(state.level)) {
    if ([1, 5, 9, 13, 17].includes(level)) {
      slots.push({
        id: `ancestry-${level}`,
        saveSlot: "ancestry",
        kind: "ancestry",
        label: "Ancestry Feat",
        level,
        description: FEAT_DESCRIPTIONS.ancestry,
        filterParams: (s) => ({
          feat_type: "ancestry",
          ancestry: s.ancestryName,
          heritage: s.heritageName,
          level_max: level,
        }),
      });
    }

    if (state.variantRules.ancestryParagon && [1, 3, 7, 11, 15].includes(level)) {
      slots.push({
        id: `ancestry-paragon-${level}`,
        saveSlot: "bonus",
        kind: "ancestry_paragon",
        label: "Ancestry Paragon",
        level,
        description: FEAT_DESCRIPTIONS.ancestry_paragon,
        filterParams: (s) => ({
          feat_type: "ancestry",
          ancestry: s.ancestryName,
          heritage: s.heritageName,
          level_max: level,
        }),
      });
    }

    if (level === 1 || level % 2 === 0) {
      slots.push({
        id: `class-${level}`,
        saveSlot: "class",
        kind: "class",
        label: "Class Feat",
        level,
        description: FEAT_DESCRIPTIONS.class,
        filterParams: (s) => ({
          feat_type: "class_feat",
          class: s.className,
          level_max: level,
        }),
      });
    }

    if (level > 1 && level % 2 === 0) {
      slots.push({
        id: `skill-${level}`,
        saveSlot: "skill",
        kind: "skill",
        label: "Skill Feat",
        level,
        description: FEAT_DESCRIPTIONS.skill,
        filterParams: () => ({ feat_type: "skill", level_max: level }),
      });
    }

    if ([3, 7, 11, 15, 19].includes(level)) {
      slots.push({
        id: `general-${level}`,
        saveSlot: "general",
        kind: "general",
        label: "General Feat",
        level,
        description: FEAT_DESCRIPTIONS.general,
        filterParams: () => ({ feat_type: "general", level_max: level }),
      });
    }

    if (state.variantRules.freeArchetype && level > 1 && level % 2 === 0) {
      slots.push({
        id: `free-archetype-${level}`,
        saveSlot: "free_archetype",
        kind: "free_archetype",
        label: "Free Archetype",
        level,
        description: FEAT_DESCRIPTIONS.free_archetype,
        filterParams: () => ({ feat_type: "archetype", level_max: level }),
      });
    }
  }

  return slots.sort((a, b) => a.level - b.level || sortSlot(a.kind) - sortSlot(b.kind));
}

function sortSlot(kind: FeatSlotKind): number {
  return [
    "ancestry",
    "ancestry_paragon",
    "class",
    "skill",
    "general",
    "free_archetype",
    "archetype",
    "impulse",
    "bonus",
  ].indexOf(kind);
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function skillRank(state: BuilderState, skill: string): number {
  const key = normalize(skill);
  const classRank = state.classInitialProfs[key] ?? 0;
  const trainedRank = state.trainedSkills.includes(key) ? 1 : 0;
  const backgroundRank = normalize(state.backgroundTrainedSkill) === key ? 1 : 0;
  const additionalRank =
    state.additionalSkills.find((entry) => normalize(entry.name) === key)?.rank ?? 0;
  return Math.max(classRank, trainedRank, backgroundRank, additionalRank);
}

function selectedFeatNames(state: BuilderState): Set<string> {
  return new Set(state.selectedFeats.map((feat) => normalize(feat.feat_name)));
}

function prerequisiteStatus(feat: Feat, state: BuilderState, slot: SlotInstance): PrereqResult {
  const warnings: string[] = [];
  const prereq = feat.prerequisites?.trim();

  if (feat.level > slot.level) {
    warnings.push(`Requires feat level ${feat.level}. This slot is level ${slot.level}.`);
  }

  if (!prereq) return { ok: warnings.length === 0, warnings };

  const lower = prereq.toLowerCase();
  const names = selectedFeatNames(state);

  const abilityNames: Record<string, keyof BuilderState["abilities"]> = {
    strength: "str",
    str: "str",
    dexterity: "dex",
    dex: "dex",
    constitution: "con",
    con: "con",
    intelligence: "int",
    int: "int",
    wisdom: "wis",
    wis: "wis",
    charisma: "cha",
    cha: "cha",
  };

  for (const [label, key] of Object.entries(abilityNames)) {
    const match = lower.match(new RegExp(`\\b${label}\\s+(\\d{2})\\b`));
    if (match && state.abilities[key] < Number(match[1])) {
      warnings.push(`Requires ${label.toUpperCase()} ${match[1]}.`);
    }
  }

  for (const skill of SKILL_NAMES) {
    for (const [rankName, rank] of Object.entries(PROF_RANKS)) {
      if (lower.includes(`${rankName} in ${skill}`) && skillRank(state, skill) < rank) {
        warnings.push(`Requires ${titleCase(rankName)} in ${SKILL_LABELS.get(skill) ?? skill}.`);
      }
    }
  }

  if (state.className && lower.includes(`${normalize(state.className)} dedication`)) {
    const dedicationName = `${state.className} Dedication`;
    if (!names.has(normalize(dedicationName))) {
      warnings.push(`Requires ${dedicationName}.`);
    }
  }

  return { ok: warnings.length === 0, warnings };
}

function freeGrantedFeats(state: BuilderState): string[] {
  const granted: string[] = [];

  if (state.backgroundName) {
    granted.push(`Background skill feat from ${state.backgroundName}`);
  }

  if (state.className) {
    granted.push(`Class starting features from ${state.className}`);
  }

  if (state.heritageName) {
    granted.push(`Heritage features from ${state.heritageName}`);
  }

  return granted;
}

function selectedForSlot(state: BuilderState, slot: SlotInstance) {
  return state.selectedFeats.find(
    (feat) => feat.feat_slot === slot.saveSlot && feat.level_acquired === slot.level
  );
}

export function FeatsStep({ state, update }: StepProps) {
  const slots = useMemo(() => featSlotsForLevel(state), [state]);
  const [activeSlotId, setActiveSlotId] = useState(slots[0]?.id ?? "");
  const [searchQ, setSearchQ] = useState("");
  const activeSlot = slots.find((slot) => slot.id === activeSlotId) ?? slots[0];

  const selectedCount = slots.filter((slot) => selectedForSlot(state, slot)).length;
  const requiredCount = slots.length;
  const freeFeats = freeGrantedFeats(state);

  const params: FeatParams = useMemo(
    () =>
      activeSlot
        ? { ...activeSlot.filterParams(state), q: searchQ || undefined, limit: 100 }
        : { limit: 100 },
    [activeSlot, state, searchQ]
  );

  const { data, isLoading } = useFeats(params, { enabled: !!activeSlot });
  const feats: Feat[] = data?.data ?? [];
  const selectedIds = new Set(state.selectedFeats.map((feat) => feat.feat_id));

  function chooseSlot(slot: SlotInstance) {
    setActiveSlotId(slot.id);
    setSearchQ("");
  }

  function addFeat(feat: Feat) {
    if (!activeSlot) return;
    const prereq = prerequisiteStatus(feat, state, activeSlot);
    if (!prereq.ok) return;

    const next = state.selectedFeats.filter(
      (selected) =>
        !(
          selected.feat_slot === activeSlot.saveSlot && selected.level_acquired === activeSlot.level
        )
    );

    update({
      selectedFeats: [
        ...next,
        {
          feat_id: feat.id,
          feat_name: feat.name,
          feat_slot: activeSlot.saveSlot,
          level_acquired: activeSlot.level,
        },
      ],
    });
  }

  function removeSlot(slot: SlotInstance) {
    update({
      selectedFeats: state.selectedFeats.filter(
        (selected) =>
          !(selected.feat_slot === slot.saveSlot && selected.level_acquired === slot.level)
      ),
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Feat Slots</h3>
            <p className="text-sm text-muted-foreground">
              Choose feats for each slot your level and variant rules grant.
            </p>
          </div>
          <div className="rounded-md border border-border px-3 py-2 text-sm">
            <span className="font-semibold">{selectedCount}</span>
            <span className="text-muted-foreground"> / {requiredCount} selected</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-primary shrink-0 mt-0.5" />
            <span>Slots are grouped by level like a character builder checklist.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
            <span>Each slot accepts one matching feat and replaces the old pick.</span>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <span>
              Known level, ability, skill-rank, and dedication prerequisites are enforced.
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        <div className="space-y-3">
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-3 py-2 bg-muted/40 border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Required choices
            </div>
            <div className="max-h-[520px] overflow-y-auto divide-y divide-border">
              {slots.map((slot) => {
                const selected = selectedForSlot(state, slot);
                const active = activeSlot?.id === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => chooseSlot(slot)}
                    className={`w-full text-left p-3 transition-colors ${
                      active ? "bg-primary/10" : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          selected
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {selected ? <CheckCircle2 size={17} /> : <Sparkles size={15} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground">Level {slot.level}</p>
                          <span className="text-[10px] rounded bg-muted px-1.5 py-0.5 uppercase text-muted-foreground">
                            {slot.kind.replace("_", " ")}
                          </span>
                        </div>
                        <p className="font-medium">{slot.label}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {selected?.feat_name ?? "Choose a feat"}
                        </p>
                      </div>
                      {selected && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(event) => {
                            event.stopPropagation();
                            removeSlot(slot);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              event.stopPropagation();
                              removeSlot(slot);
                            }
                          }}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Clear feat"
                        >
                          <X size={13} />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-border p-3 space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Gift size={15} className="text-primary" />
              Free granted features
            </h3>
            <p className="text-xs text-muted-foreground">
              These are granted by choices you already made, so they do not consume feat slots.
            </p>
            <div className="space-y-1.5">
              {freeFeats.map((feat) => (
                <div key={feat} className="rounded-md bg-muted/40 px-2 py-1.5 text-sm">
                  Free: {feat}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {activeSlot && (
            <div className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Level {activeSlot.level}</p>
                  <h3 className="text-lg font-semibold">{activeSlot.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{activeSlot.description}</p>
                </div>
                {selectedForSlot(state, activeSlot) && (
                  <div className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                    Selected: {selectedForSlot(state, activeSlot)?.feat_name}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              className="input w-full pl-8"
              placeholder={`Search ${activeSlot?.label.toLowerCase() ?? "feats"}...`}
              value={searchQ}
              onChange={(event) => setSearchQ(event.target.value)}
            />
          </div>

          <div className="border border-border rounded-md max-h-[620px] overflow-y-auto divide-y divide-border">
            {isLoading && (
              <div className="p-4 flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 size={14} className="animate-spin" /> Loading feats...
              </div>
            )}
            {!isLoading && feats.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                No matching feats found for this slot.
              </div>
            )}
            {activeSlot &&
              feats.map((feat) => {
                const aonUrl = (feat as FeatWithAon).aon_url;
                const prereq = prerequisiteStatus(feat, state, activeSlot);
                const selectedInSlot = selectedForSlot(state, activeSlot)?.feat_id === feat.id;
                const selectedElsewhere = selectedIds.has(feat.id) && !selectedInSlot;
                const disabled = !prereq.ok || selectedElsewhere;

                return (
                  <div key={feat.id} className="p-4 space-y-3 hover:bg-muted/20">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{feat.name}</span>
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            Lvl {feat.level}
                          </span>
                          {feat.action_cost && (
                            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono">
                              {feat.action_cost}
                            </span>
                          )}
                          {feat.rarity && feat.rarity !== "Common" && (
                            <span className="text-[10px] text-amber-500">{feat.rarity}</span>
                          )}
                        </div>
                        {feat.prerequisites && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            Prereq: {feat.prerequisites}
                          </p>
                        )}
                        {aonUrl && (
                          <a
                            href={aonUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            onClick={(event) => event.stopPropagation()}
                          >
                            View on Archives of Nethys <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => addFeat(feat)}
                        disabled={disabled || selectedInSlot}
                        className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40 shrink-0"
                      >
                        {selectedInSlot
                          ? "Selected"
                          : selectedElsewhere
                            ? "Already picked"
                            : "Select"}
                      </button>
                    </div>

                    {prereq.warnings.length > 0 && (
                      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-500">
                        {prereq.warnings.join(" ")}
                      </div>
                    )}

                    {feat.description && (
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {feat.description}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
