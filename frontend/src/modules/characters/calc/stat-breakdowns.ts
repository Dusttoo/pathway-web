import type { Json, Tables } from "@/lib/types/database.types";

type CharacterRow = Tables<"characters">;

type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

type PBBuild = {
  level?: number;
  source?: string;
  keyability?: string;
  abilities?: Partial<Record<AbilityKey, number>>;
  proficiencies?: Record<string, number>;
  attributes?: {
    ancestryhp?: number;
    classhp?: number;
    bonushp?: number;
    bonushpPerLevel?: number;
  };
  ac?: number;
  armorClass?: number;
  armor_class?: number;
  class_dc?: number;
  classDC?: number;
  stats?: Record<string, unknown>;
  acTotal?: number | { acTotal?: number };
};

export type CharacterOverride = {
  stat_key: string;
  value: Json;
  reason: string | null;
  enabled: boolean;
};

export type StatBreakdownPart = {
  label: string;
  value: number;
  source?: string;
};

export type StatBreakdown = {
  key: string;
  label: string;
  total: number | null;
  formula: string;
  parts: StatBreakdownPart[];
  directSource?: string;
  override?: {
    value: number;
    reason: string | null;
  };
};

const DEFAULT_ABILITIES: Record<AbilityKey, number> = {
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10,
};

const SAVE_ABILITY: Record<string, AbilityKey> = {
  perception: "wis",
  fortitude: "con",
  reflex: "dex",
  will: "wis",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function abilityKey(value: unknown, fallback: AbilityKey = "str"): AbilityKey {
  return value === "str" ||
    value === "dex" ||
    value === "con" ||
    value === "int" ||
    value === "wis" ||
    value === "cha"
    ? value
    : fallback;
}

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function directNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nestedNumber(value: unknown, paths: string[][]): number | null {
  for (const path of paths) {
    let cursor: unknown = value;
    for (const key of path) {
      if (!isRecord(cursor)) {
        cursor = null;
        break;
      }
      cursor = cursor[key];
    }
    const number = directNumber(cursor);
    if (number !== null) return number;
  }
  return null;
}

function extractBuild(character: CharacterRow): PBBuild | null {
  const data = character.pathbuilder_data;
  if (!isRecord(data)) return null;
  const build = isRecord(data.build) ? data.build : data;
  return build as PBBuild;
}

function usesRawProficiencyBonus(character: CharacterRow, proficiencies: Record<string, number>) {
  return (
    character.source === "pathbuilder" ||
    character.pathbuilder_id !== null ||
    Object.values(proficiencies).some((value) => value > 4)
  );
}

function proficiencyBonus(value: number, level: number, usesRawBonus: boolean): number {
  if (!value) return 0;
  return level + (usesRawBonus ? value : value * 2);
}

function overrideNumber(value: Json): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (isRecord(value) && typeof value.total === "number" && Number.isFinite(value.total)) {
    return value.total;
  }
  return null;
}

function applyOverride(
  breakdown: StatBreakdown,
  overrides: Map<string, CharacterOverride>
): StatBreakdown {
  const override = overrides.get(breakdown.key);
  if (!override?.enabled) return breakdown;

  const value = overrideNumber(override.value);
  if (value === null) return breakdown;

  return {
    ...breakdown,
    total: value,
    override: {
      value,
      reason: override.reason,
    },
  };
}

function directBreakdown(key: string, label: string, value: number, source: string): StatBreakdown {
  return {
    key,
    label,
    total: value,
    formula: source,
    directSource: source,
    parts: [{ label: source, value }],
  };
}

export function buildCharacterStatBreakdowns(
  character: CharacterRow,
  characterOverrides: CharacterOverride[] = []
): StatBreakdown[] {
  const build = extractBuild(character);
  if (!build) return [];

  const level = Math.max(1, Math.min(20, Number(character.level ?? build.level ?? 1) || 1));
  const abilities = { ...DEFAULT_ABILITIES, ...(build.abilities ?? {}) };
  const proficiencies = build.proficiencies ?? {};
  const usesRawBonus = usesRawProficiencyBonus(character, proficiencies);
  const overrides = new Map(
    characterOverrides
      .filter((override) => override.enabled)
      .map((override) => [override.stat_key, override])
  );

  const attrs = build.attributes ?? {
    ancestryhp: 8,
    classhp: 8,
    bonushp: 0,
    bonushpPerLevel: 0,
  };
  const conMod = abilityMod(abilities.con);
  const perLevel = (attrs.classhp ?? 0) + conMod + (attrs.bonushpPerLevel ?? 0);
  const maxHp =
    (attrs.ancestryhp ?? 0) + perLevel * level + (attrs.bonushp ?? 0);

  const directAc = nestedNumber(build, [
    ["acTotal", "acTotal"],
    ["ac"],
    ["armorClass"],
    ["armor_class"],
    ["stats", "ac"],
  ]);
  const armorProf =
    proficiencies.unarmored ??
    proficiencies.light ??
    proficiencies.light_armor ??
    proficiencies.medium ??
    proficiencies.medium_armor ??
    proficiencies.heavy ??
    proficiencies.heavy_armor ??
    0;
  const ac =
    directAc !== null
      ? directBreakdown("ac", "AC", directAc, "Imported total")
      : {
          key: "ac",
          label: "AC",
          total: 10 + abilityMod(abilities.dex) + proficiencyBonus(armorProf, level, usesRawBonus),
          formula: "10 + Dexterity modifier + armor proficiency",
          parts: [
            { label: "Base", value: 10, source: "PF2e armor class base" },
            { label: "Dexterity modifier", value: abilityMod(abilities.dex), source: `DEX ${abilities.dex}` },
            {
              label: "Armor proficiency",
              value: proficiencyBonus(armorProf, level, usesRawBonus),
              source: armorProf ? `Level ${level} + proficiency` : "Untrained",
            },
          ],
        };

  const classDcDirect = nestedNumber(build, [["class_dc"], ["classDC"], ["stats", "class_dc"]]);
  const classRank = proficiencies.class_dc ?? proficiencies.classDC ?? 0;
  const classAbility = abilityKey(build.keyability, "str");
  const classDc =
    classDcDirect !== null
      ? directBreakdown("class_dc", "Class DC", classDcDirect, "Imported total")
      : {
          key: "class_dc",
          label: "Class DC",
          total:
            classRank > 0
              ? 10 +
                abilityMod(abilities[classAbility]) +
                proficiencyBonus(classRank, level, usesRawBonus)
              : null,
          formula: "10 + key ability modifier + class DC proficiency",
          parts: [
            { label: "Base", value: 10, source: "PF2e DC base" },
            {
              label: `${classAbility.toUpperCase()} modifier`,
              value: abilityMod(abilities[classAbility]),
              source: `${classAbility.toUpperCase()} ${abilities[classAbility]}`,
            },
            {
              label: "Class DC proficiency",
              value: proficiencyBonus(classRank, level, usesRawBonus),
              source: classRank ? `Level ${level} + proficiency` : "Untrained",
            },
          ],
        };

  const saves = Object.entries(SAVE_ABILITY).map(([key, ability]) => {
    const rank = proficiencies[key] ?? 0;
    const label =
      key === "perception"
        ? "Perception"
        : key === "fortitude"
          ? "Fortitude"
          : key === "reflex"
            ? "Reflex"
            : "Will";
    return {
      key,
      label,
      total: abilityMod(abilities[ability]) + proficiencyBonus(rank, level, usesRawBonus),
      formula: `${ability.toUpperCase()} modifier + proficiency`,
      parts: [
        {
          label: `${ability.toUpperCase()} modifier`,
          value: abilityMod(abilities[ability]),
          source: `${ability.toUpperCase()} ${abilities[ability]}`,
        },
        {
          label: "Proficiency",
          value: proficiencyBonus(rank, level, usesRawBonus),
          source: rank ? `Level ${level} + proficiency` : "Untrained",
        },
      ],
    } satisfies StatBreakdown;
  });

  return [
    {
      key: "max_hp",
      label: "Max HP",
      total: maxHp,
      formula: "Ancestry HP + (class HP + CON modifier + bonus HP per level) x level + bonus HP",
      parts: [
        { label: "Ancestry HP", value: attrs.ancestryhp ?? 0 },
        { label: "Class HP per level", value: (attrs.classhp ?? 0) * level, source: `${attrs.classhp ?? 0} x ${level}` },
        { label: "CON modifier per level", value: conMod * level, source: `${conMod} x ${level}` },
        {
          label: "Bonus HP per level",
          value: (attrs.bonushpPerLevel ?? 0) * level,
          source: `${attrs.bonushpPerLevel ?? 0} x ${level}`,
        },
        { label: "Flat bonus HP", value: attrs.bonushp ?? 0 },
      ],
    },
    ac,
    classDc,
    ...saves,
  ].map((breakdown) => applyOverride(breakdown, overrides));
}
