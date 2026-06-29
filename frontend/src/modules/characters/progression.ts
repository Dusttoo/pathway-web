import type { BuilderFocus, BuilderState, FeatSlot } from "@/components/characters/builder-v2/types";

export type ProgressionCategory =
  | "identity"
  | "ability"
  | "class"
  | "feat"
  | "skill"
  | "spell"
  | "equipment";

export type ProgressionStatus = "done" | "partial" | "todo" | "future";

export type ProgressionSlot = {
  id: string;
  level: number;
  label: string;
  category: ProgressionCategory;
  status: ProgressionStatus;
  detail: string;
  requirement: string;
  targetStep: string;
  targetFocus?: BuilderFocus;
};

const LEVELS = Array.from({ length: 20 }, (_, index) => index + 1);
const ANCESTRY_FEAT_LEVELS = new Set([1, 5, 9, 13, 17]);
const ANCESTRY_PARAGON_LEVELS = new Set([1, 3, 7, 11, 15]);
const GENERAL_FEAT_LEVELS = new Set([3, 7, 11, 15, 19]);
const SKILL_FEAT_LEVELS = new Set([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
const SKILL_INCREASE_LEVELS = new Set([3, 5, 7, 9, 11, 13, 15, 17, 19]);
const ABILITY_BOOST_LEVELS = new Set([1, 5, 10, 15, 20]);

const SPELLCASTER_CLASSES = new Set([
  "animist",
  "bard",
  "cleric",
  "druid",
  "magus",
  "necromancer",
  "oracle",
  "psychic",
  "sorcerer",
  "summoner",
  "witch",
  "wizard",
]);

function currentLevel(state: BuilderState): number {
  return Math.max(1, Math.min(20, Number(state.level) || 1));
}

function statusForLevel(state: BuilderState, level: number, filled: boolean): ProgressionStatus {
  if (level > currentLevel(state)) return "future";
  return filled ? "done" : "todo";
}

function featAt(state: BuilderState, slot: FeatSlot, level: number): string | null {
  return (
    state.selectedFeats.find(
      (feat) => feat.feat_slot === slot && feat.level_acquired === level
    )?.feat_name ?? null
  );
}

function hasSpellPicksForRank(state: BuilderState, rank: number): boolean {
  return state.selectedSpells.some((spell) => spell.rank === rank);
}

function isSpellcaster(state: BuilderState): boolean {
  return SPELLCASTER_CLASSES.has(state.className.toLowerCase().trim());
}

function maxSpellRankAtLevel(level: number): number {
  return Math.min(10, Math.max(1, Math.ceil(level / 2)));
}

function abilityBoostDetail(state: BuilderState, level: number): string {
  if (level === 1) {
    const picked =
      state.abilityBoostChoices.ancestryFree.length +
      state.abilityBoostChoices.background.length +
      state.abilityBoostChoices.free.length;
    return picked > 0 ? `${picked} boost choices recorded` : "Choose ancestry, background, class, and free boosts";
  }

  const picked = state.abilityBoostChoices.levelBoosts?.[String(level)]?.length ?? 0;
  return picked > 0 ? `${picked}/4 level ${level} boosts recorded` : "Choose four ability boosts";
}

function levelOneIdentitySlots(state: BuilderState): ProgressionSlot[] {
  return [
    {
      id: "identity-ancestry",
      level: 1,
      label: "Ancestry",
      category: "identity",
      status: statusForLevel(state, 1, !!state.ancestryName),
      detail: state.ancestryName || "Choose ancestry",
      requirement: "Required at level 1",
      targetStep: "ancestry",
    },
    {
      id: "identity-heritage",
      level: 1,
      label: "Heritage",
      category: "identity",
      status: statusForLevel(state, 1, !!state.heritageName),
      detail: state.heritageName || "Choose heritage",
      requirement: "Required at level 1",
      targetStep: "heritage",
    },
    {
      id: "identity-background",
      level: 1,
      label: "Background",
      category: "identity",
      status: statusForLevel(state, 1, !!state.backgroundName),
      detail: state.backgroundName || "Choose background",
      requirement: "Required at level 1",
      targetStep: "background",
    },
    {
      id: "identity-class",
      level: 1,
      label: "Class",
      category: "class",
      status: statusForLevel(state, 1, !!state.className),
      detail: state.className || "Choose class",
      requirement: "Required at level 1",
      targetStep: "class",
    },
    {
      id: "skills-trained",
      level: 1,
      label: "Trained Skills",
      category: "skill",
      status: statusForLevel(state, 1, state.trainedSkills.length > 0),
      detail:
        state.trainedSkills.length > 0
          ? `${state.trainedSkills.length} skill choices recorded`
          : "Choose class and free trained skills",
      requirement: "Required at level 1",
      targetStep: "skills",
    },
    {
      id: "equipment-starting",
      level: 1,
      label: "Starting Equipment",
      category: "equipment",
      status: statusForLevel(state, 1, state.selectedItems.length > 0),
      detail:
        state.selectedItems.length > 0
          ? `${state.selectedItems.length} starting items selected`
          : "Choose starting gear or starting currency",
      requirement: "Required before play",
      targetStep: "equipment",
    },
  ];
}

export function buildProgressionSlots(state: BuilderState): ProgressionSlot[] {
  const slots: ProgressionSlot[] = [...levelOneIdentitySlots(state)];

  for (const level of LEVELS) {
    if (ABILITY_BOOST_LEVELS.has(level)) {
      const filled =
        level === 1
          ? state.abilityBoostChoices.ancestryFree.length > 0 ||
            state.abilityBoostChoices.background.length > 0 ||
            state.abilityBoostChoices.free.length > 0
          : (state.abilityBoostChoices.levelBoosts?.[String(level)]?.length ?? 0) === 4;
      slots.push({
        id: `ability-${level}`,
        level,
        label: "Ability Boosts",
        category: "ability",
        status: statusForLevel(state, level, filled),
        detail: abilityBoostDetail(state, level),
        requirement: level === 1 ? "Starting boosts" : "PF2e boost interval",
        targetStep: "abilities",
      });
    }

    if (ANCESTRY_FEAT_LEVELS.has(level)) {
      const selected = featAt(state, "ancestry", level);
      slots.push({
        id: `ancestry-feat-${level}`,
        level,
        label: "Ancestry Feat",
        category: "feat",
        status: statusForLevel(state, level, !!selected),
        detail: selected || "Choose an ancestry feat",
        requirement: "Levels 1, 5, 9, 13, and 17",
        targetStep: "feats",
        targetFocus: { featSlotId: `ancestry-${level}` },
      });
    }

    if (state.variantRules.ancestryParagon && ANCESTRY_PARAGON_LEVELS.has(level)) {
      const selected = featAt(state, "bonus", level);
      slots.push({
        id: `ancestry-paragon-${level}`,
        level,
        label: "Ancestry Paragon Feat",
        category: "feat",
        status: statusForLevel(state, level, !!selected),
        detail: selected || "Choose an extra ancestry feat",
        requirement: "Ancestry Paragon variant",
        targetStep: "feats",
        targetFocus: { featSlotId: `ancestry-paragon-${level}` },
      });
    }

    if (level === 1 || level % 2 === 0) {
      const selected = featAt(state, "class", level);
      slots.push({
        id: `class-feat-${level}`,
        level,
        label: "Class Feat",
        category: "feat",
        status: statusForLevel(state, level, !!selected),
        detail: selected || "Choose a class feat",
        requirement: "Level 1 and even levels",
        targetStep: "feats",
        targetFocus: { featSlotId: `class-${level}` },
      });
    }

    if (SKILL_FEAT_LEVELS.has(level)) {
      const selected = featAt(state, "skill", level);
      slots.push({
        id: `skill-feat-${level}`,
        level,
        label: "Skill Feat",
        category: "feat",
        status: statusForLevel(state, level, !!selected),
        detail: selected || "Choose a skill feat",
        requirement: "Even levels",
        targetStep: "feats",
        targetFocus: { featSlotId: `skill-${level}` },
      });
    }

    if (GENERAL_FEAT_LEVELS.has(level)) {
      const selected = featAt(state, "general", level);
      slots.push({
        id: `general-feat-${level}`,
        level,
        label: "General Feat",
        category: "feat",
        status: statusForLevel(state, level, !!selected),
        detail: selected || "Choose a general feat",
        requirement: "Levels 3, 7, 11, 15, and 19",
        targetStep: "feats",
        targetFocus: { featSlotId: `general-${level}` },
      });
    }

    if (state.variantRules.freeArchetype && level > 1 && level % 2 === 0) {
      const selected = featAt(state, "free_archetype", level);
      slots.push({
        id: `free-archetype-${level}`,
        level,
        label: "Free Archetype Feat",
        category: "feat",
        status: statusForLevel(state, level, !!selected),
        detail: selected || "Choose a free archetype feat",
        requirement: "Free Archetype variant",
        targetStep: "feats",
        targetFocus: { featSlotId: `free-archetype-${level}` },
      });
    }

    if (SKILL_INCREASE_LEVELS.has(level)) {
      const increases = state.additionalSkills.filter((skill) => skill.rank > 1).length;
      slots.push({
        id: `skill-increase-${level}`,
        level,
        label: "Skill Increase",
        category: "skill",
        status: level > currentLevel(state) ? "future" : increases > 0 ? "partial" : "todo",
        detail:
          increases > 0
            ? `${increases} expert-or-better skill entries recorded`
            : "Increase a trained skill",
        requirement: "Odd levels starting at 3",
        targetStep: "skills",
      });
    }

    if (isSpellcaster(state) && (level === 1 || level % 2 === 1)) {
      const rank = level === 1 ? 1 : maxSpellRankAtLevel(level);
      slots.push({
        id: `spells-${level}`,
        level,
        label: level === 1 ? "Starting Spells" : `Rank ${rank} Spells`,
        category: "spell",
        status: statusForLevel(state, level, hasSpellPicksForRank(state, rank) || hasSpellPicksForRank(state, 0)),
        detail:
          level === 1
            ? "Choose cantrips and 1st-rank spells"
            : `Add newly available rank ${rank} spells`,
        requirement: "Spellcaster progression",
        targetStep: "spells",
        targetFocus: { spellRank: level === 1 ? 0 : rank },
      });
    }
  }

  return slots.sort((a, b) => a.level - b.level || categorySort(a.category) - categorySort(b.category));
}

function categorySort(category: ProgressionCategory): number {
  return ["identity", "class", "ability", "skill", "feat", "spell", "equipment"].indexOf(category);
}

export function progressionSummary(slots: ProgressionSlot[]) {
  const active = slots.filter((slot) => slot.status !== "future");
  const done = active.filter((slot) => slot.status === "done").length;
  const partial = active.filter((slot) => slot.status === "partial").length;
  const todo = active.filter((slot) => slot.status === "todo").length;
  return { active: active.length, done, partial, todo };
}
