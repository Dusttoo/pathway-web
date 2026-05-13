"use client";

import { Info } from "lucide-react";
import type { StepProps, VariantRules } from "../types";

type Toggle = {
  key: keyof VariantRules;
  label: string;
  description: string;
  // Optional gate — toggle is disabled (and forced off) unless this returns true.
  // Used for Free Archetype sub-toggles that only make sense when FA is on.
  enabledWhen?: (v: VariantRules) => boolean;
};

const VARIANT_RULE_GROUPS: { title: string; description?: string; toggles: Toggle[] }[] = [
  {
    title: "Variant Rules",
    description: "GMG-style rule variants applied to this character.",
    toggles: [
      {
        key: "freeArchetype",
        label: "Free Archetype",
        description:
          "Grants an additional archetype feat at every even level (no class-feat opportunity cost).",
      },
      {
        key: "freeArchetypeNoRestrictions",
        label: "Remove Free Archetype feat restrictions",
        description: "Allow class feats / non-archetype feats into the free archetype slots.",
        enabledWhen: (v) => v.freeArchetype,
      },
      {
        key: "freeArchetypeNoAbilityReqs",
        label: "Remove Free Archetype ability requirements",
        description: "Ignore the attribute prerequisites on archetype dedication feats.",
        enabledWhen: (v) => v.freeArchetype,
      },
      {
        key: "ancestryParagon",
        label: "Ancestry Paragon",
        description:
          "Extra ancestry feats at levels 1, 3, 7, 11, 15 — for a lore-heavy ancestry focus.",
      },
      {
        key: "automaticBonusProgression",
        label: "Automatic Bonus Progression",
        description: "Replaces magic-item bonuses to attack/AC/saves with level-based numbers.",
      },
      {
        key: "proficiencyWithoutLevel",
        label: "Proficiency Without Level",
        description: "Stops adding character level to proficiency checks — flatter math curve.",
      },
    ],
  },
  {
    title: "Remaster & Mythic",
    description: "Toggles for Mythic destinies and Remaster-era spell revisions.",
    toggles: [
      {
        key: "showMythic",
        label: "Show Mythic options",
        description: "Surface War of Immortals mythic destinies in feat/spell selection.",
      },
      {
        key: "mythicViaCustomFeats",
        label: "Apply Mythic via custom feat choices only",
        description:
          "For tables running alternative mythic rules — skip the structured destiny UI.",
        enabledWhen: (v) => v.showMythic,
      },
      {
        key: "mythicDestiniesAsArchetypes",
        label: "Treat Mythic Destinies as high-level archetypes",
        description: "Use destinies as 17+ archetype slots rather than a parallel mythic track.",
        enabledWhen: (v) => v.showMythic,
      },
      {
        key: "updatedMagusPsychicSpells",
        label: "Use updated Magus / Psychic spells",
        description:
          "Adopt the Remaster spell list revisions for these classes (may require reload after picks).",
      },
    ],
  },
  {
    title: "Legacy GMG variants",
    description: "Older variants kept for tables that haven't migrated to current rules.",
    toggles: [
      {
        key: "legacyDualClassing",
        label: "Legacy GMG Dual Classing",
        description: "Each level grants both class' progression — high-power play.",
      },
      {
        key: "legacyStamina",
        label: "Legacy GMG Stamina",
        description: "Adds a stamina pool that absorbs damage before HP.",
      },
      {
        key: "legacyGradualBoost",
        label: "Legacy GMG Gradual Ability Boost",
        description: "Splits the level-5/10/15/20 boosts across multiple levels.",
      },
    ],
  },
];

function ToggleRow({
  toggle,
  value,
  disabled,
  onChange,
}: {
  toggle: Toggle;
  value: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-md border transition-colors cursor-pointer
        ${
          value ? "border-primary/50 bg-primary/5" : "border-border bg-card hover:border-primary/30"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input
        type="checkbox"
        checked={value && !disabled}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 accent-primary shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{toggle.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{toggle.description}</p>
      </div>
    </label>
  );
}

export function VariantRulesSection({ state, update }: Pick<StepProps, "state" | "update">) {
  const v = state.variantRules;

  function setRule<K extends keyof VariantRules>(key: K, next: VariantRules[K]) {
    update({ variantRules: { ...v, [key]: next } });
  }

  const activeCount = Object.values(v).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-start gap-2 text-sm text-muted-foreground">
        <Info size={16} className="shrink-0 mt-0.5 text-primary" />
        <p>
          These are <span className="font-medium text-foreground">optional</span>. Leave everything
          off for Rules-As-Written play. Toggles affect feat slots, math, and what content is
          surfaced later in the builder — change them now so the rest of the flow reflects the right
          rules.
          {activeCount > 0 && (
            <span className="ml-1 text-foreground font-medium">({activeCount} active)</span>
          )}
        </p>
      </div>

      {VARIANT_RULE_GROUPS.map((group) => (
        <section key={group.title}>
          <h3 className="text-sm font-semibold mb-1">{group.title}</h3>
          {group.description && (
            <p className="text-xs text-muted-foreground mb-3">{group.description}</p>
          )}
          <div className="space-y-2">
            {group.toggles.map((t) => {
              const enabledByGate = t.enabledWhen ? t.enabledWhen(v) : true;
              return (
                <ToggleRow
                  key={t.key}
                  toggle={t}
                  value={v[t.key]}
                  disabled={!enabledByGate}
                  onChange={(next) => setRule(t.key, next)}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
