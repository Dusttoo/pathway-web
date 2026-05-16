"use client";

import React, { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronDown,
  Info,
  Loader2,
  Wand2,
  AlertTriangle,
  X,
} from "lucide-react";
import {
  useHomebrewClasses,
  useCreateHomebrewClass,
  useUpdateHomebrewClass,
  useDeleteHomebrewClass,
} from "@/lib/hooks/use-homebrew-content";
import { NumberStepper } from "@/components/characters/NumberStepper";

// ── Constants ─────────────────────────────────────────────────────────────────

const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"] as const;
const SPELL_TRADITIONS = ["arcane", "divine", "occult", "primal"] as const;
const SPELLCASTING_TYPES = [
  { value: "prepared", label: "Prepared Spellbook" },
  { value: "spontaneous", label: "Spontaneous Repertoire" },
] as const;
const SPELL_RANKS = Array.from({ length: 10 }, (_, i) => i + 1);
const CASTING_LEVELS = Array.from({ length: 20 }, (_, i) => i + 1);
const SKILLS = [
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
] as const;

const PROFICIENCY_RANKS = [
  { value: 0, label: "Untrained" },
  { value: 2, label: "Trained" },
  { value: 4, label: "Expert" },
  { value: 6, label: "Master" },
  { value: 8, label: "Legendary" },
] as const;

const DEFAULT_CLASS_PROFICIENCIES: Record<string, number> = {
  classDC: 2,
  perception: 2,
  fortitude: 2,
  reflex: 2,
  will: 2,
  unarmored: 2,
  light: 2,
  medium: 0,
  heavy: 0,
  unarmed: 2,
  simple: 2,
  martial: 0,
  advanced: 0,
  castingArcane: 0,
  castingDivine: 0,
  castingOccult: 0,
  castingPrimal: 0,
};

const PROFICIENCY_GROUPS = [
  {
    title: "Core",
    items: [
      ["classDC", "Class DC"],
      ["perception", "Perception"],
    ],
  },
  {
    title: "Saving Throws",
    items: [
      ["fortitude", "Fortitude"],
      ["reflex", "Reflex"],
      ["will", "Will"],
    ],
  },
  {
    title: "Armor",
    items: [
      ["unarmored", "Unarmored"],
      ["light", "Light Armor"],
      ["medium", "Medium Armor"],
      ["heavy", "Heavy Armor"],
    ],
  },
  {
    title: "Attacks",
    items: [
      ["unarmed", "Unarmed Attacks"],
      ["simple", "Simple Weapons"],
      ["martial", "Martial Weapons"],
      ["advanced", "Advanced Weapons"],
    ],
  },
  {
    title: "Spellcasting",
    items: [
      ["castingArcane", "Arcane"],
      ["castingDivine", "Divine"],
      ["castingOccult", "Occult"],
      ["castingPrimal", "Primal"],
    ],
  },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

type ClassItem = {
  id: string;
  name: string;
  class_hp?: number;
  key_attribute?: string[];
  is_spellcaster?: boolean;
  spellcasting_ability?: string;
  description?: string;
  class_trained_skills: string[];
  class_lore_skills: string[];
  class_proficiencies: Record<string, number>;
  spellcasting_type?: "prepared" | "spontaneous";
  spellcasting_tradition?: "arcane" | "divine" | "occult" | "primal";
  cantrips_known: number;
  focus_points: number;
  spell_slot_progression: Record<string, number[]>;
  spells_known_progression: Record<string, number[]>;
  trained_skill_count: number;
};

function cleanLoreSkill(value: string): string {
  const topic = value
    .trim()
    .replace(/\s+lore$/i, "")
    .replace(/\s+/g, " ");
  return topic ? `${topic} Lore` : "";
}

function loreKey(value: string): string {
  return cleanLoreSkill(value)
    .replace(/\s+lore$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function slotRow(value: unknown, max = 9): number[] {
  const row = Array.isArray(value) ? value : [];
  return Array.from({ length: 10 }, (_, i) => {
    const raw = row[i];
    const n = typeof raw === "number" ? raw : parseInt(String(raw ?? "0"), 10);
    return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0;
  });
}

function slotProgression(value: unknown, max = 9): Record<string, number[]> {
  const input =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => {
      const level = String(i + 1);
      return [level, slotRow(input[level], max)];
    })
  );
}

function progressionSummary(progression: Record<string, number[]>): string {
  const rows = Object.entries(progression)
    .filter(([, slots]) => slots.some((slot) => slot > 0))
    .map(([level, slots]) => `L${level}: ${slots.map((slot) => slot || "-").join("/")}`);
  return rows.slice(0, 2).join("; ") + (rows.length > 2 ? " ..." : "");
}

function maxSpellRankForLevel(level: number): number {
  return Math.min(10, Math.max(1, Math.ceil(level / 2)));
}

function HelpTip({ children, label = "Help" }: { children: React.ReactNode; label?: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        className="inline-flex min-h-8 min-w-8 touch-manipulation items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground focus:outline-none"
        aria-label={label}
      >
        <Info size={15} />
      </button>
      <span className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-72 rounded-md border border-border bg-background p-3 text-left text-xs leading-relaxed text-muted-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {children}
      </span>
    </span>
  );
}

function toItem(raw: Record<string, unknown>): ClassItem {
  // Extract class_trained_skills from initial_proficiencies (any skill at rank 2)
  const profs = (raw.initial_proficiencies ?? {}) as Record<string, unknown>;
  const class_trained_skills = SKILLS.filter((s) => profs[s] === 2);
  const meta = (raw.class_metadata ?? {}) as Record<string, unknown>;
  const class_lore_skills = Array.isArray(meta.class_lore_skills)
    ? meta.class_lore_skills
        .map((skill) => (typeof skill === "string" ? cleanLoreSkill(skill) : ""))
        .filter(Boolean)
    : Object.entries(profs)
        .filter(([key, rank]) => key.startsWith("lore:") && rank === 2)
        .map(([key]) => cleanLoreSkill(key.slice("lore:".length).replace(/[_-]+/g, " ")))
        .filter(Boolean);
  const class_proficiencies = Object.fromEntries(
    Object.entries(DEFAULT_CLASS_PROFICIENCIES).map(([key, fallback]) => [
      key,
      typeof profs[key] === "number" ? Number(profs[key]) : fallback,
    ])
  );
  const spellcasting_type = meta.spellcasting_type === "spontaneous" ? "spontaneous" : "prepared";
  const spellcasting_tradition = SPELL_TRADITIONS.includes(meta.spellcasting_tradition as never)
    ? (meta.spellcasting_tradition as ClassItem["spellcasting_tradition"])
    : undefined;

  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    class_hp: typeof raw.class_hp === "number" ? raw.class_hp : undefined,
    key_attribute: Array.isArray(raw.key_attribute)
      ? (raw.key_attribute as string[])
      : raw.key_attribute
        ? [String(raw.key_attribute)]
        : [],
    is_spellcaster: !!raw.is_spellcaster,
    spellcasting_ability: raw.spellcasting_ability ? String(raw.spellcasting_ability) : undefined,
    description: raw.description ? String(raw.description) : undefined,
    class_trained_skills,
    class_lore_skills,
    class_proficiencies,
    spellcasting_type,
    spellcasting_tradition,
    cantrips_known: typeof meta.cantrips_known === "number" ? meta.cantrips_known : 5,
    focus_points: typeof meta.focus_points === "number" ? meta.focus_points : 0,
    spell_slot_progression: slotProgression(meta.spell_slot_progression),
    spells_known_progression: slotProgression(
      meta.spells_known_progression ?? meta.repertoire_progression,
      20
    ),
    trained_skill_count:
      typeof meta.trained_skill_count === "number" ? meta.trained_skill_count : 3,
  };
}

// ── Class Form ────────────────────────────────────────────────────────────────

function ClassForm({ initialValues, onDone }: { initialValues?: ClassItem; onDone: () => void }) {
  const isEditing = !!initialValues?.id;
  const create = useCreateHomebrewClass();
  const update = useUpdateHomebrewClass();

  const [name, setName] = useState(initialValues?.name ?? "");
  const [classHp, setClassHp] = useState(initialValues?.class_hp ?? 8);
  const [keyAttrs, setKeyAttrs] = useState<string[]>(
    initialValues?.key_attribute?.length ? initialValues.key_attribute : ["str"]
  );
  const [isSpell, setIsSpell] = useState(initialValues?.is_spellcaster ?? false);
  const [spellAbility, setSpellAbility] = useState(initialValues?.spellcasting_ability ?? "");
  const [spellcastingType, setSpellcastingType] = useState<"prepared" | "spontaneous">(
    initialValues?.spellcasting_type ?? "prepared"
  );
  const [spellTradition, setSpellTradition] = useState<"arcane" | "divine" | "occult" | "primal">(
    initialValues?.spellcasting_tradition ?? "arcane"
  );
  const [cantripsKnown, setCantripsKnown] = useState(initialValues?.cantrips_known ?? 5);
  const [focusPoints, setFocusPoints] = useState(initialValues?.focus_points ?? 0);
  const [trainedCount, setTrainedCount] = useState(initialValues?.trained_skill_count ?? 3);
  const [classSkills, setClassSkills] = useState<string[]>(
    initialValues?.class_trained_skills ?? []
  );
  const [classLoreSkills, setClassLoreSkills] = useState<string[]>(
    initialValues?.class_lore_skills ?? []
  );
  const [classProficiencies, setClassProficiencies] = useState<Record<string, number>>(
    initialValues?.class_proficiencies ?? DEFAULT_CLASS_PROFICIENCIES
  );
  const [spellSlotProgression, setSpellSlotProgression] = useState<Record<string, number[]>>(
    initialValues?.spell_slot_progression ?? slotProgression({})
  );
  const [spellsKnownProgression, setSpellsKnownProgression] = useState<Record<string, number[]>>(
    initialValues?.spells_known_progression ?? slotProgression({})
  );
  const [loreInput, setLoreInput] = useState("");
  const [description, setDesc] = useState(initialValues?.description ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const isPending = create.isPending || update.isPending;

  function toggleAttr(a: string) {
    setKeyAttrs((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }
  function toggleSkill(s: string) {
    setClassSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }
  function addLoreSkill() {
    const skill = cleanLoreSkill(loreInput);
    if (!skill) return;
    const key = loreKey(skill);
    setClassLoreSkills((prev) =>
      prev.some((existing) => loreKey(existing) === key) ? prev : [...prev, skill]
    );
    setLoreInput("");
  }
  function removeLoreSkill(skill: string) {
    const key = loreKey(skill);
    setClassLoreSkills((prev) => prev.filter((existing) => loreKey(existing) !== key));
  }
  function setProficiency(key: string, rank: number) {
    setClassProficiencies((prev) => ({ ...prev, [key]: rank }));
  }
  function setSlot(level: number, rank: number, value: number) {
    setSpellSlotProgression((prev) => {
      const key = String(level);
      const row = slotRow(prev[key]);
      row[rank - 1] = Math.max(0, Math.min(9, value));
      return { ...prev, [key]: row };
    });
  }
  function setKnownSpellCount(level: number, rank: number, value: number) {
    setSpellsKnownProgression((prev) => {
      const key = String(level);
      const row = slotRow(prev[key], 20);
      row[rank - 1] = Math.max(0, Math.min(20, value));
      return { ...prev, [key]: row };
    });
  }
  function applySlotPreset(kind: "full" | "bounded" | "clear") {
    const next: Record<string, number[]> = {};
    for (let level = 1; level <= 20; level += 1) {
      const maxRank = Math.min(10, Math.max(1, Math.ceil(level / 2)));
      next[String(level)] = Array.from({ length: 10 }, (_, i) =>
        kind === "clear" || i + 1 > maxRank || (kind === "bounded" && i + 1 > 6) ? 0 : 2
      );
    }
    setSpellSlotProgression(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (keyAttrs.length === 0) {
      setFormError("Select at least one key attribute.");
      return;
    }
    const payload = {
      name,
      class_hp: classHp,
      key_attribute: keyAttrs,
      is_spellcaster: isSpell,
      spellcasting_ability: isSpell ? spellAbility || undefined : undefined,
      spellcasting_type: isSpell ? spellcastingType : undefined,
      spellcasting_tradition: isSpell ? spellTradition : undefined,
      cantrips_known: isSpell ? cantripsKnown : 0,
      focus_points: isSpell ? focusPoints : 0,
      spell_slot_progression: isSpell ? spellSlotProgression : {},
      spells_known_progression: isSpell ? spellsKnownProgression : {},
      trained_skill_count: trainedCount,
      class_trained_skills: classSkills,
      class_lore_skills: classLoreSkills,
      class_proficiencies: classProficiencies,
      description: description || undefined,
    };
    try {
      if (isEditing) {
        await update.mutateAsync({ id: initialValues!.id, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      onDone();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save class.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">
            Name <span className="text-destructive">*</span>
          </label>
          <input
            className="input w-full"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Warlord"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">HP per Level</label>
          <NumberStepper
            className="w-full"
            min={4}
            max={12}
            step={2}
            value={classHp}
            onCommit={setClassHp}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Free Skill Picks</label>
          <NumberStepper
            className="w-full"
            min={1}
            max={10}
            value={trainedCount}
            onCommit={setTrainedCount}
          />
        </div>
      </div>

      {/* Key Attributes */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Key Attribute(s) <span className="text-destructive">*</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {ABILITIES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAttr(a)}
              className={`px-3 py-1 rounded-md text-sm font-mono font-bold uppercase transition-colors ${
                keyAttrs.includes(a)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/70 text-muted-foreground"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Spellcaster */}
      <div className="flex items-center gap-3">
        <input
          id="is-spellcaster"
          type="checkbox"
          checked={isSpell}
          onChange={(e) => setIsSpell(e.target.checked)}
          className="w-4 h-4 accent-primary"
        />
        <label htmlFor="is-spellcaster" className="text-sm font-medium">
          Spellcaster
        </label>
        {isSpell && (
          <div className="relative ml-2">
            <select
              className="input appearance-none pr-8 py-1 text-sm"
              value={spellAbility}
              onChange={(e) => setSpellAbility(e.target.value)}
            >
              <option value="">Select spellcasting ability…</option>
              {ABILITIES.map((a) => (
                <option key={a} value={a}>
                  {a.toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        )}
      </div>

      {isSpell && (
        <div className="rounded-md border border-border bg-muted/20 p-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Spell List Type</label>
              <div className="relative">
                <select
                  className="input w-full appearance-none pr-8 text-sm"
                  value={spellcastingType}
                  onChange={(e) => setSpellcastingType(e.target.value as typeof spellcastingType)}
                >
                  {SPELLCASTING_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Tradition</label>
              <div className="relative">
                <select
                  className="input w-full appearance-none pr-8 text-sm capitalize"
                  value={spellTradition}
                  onChange={(e) => setSpellTradition(e.target.value as typeof spellTradition)}
                >
                  {SPELL_TRADITIONS.map((tradition) => (
                    <option key={tradition} value={tradition}>
                      {tradition}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Cantrips Known at Level 1
              </label>
              <NumberStepper
                className="w-full"
                min={0}
                max={10}
                value={cantripsKnown}
                onCommit={setCantripsKnown}
              />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1">
                <label className="block text-xs text-muted-foreground">Rank 1 Spells at Level 1</label>
                <HelpTip label="Rank 1 starting spells help">
                  This is how many 1st-rank spells the class starts knowing or adding to its
                  spellbook at character level 1. It controls the spell selection budget, not the
                  number of slots the character can cast per day.
                </HelpTip>
              </div>
              <NumberStepper
                className="w-full"
                min={0}
                max={20}
                value={spellsKnownProgression["1"]?.[0] ?? 0}
                onCommit={(value) => setKnownSpellCount(1, 1, value)}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Focus Points</label>
              <NumberStepper
                className="w-full"
                min={0}
                max={3}
                value={focusPoints}
                onCommit={setFocusPoints}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-1">
                  <label className="block text-sm font-medium">Spell Slot Progression</label>
                  <HelpTip label="Spell slot progression help">
                    Each level card shows the spell ranks a class can normally reach at that
                    character level. Set how many slots per day the class receives for each rank.
                    These are castings per day, not spells known or spellbook entries.
                  </HelpTip>
                </div>
                <p className="text-xs text-muted-foreground">
                  Slots per day, grouped by character level for easier mobile editing.
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => applySlotPreset("full")}
                  className="btn-outline px-2 py-1 text-xs"
                >
                  Full
                </button>
                <button
                  type="button"
                  onClick={() => applySlotPreset("bounded")}
                  className="btn-outline px-2 py-1 text-xs"
                >
                  Bounded
                </button>
                <button
                  type="button"
                  onClick={() => applySlotPreset("clear")}
                  className="btn-outline px-2 py-1 text-xs"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="grid max-h-[28rem] gap-3 overflow-auto rounded-md border border-border p-3 md:grid-cols-2">
              {CASTING_LEVELS.map((level) => (
                <section key={level} className="rounded-md border border-border bg-background/70 p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">Level {level}</h4>
                    <span className="text-xs text-muted-foreground">
                      Up to rank {maxSpellRankForLevel(level)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {SPELL_RANKS.slice(0, maxSpellRankForLevel(level)).map((rank) => (
                      <div key={rank} className="space-y-1">
                        <label className="text-xs text-muted-foreground">Rank {rank}</label>
                        <NumberStepper
                          className="w-full"
                          min={0}
                          max={9}
                          value={spellSlotProgression[String(level)]?.[rank - 1] ?? 0}
                          onCommit={(value) => setSlot(level, rank, value)}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          {spellcastingType === "spontaneous" && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-1">
                    <label className="block text-sm font-medium">Repertoire Spells Known</label>
                    <HelpTip label="Repertoire progression help">
                      This is the number of non-cantrip spells known by character level and spell
                      rank. It is separate from slots per day: known spells define the menu, while
                      spell slots define how often the character can cast.
                    </HelpTip>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter how many non-cantrip spells this class knows by character level and spell
                    rank.
                  </p>
                </div>
              </div>
              <div className="grid max-h-[28rem] gap-3 overflow-auto rounded-md border border-border p-3 md:grid-cols-2">
                {CASTING_LEVELS.map((level) => (
                  <section key={level} className="rounded-md border border-border bg-background/70 p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold">Level {level}</h4>
                      <span className="text-xs text-muted-foreground">
                        Up to rank {maxSpellRankForLevel(level)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {SPELL_RANKS.slice(0, maxSpellRankForLevel(level)).map((rank) => (
                        <div key={rank} className="space-y-1">
                          <label className="text-xs text-muted-foreground">Rank {rank}</label>
                          <NumberStepper
                            className="w-full"
                            min={0}
                            max={20}
                            value={spellsKnownProgression[String(level)]?.[rank - 1] ?? 0}
                            onCommit={(value) => setKnownSpellCount(level, rank, value)}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Starting proficiencies */}
      <div>
        <label className="block text-sm font-medium mb-1">Starting Proficiencies</label>
        <p className="text-xs text-muted-foreground mb-3">
          Set the proficiencies this class grants for saves, perception, armor, attacks, class DC,
          and spellcasting traditions.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PROFICIENCY_GROUPS.map((group) => (
            <section key={group.title} className="rounded-md border border-border bg-muted/20 p-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                {group.title}
              </h4>
              <div className="space-y-2">
                {group.items.map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <span className="text-sm">{label}</span>
                    <div className="relative">
                      <select
                        className="input appearance-none py-1 pl-2 pr-7 text-xs"
                        value={classProficiencies[key] ?? 0}
                        onChange={(e) => setProficiency(key, parseInt(e.target.value, 10))}
                      >
                        {PROFICIENCY_RANKS.map((rank) => (
                          <option key={rank.value} value={rank.value}>
                            {rank.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={12}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Class-trained skills */}
      <div>
        <label className="block text-sm font-medium mb-1">Class-Granted Trained Skills</label>
        <p className="text-xs text-muted-foreground mb-2">
          These skills are pre-trained by the class (locked in the character builder).
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
          {SKILLS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSkill(s)}
              className={`px-2 py-1 rounded text-xs text-left capitalize transition-colors ${
                classSkills.includes(s)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/70 text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Class-granted Lore skills */}
      <div>
        <label className="block text-sm font-medium mb-1">Class-Granted Lore Skills</label>
        <p className="text-xs text-muted-foreground mb-2">
          Add specific Lore skills granted by the class, such as Warfare Lore or Dragonmark Lore.
        </p>
        <div className="flex gap-2">
          <input
            className="input flex-1 text-sm"
            value={loreInput}
            onChange={(e) => setLoreInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLoreSkill();
              }
            }}
            placeholder="e.g. Warfare Lore"
          />
          <button type="button" onClick={addLoreSkill} className="btn-outline px-3">
            <Plus size={14} />
          </button>
        </div>
        {classLoreSkills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {classLoreSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeLoreSkill(skill)}
                  className="text-muted-foreground hover:text-destructive"
                  title={`Remove ${skill}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Description <span className="text-xs text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          className="input w-full min-h-[72px] resize-y text-sm"
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Flavor text, class features…"
        />
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onDone} className="btn-outline px-4">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary px-4 flex items-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Saving…
            </>
          ) : isEditing ? (
            "Save Changes"
          ) : (
            "Create Class"
          )}
        </button>
      </div>
    </form>
  );
}

// ── Class Card ────────────────────────────────────────────────────────────────

function ClassCard({
  item,
  onEdit,
  onDelete,
  deleting,
}: {
  item: ClassItem;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold truncate">{item.name}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {item.class_hp !== undefined && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border">
                {item.class_hp} HP/level
              </span>
            )}
            {item.key_attribute?.map((a) => (
              <span
                key={a}
                className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-mono uppercase"
              >
                {a}
              </span>
            ))}
            {item.is_spellcaster && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30">
                Spellcaster
                {item.spellcasting_ability && ` · ${item.spellcasting_ability.toUpperCase()}`}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Edit class"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            title="Delete class"
          >
            {deleting ? <div className="spinner w-3.5 h-3.5" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {item.class_trained_skills.length > 0 && (
        <p className="text-xs text-muted-foreground capitalize">
          Class skills: {item.class_trained_skills.join(", ")}
        </p>
      )}
      {item.class_lore_skills.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Class lore: {item.class_lore_skills.join(", ")}
        </p>
      )}
      {item.is_spellcaster && (
        <p className="text-xs text-muted-foreground capitalize">
          {item.spellcasting_type} {item.spellcasting_tradition ?? "arcane"} caster
          {progressionSummary(item.spell_slot_progression)
            ? ` · Slots ${progressionSummary(item.spell_slot_progression)}`
            : ""}
        </p>
      )}
      {item.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
      )}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function ClassPanel() {
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: rawData, isLoading, error } = useHomebrewClasses();
  const deleteClass = useDeleteHomebrewClass();

  const items = (rawData ?? []).map(toItem);
  const filtered = q ? items.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())) : items;

  const editingItem = editingId ? items.find((c) => c.id === editingId) : undefined;
  const showForm = isCreating || !!editingId;

  function openCreate() {
    setIsCreating(true);
    setEditingId(null);
  }
  function openEdit(id: string) {
    setEditingId(id);
    setIsCreating(false);
  }
  function closeForm() {
    setIsCreating(false);
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this class? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteClass.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="search"
            placeholder="Search classes…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input pl-9"
          />
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus size={16} />
          Add Class
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="card p-5 border-primary/30 bg-primary/5">
          <h3 className="font-heading font-semibold mb-4">
            {editingId ? "Edit Class" : "New Class"}
          </h3>
          <ClassForm key={editingId ?? "new"} initialValues={editingItem} onDone={closeForm} />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="spinner" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-4 bg-destructive/10 border-destructive flex items-start gap-3">
          <AlertTriangle size={16} className="text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error.message}</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && items.length === 0 && (
        <div className="card p-12 text-center">
          <Wand2 size={40} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="font-heading text-xl font-bold mb-1">No homebrew classes yet</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {q
              ? `No results for "${q}".`
              : "Create custom classes that appear in the character builder."}
          </p>
          {!q && (
            <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} /> Add your first class
            </button>
          )}
        </div>
      )}

      {/* Count + grid */}
      {!isLoading && !error && items.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "class" : "classes"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <ClassCard
                key={item.id}
                item={item}
                onEdit={() => openEdit(item.id)}
                onDelete={() => handleDelete(item.id)}
                deleting={deletingId === item.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
