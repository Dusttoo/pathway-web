import type { Tables } from "@/lib/types/database.types";
import type { StatBreakdown } from "./calc/stat-breakdowns";

type CharacterRow = Tables<"characters">;
type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export type TableModeRoll = {
  key: string;
  label: string;
  modifier: number;
  group: "save" | "skill" | "attack" | "utility";
};

export type TableModeAction = {
  key: string;
  name: string;
  category: string;
  cost: string;
  summary: string;
  roll?: TableModeRoll;
};

export type TableModeSheet = {
  id: string;
  name: string;
  level: number;
  ancestry: string;
  heritage: string;
  className: string;
  background: string;
  maxHp: number | null;
  currentHp: number | null;
  heroPoints: number;
  dying: number;
  wounded: number;
  ac: number | null;
  perception: number | null;
  saves: TableModeRoll[];
  skills: TableModeRoll[];
  attacks: TableModeAction[];
  actions: TableModeAction[];
  inventory: { name: string; quantity: number }[];
  offlineCachedAt: string;
};

const SKILL_ABILITIES: Record<string, AbilityKey> = {
  acrobatics: "dex",
  arcana: "int",
  athletics: "str",
  crafting: "int",
  deception: "cha",
  diplomacy: "cha",
  intimidation: "cha",
  medicine: "wis",
  nature: "wis",
  occultism: "int",
  performance: "cha",
  religion: "wis",
  society: "int",
  stealth: "dex",
  survival: "wis",
  thievery: "dex",
};

const CORE_ACTIONS: TableModeAction[] = [
  {
    key: "seek",
    name: "Seek",
    category: "Encounter",
    cost: "1 action",
    summary: "Scan an area for creatures, hazards, or hidden details.",
    roll: { key: "seek", label: "Seek", modifier: 0, group: "utility" },
  },
  {
    key: "stride",
    name: "Stride",
    category: "Encounter",
    cost: "1 action",
    summary: "Move up to your Speed.",
  },
  {
    key: "step",
    name: "Step",
    category: "Encounter",
    cost: "1 action",
    summary: "Move 5 feet without triggering reactions based on movement.",
  },
  {
    key: "take-cover",
    name: "Take Cover",
    category: "Encounter",
    cost: "1 action",
    summary: "Gain cover benefits if you are next to a suitable obstacle.",
  },
  {
    key: "aid",
    name: "Aid",
    category: "Reaction",
    cost: "reaction",
    summary: "Help an ally after preparing to assist their check.",
  },
  {
    key: "recall-knowledge",
    name: "Recall Knowledge",
    category: "Exploration",
    cost: "1 action",
    summary: "Use a relevant skill to remember useful information.",
  },
];

type BuildData = {
  abilities?: Partial<Record<AbilityKey, number>>;
  attributes?: { ancestryhp?: number; classhp?: number; bonushp?: number; bonushpPerLevel?: number };
  proficiencies?: Record<string, number>;
  attacks?: unknown[];
  custom_attacks?: unknown[];
  equipment?: unknown[];
};

export function buildTableModeSheet(
  character: CharacterRow,
  breakdowns: StatBreakdown[] = []
): TableModeSheet {
  const build = extractBuild(character);
  const breakdownMap = new Map(breakdowns.map((breakdown) => [breakdown.key, breakdown]));
  const maxHp = breakdownMap.get("max_hp")?.total ?? fallbackMaxHp(character, build);
  const perception = breakdownMap.get("perception")?.total ?? null;
  const ac = breakdownMap.get("ac")?.total ?? null;

  return {
    id: character.id,
    name: character.name,
    level: character.level,
    ancestry: character.ancestry_name ?? str(build?.ancestry) ?? "Unknown ancestry",
    heritage: character.heritage_name ?? str(build?.heritage) ?? "Unknown heritage",
    className: character.class_name ?? str(build?.class) ?? "Unknown class",
    background: character.background_name ?? str(build?.background) ?? "Unknown background",
    maxHp,
    currentHp: character.current_hp ?? maxHp,
    heroPoints: character.hero_points ?? 0,
    dying: character.dying ?? 0,
    wounded: character.wounded ?? 0,
    ac,
    perception,
    saves: ["fortitude", "reflex", "will"].map((key) => ({
      key,
      label: labelFor(key),
      modifier: breakdownMap.get(key)?.total ?? 0,
      group: "save" as const,
    })),
    skills: buildSkillRolls(character, build),
    attacks: buildAttackActions(build),
    actions: CORE_ACTIONS.map((action) =>
      action.key === "seek" && perception !== null
        ? { ...action, roll: { key: "seek", label: "Seek", modifier: perception, group: "utility" } }
        : action
    ),
    inventory: buildInventory(build),
    offlineCachedAt: new Date().toISOString(),
  };
}

function extractBuild(character: CharacterRow): (Record<string, unknown> & BuildData) | null {
  const data = character.pathbuilder_data;
  if (!isRecord(data)) return null;
  const build = isRecord(data.build) ? data.build : data;
  return build as Record<string, unknown> & BuildData;
}

function buildSkillRolls(character: CharacterRow, build: BuildData | null): TableModeRoll[] {
  const abilities = {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
    ...(build?.abilities ?? {}),
  };
  const proficiencies = build?.proficiencies ?? {};
  const rawBonus =
    character.source === "pathbuilder" ||
    Object.values(proficiencies).some((value) => typeof value === "number" && value > 4);

  return Object.entries(SKILL_ABILITIES).map(([key, ability]) => {
    const rank = Number(proficiencies[key] ?? 0);
    const modifier = abilityMod(abilities[ability]) + proficiencyBonus(rank, character.level, rawBonus);
    return {
      key,
      label: labelFor(key),
      modifier,
      group: "skill",
    };
  });
}

function buildAttackActions(build: BuildData | null): TableModeAction[] {
  const rawAttacks = [...arrayOfRecords(build?.attacks), ...arrayOfRecords(build?.custom_attacks)];
  return rawAttacks.slice(0, 12).map((attack, index) => {
    const name = str(attack.name) || `Attack ${index + 1}`;
    const bonus = parseModifier(attack.bonus ?? attack.attack ?? attack.to_hit);
    const damage = str(attack.damage ?? attack.damage_dice);
    const traits = str(attack.traits);
    return {
      key: `attack-${index}-${name}`,
      name,
      category: str(attack.category) || "Attack",
      cost: str(attack.action) || "1 action",
      summary: [damage ? `Damage ${damage}` : "", traits].filter(Boolean).join(" · ") || "Roll an attack.",
      roll: { key: `attack-${index}`, label: name, modifier: bonus, group: "attack" },
    };
  });
}

function buildInventory(build: BuildData | null) {
  return (build?.equipment ?? [])
    .map((entry) => {
      if (Array.isArray(entry)) {
        return { name: str(entry[0]) || "Item", quantity: Number(entry[1] ?? 1) || 1 };
      }
      if (isRecord(entry)) {
        return { name: str(entry.name) || "Item", quantity: Number(entry.quantity ?? 1) || 1 };
      }
      return { name: str(entry), quantity: 1 };
    })
    .filter((item) => item.name)
    .slice(0, 40);
}

function fallbackMaxHp(character: CharacterRow, build: BuildData | null) {
  const attrs = build?.attributes;
  if (!attrs) return character.current_hp;
  const con = abilityMod(build?.abilities?.con ?? 10);
  return (
    (attrs.ancestryhp ?? 0) +
    ((attrs.classhp ?? 0) + con + (attrs.bonushpPerLevel ?? 0)) * character.level +
    (attrs.bonushp ?? 0)
  );
}

function proficiencyBonus(rank: number, level: number, rawBonus: boolean) {
  if (!rank) return 0;
  return level + (rawBonus ? rank : rank * 2);
}

function abilityMod(score: number) {
  return Math.floor((score - 10) / 2);
}

function parseModifier(value: unknown) {
  if (typeof value === "number") return value;
  const match = str(value).match(/[+-]?\d+/);
  return match ? Number(match[0]) : 0;
}

function labelFor(key: string) {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function str(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function arrayOfRecords(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}
