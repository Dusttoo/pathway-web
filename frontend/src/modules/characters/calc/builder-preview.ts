import type { AbilityKey, BuilderState } from "@/components/characters/builder-v2/types";

export type SavePreview = {
  key: string;
  label: string;
  rank: number;
  total: number;
};

export type BuilderSheetPreview = {
  level: number;
  maxHp: number;
  ac: number;
  classDc: number | null;
  saves: SavePreview[];
};

const SAVE_ABILITY: Record<string, AbilityKey> = {
  fortitude: "con",
  reflex: "dex",
  will: "wis",
};

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function signed(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

export function profRank(value: unknown): number {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : 0;
  if (numeric > 4) return Math.max(0, Math.min(4, Math.round(numeric / 2)));
  return Math.max(0, Math.min(4, Math.round(numeric)));
}

export function profBonus(rank: number, level: number): number {
  return rank > 0 ? level + rank * 2 : 0;
}

export function classDcTotal(
  state: Pick<BuilderState, "abilities" | "classInitialProfs" | "keyability" | "level">
): number | null {
  const classAbility = (state.keyability?.toLowerCase() || "str") as AbilityKey;
  const classDcRank = profRank(state.classInitialProfs.class_dc ?? state.classInitialProfs.classDC);

  if (!classDcRank) {
    return null;
  }

  return (
    10 +
    abilityMod(state.abilities[classAbility] ?? state.abilities.str) +
    profBonus(classDcRank, state.level)
  );
}

export function buildSheetPreview(state: BuilderState): BuilderSheetPreview {
  const level = Math.max(1, Math.min(20, Number(state.level) || 1));
  const conMod = abilityMod(state.abilities.con);
  const maxHp = state.ancestryHp + level * (state.classHp + conMod);
  const ac =
    10 +
    abilityMod(state.abilities.dex) +
    profBonus(profRank(state.classInitialProfs.unarmored), level);
  const classDc = classDcTotal({ ...state, level });
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
}
