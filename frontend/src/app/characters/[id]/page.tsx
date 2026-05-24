"use client";

import { MainLayout } from "@/components/layout";
import { HealthBar } from "@/components/characters/HealthBar";
import { useCharacterLive, useShareCharacter, useSyncCharacter } from "@/lib/hooks/use-characters";
import {
  useCharacterDowntime,
  downtimeKeys,
  type DowntimeLogEntry,
} from "@/lib/hooks/use-downtime";
import {
  useCharacterNotes,
  NOTE_CATEGORIES,
  NOTE_CATEGORY_ORDER,
  notesKeys,
  type BotNote,
} from "@/lib/hooks/use-notes";
import { useCompanions, useUpdateCompanion } from "@/lib/hooks/use-companions";
import { useUpdateCharacter } from "@/lib/hooks/use-characters";
import { useCharacterFeats } from "@/lib/hooks/use-feats";
import {
  useAddKnownSpell,
  useCharacterKnownSpells,
  useRemoveKnownSpell,
  type CharacterKnownSpell,
} from "@/lib/hooks/use-character-spells";
import { useSpells } from "@/lib/hooks/use-spells";
import { NumberStepper, InlineSelect, InlineTextarea } from "@/components/characters";
import { useBag, bagKeys, type BagCategories, type BagItem } from "@/lib/hooks/use-bag";
import { useAuth } from "@/lib/providers/auth-provider";
import type { CharacterOverlay, BotCompanion } from "@/lib/types/bot-integration";
import {
  ArrowLeft,
  Radio,
  Zap,
  Heart,
  Flame,
  CalendarDays,
  BookOpen,
  RefreshCw,
  Plus,
  Trash2,
  X,
  Package,
  Inbox,
  ExternalLink,
  Printer,
  Share2,
  Check,
} from "lucide-react";
import { ItemSearchCombobox } from "@/components/ui/ItemSearchCombobox";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/lib/types/database.types";

// ── Pathbuilder build shape ───────────────────────────────────────────────────

interface PBBuild {
  name?: string;
  class?: string;
  ancestry?: string;
  heritage?: string;
  background?: string;
  level?: number;
  deity?: string;
  languages?: string[];
  keyability?: string;
  abilities?: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  proficiencies?: Record<string, number>;
  feats?: Array<[string, string | null, string | null, string | null] | string[]>;
  specials?: string[];
  custom_attacks?: {
    name: string;
    bonus: string | number;
    damage: string;
    traits: string | string[];
    action?: string;
    category?: string;
    range?: string;
    notes?: string;
  }[];
  weapons?: unknown[];
  lores?: unknown[];
  equipment?: Array<[string, number]> | Array<{ name: string; qty: number }>;
  attributes?: { ancestryhp: number; classhp: number; bonushp: number; bonushpPerLevel: number };
  spellCasters?: Array<{
    name: string;
    perDay: number[];
    ability?: string;
    magicTradition?: string;
  }>;
  ac?: number;
  armorClass?: number;
  armor_class?: number;
  acTotal?: number | { acTotal?: number };
  speed?: number;
  speed_ft?: number;
  size?: string;
  senses?: string;
  armor?: string;
  shield?: string;
  class_dc?: number;
  classDC?: number;
  spell_dc?: number;
  spellDC?: number;
  immunities?: string | string[];
  resistances?: string | string[];
  weaknesses?: string | string[];
  stats?: Record<string, unknown>;
}

type TabKey =
  | "stats"
  | "feats"
  | "spells"
  | "gear"
  | "notes"
  | "downtime"
  | "official"
  | "companions";
type ContentType = "feat" | "item";

// Shapes returned by /api/content/feats and /api/content/items
interface FeatData {
  id: string;
  name: string;
  description: string | null;
  feat_type: string | null;
  level: number | null;
  traits: unknown; // JSONB — string[]
  prerequisites: string | null;
  action_cost: string | null;
  trigger: string | null;
  rarity: string | null;
  source: string | null;
}

interface ItemData {
  id: string;
  name: string;
  description: string | null;
  item_type: string | null;
  item_subtype: string | null;
  level: number | null;
  price_cp: number | null;
  bulk: string | null;
  traits: unknown; // JSONB — string[]
  rarity: string | null;
  is_magical: boolean | null;
  usage: string | null;
  source: string | null;
}

// ── Math helpers ──────────────────────────────────────────────────────────────

function abilityModNum(score: number): number {
  return Math.floor((score - 10) / 2);
}

function abilityKey(value: unknown, fallback: keyof NonNullable<PBBuild["abilities"]> = "str") {
  return value === "str" ||
    value === "dex" ||
    value === "con" ||
    value === "int" ||
    value === "wis" ||
    value === "cha"
    ? value
    : fallback;
}

function abilityModStr(score: number): string {
  const mod = abilityModNum(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function profBonus(rank: number, level: number): number {
  return rank === 0 ? 0 : rank * 2 + level;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNestedNumber(value: unknown, paths: string[][]): number | null {
  for (const path of paths) {
    let cursor: unknown = value;
    for (const key of path) {
      if (!isRecord(cursor)) {
        cursor = null;
        break;
      }
      cursor = cursor[key];
    }
    if (typeof cursor === "number" && Number.isFinite(cursor)) return cursor;
  }
  return null;
}

function getNestedString(value: unknown, paths: string[][]): string | null {
  for (const path of paths) {
    let cursor: unknown = value;
    for (const key of path) {
      if (!isRecord(cursor)) {
        cursor = null;
        break;
      }
      cursor = cursor[key];
    }
    if (typeof cursor === "string" && cursor.trim()) return cursor.trim();
  }
  return null;
}

function getNestedText(value: unknown, paths: string[][]): string {
  for (const path of paths) {
    let cursor: unknown = value;
    for (const key of path) {
      if (!isRecord(cursor)) {
        cursor = null;
        break;
      }
      cursor = cursor[key];
    }
    if (typeof cursor === "string" && cursor.trim()) return cursor.trim();
    if (Array.isArray(cursor)) {
      const text = cursor
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean)
        .join(", ");
      if (text) return text;
    }
  }
  return "";
}

function signedTotal(total: number): string {
  return total >= 0 ? `+${total}` : `${total}`;
}

function customKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function customLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function canonicalProfKey(key: string): string {
  const normalized = customKey(key);
  const aliases: Record<string, string> = {
    light: "light_armor",
    medium: "medium_armor",
    heavy: "heavy_armor",
    simple: "simple_weapons",
    martial: "martial_weapons",
    advanced: "advanced_weapons",
    classdc: "class_dc",
    class_dc: "class_dc",
    spelldc: "spell_dc",
    spell_dc: "spell_dc",
    castingarcane: "casting_arcane",
    casting_arcane: "casting_arcane",
    castingdivine: "casting_divine",
    casting_divine: "casting_divine",
    castingoccult: "casting_occult",
    casting_occult: "casting_occult",
    castingprimal: "casting_primal",
    casting_primal: "casting_primal",
  };
  return aliases[normalized] ?? normalized;
}

function profLabel(key: string): string {
  const canonical = canonicalProfKey(key);
  const labels: Record<string, string> = {
    light_armor: "Light Armor",
    medium_armor: "Medium Armor",
    heavy_armor: "Heavy Armor",
    unarmored: "Unarmored",
    simple_weapons: "Simple Weapons",
    martial_weapons: "Martial Weapons",
    advanced_weapons: "Advanced Weapons",
    unarmed: "Unarmed",
    class_dc: "Class DC",
    spell_dc: "Spell DC",
    casting_arcane: "Arcane Spellcasting",
    casting_divine: "Divine Spellcasting",
    casting_occult: "Occult Spellcasting",
    casting_primal: "Primal Spellcasting",
  };
  return labels[canonical] ?? customLabel(key);
}

function usesPf2eProficiencyBonus(
  build: PBBuild,
  proficiencies: Record<string, number>,
  isPathbuilderImport = false
): boolean {
  if (isPathbuilderImport) return true;
  return Object.values(proficiencies).some((value) => value > 4);
}

function proficiencyValueToBonus(value: number, level: number, usesRawBonus: boolean): number {
  if (!value) return 0;
  return level + (usesRawBonus ? value : value * 2);
}

function proficiencyValueToRank(value: number, usesRawBonus: boolean): number {
  if (!value) return 0;
  const rank = usesRawBonus ? value / 2 : value;
  return Math.max(0, Math.min(4, Math.round(rank)));
}

function normalizedProfBonus(rankOrBonus: number, level: number, usesRawBonus: boolean): number {
  return proficiencyValueToBonus(rankOrBonus, level, usesRawBonus);
}

function deriveMaxHp(build: PBBuild, level: number): number | null {
  const attr = build.attributes ?? {
    ancestryhp: 8,
    classhp: 8,
    bonushp: 0,
    bonushpPerLevel: 0,
  };
  const conMod = Math.floor(((build.abilities?.con ?? 10) - 10) / 2);
  const perLevel = (attr.classhp ?? 0) + conMod + (attr.bonushpPerLevel ?? 0);
  return (attr.ancestryhp ?? 0) + perLevel * level + (attr.bonushp ?? 0);
}

function deriveAc(build: PBBuild, level: number, usesRawBonus: boolean): number {
  const directAc = getNestedNumber(build, [
    ["acTotal", "acTotal"],
    ["ac"],
    ["armorClass"],
    ["armor_class"],
    ["stats", "ac"],
  ]);
  if (directAc !== null) return directAc;
  const abilities = build.abilities ?? { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  const proficiencies = build.proficiencies ?? {};
  const armorRank =
    proficiencies.unarmored ??
    proficiencies.light ??
    proficiencies.light_armor ??
    proficiencies.medium ??
    proficiencies.medium_armor ??
    proficiencies.heavy ??
    proficiencies.heavy_armor ??
    0;
  return 10 + abilityModNum(abilities.dex) + normalizedProfBonus(armorRank, level, usesRawBonus);
}

function getDefenseDetails(build: PBBuild, level: number, usesRawBonus: boolean) {
  const ac = deriveAc(build, level, usesRawBonus);
  const abilities = build.abilities ?? { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  const proficiencies = build.proficiencies ?? {};
  const speed =
    getNestedNumber(build, [
      ["speed"],
      ["speed_ft"],
      ["stats", "speed"],
      ["attributes", "speed"],
    ]) ?? null;
  const classRank = proficiencies.class_dc ?? proficiencies.classDC ?? 0;
  const classAbility = abilityKey(build.keyability, "str");
  const classDc =
    getNestedNumber(build, [["class_dc"], ["classDC"], ["stats", "class_dc"]]) ??
    (classRank > 0
      ? 10 +
        abilityModNum(abilities[classAbility] ?? 10) +
        normalizedProfBonus(classRank, level, usesRawBonus)
      : null);
  const spellRank =
    proficiencies.spell_dc ??
    proficiencies.casting_arcane ??
    proficiencies.casting_divine ??
    proficiencies.casting_occult ??
    proficiencies.casting_primal ??
    0;
  const spellAbility = abilityKey(
    build.spellCasters?.[0]?.ability?.toLowerCase?.() ?? build.keyability,
    "int"
  );
  const spellDc =
    getNestedNumber(build, [["spell_dc"], ["spellDC"], ["stats", "spell_dc"]]) ??
    (spellRank > 0
      ? 10 +
        abilityModNum(abilities[spellAbility] ?? 10) +
        normalizedProfBonus(spellRank, level, usesRawBonus)
      : null);
  return {
    ac,
    armor: getNestedString(build, [["armor"], ["equipped_armor"], ["stats", "armor"]]) ?? "",
    shield: getNestedString(build, [["shield"], ["equipped_shield"], ["stats", "shield"]]) ?? "",
    speed: speed ? `${speed}` : "",
    size: getNestedString(build, [["size"], ["stats", "size"]]) ?? "",
    senses: getNestedString(build, [["senses"], ["stats", "senses"]]) ?? "",
    classDc: classDc ? `${classDc}` : "",
    spellDc: spellDc ? `${spellDc}` : "",
    immunities: getNestedText(build, [["immunities"], ["stats", "immunities"]]),
    resistances: getNestedText(build, [["resistances"], ["stats", "resistances"]]),
    weaknesses: getNestedText(build, [["weaknesses"], ["stats", "weaknesses"]]),
  };
}

function formatPriceCp(cp: number | null): string {
  if (cp === null || cp === 0) return "—";
  const gp = Math.floor(cp / 100);
  const sp = Math.floor((cp % 100) / 10);
  const rem = cp % 10;
  return (
    [gp ? `${gp} gp` : null, sp ? `${sp} sp` : null, rem ? `${rem} cp` : null]
      .filter(Boolean)
      .join(", ") || "—"
  );
}

// ── PF2e static maps ──────────────────────────────────────────────────────────

const SKILL_ABILITY_MAP: Record<string, keyof NonNullable<PBBuild["abilities"]>> = {
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

const SKILL_ORDER = [
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

const SAVE_LABELS: Record<string, string> = { fortitude: "Fort", reflex: "Ref", will: "Will" };
const SAVE_ABILITY: Record<string, keyof NonNullable<PBBuild["abilities"]>> = {
  fortitude: "con",
  reflex: "dex",
  will: "wis",
};

const COMBAT_PROF_KEYS = new Set([
  "light_armor",
  "medium_armor",
  "heavy_armor",
  "unarmored",
  "simple_weapons",
  "martial_weapons",
  "advanced_weapons",
  "unarmed",
]);
const SPELL_DC_PROF_KEYS = new Set([
  "class_dc",
  "spell_dc",
  "casting_arcane",
  "casting_divine",
  "casting_occult",
  "casting_primal",
]);
const NON_SKILL_PROF_KEYS = new Set([
  ...SKILL_ORDER,
  ...Object.keys(SAVE_LABELS),
  ...COMBAT_PROF_KEYS,
  ...SPELL_DC_PROF_KEYS,
  "perception",
]);

const PROFICIENCY_RANK_OPTIONS = [
  { value: 0, label: "Untrained" },
  { value: 1, label: "Trained" },
  { value: 2, label: "Expert" },
  { value: 3, label: "Master" },
  { value: 4, label: "Legendary" },
];

const ADDABLE_COMBAT_PROFS = [
  "unarmored",
  "light_armor",
  "medium_armor",
  "heavy_armor",
  "unarmed",
  "simple_weapons",
  "martial_weapons",
  "advanced_weapons",
];

const ADDABLE_SPELL_PROFS = [
  "class_dc",
  "spell_dc",
  "casting_arcane",
  "casting_divine",
  "casting_occult",
  "casting_primal",
];

const ADDABLE_SAVE_PROFS = ["fortitude", "reflex", "will", "perception"];
const ADDABLE_MANAGED_PROFS = [
  ...ADDABLE_SAVE_PROFS,
  ...ADDABLE_SPELL_PROFS,
  ...ADDABLE_COMBAT_PROFS,
];

function rankToStoredProficiency(rank: number, usesRawBonus: boolean): number {
  return usesRawBonus ? rank * 2 : rank;
}

function abilityBoostedScore(score: number, direction: 1 | -1): number {
  if (direction > 0) return Math.min(30, score + (score >= 18 ? 1 : 2));
  return Math.max(8, score - (score > 18 ? 1 : 2));
}

function isEditableBuildKey(key: string): key is keyof NonNullable<PBBuild["abilities"]> {
  return ["str", "dex", "con", "int", "wis", "cha"].includes(key);
}

// ── Content modal helpers ─────────────────────────────────────────────────────

const RARITY_STYLES: Record<string, string> = {
  common: "bg-muted text-muted-foreground border border-border",
  uncommon: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  rare: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  unique: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
};

function actionCostLabel(cost: string | null): string | null {
  if (!cost) return null;
  const map: Record<string, string> = {
    "1": "◆ 1 Action",
    "2": "◆◆ 2 Actions",
    "3": "◆◆◆ 3 Actions",
    reaction: "↺ Reaction",
    free: "◇ Free Action",
  };
  return map[cost] ?? cost;
}

function TraitBadge({ trait }: { trait: string }) {
  return (
    <span className="text-xs bg-muted/80 text-muted-foreground border border-border px-2 py-0.5 rounded-full capitalize">
      {trait}
    </span>
  );
}

type DisplayFeat = {
  key: string;
  name: string;
  type: string;
  level: number | null;
  source: string | null;
  description: string | null;
  rowId?: string;
};

const FEAT_GROUP_ORDER = ["General", "General (Skill)", "Class", "Archetype", "Ancestry", "Other"];

function displayFeatType(raw: string | null | undefined, slot?: string | null): string {
  const value = (raw ?? slot ?? "").toLowerCase().replace(/[_-]+/g, " ").trim();
  if (value.includes("skill")) return "General (Skill)";
  if (value.includes("class")) return "Class";
  if (value.includes("archetype")) return "Archetype";
  if (value.includes("ancestry") || value.includes("heritage") || value.includes("lineage")) {
    return "Ancestry";
  }
  if (value.includes("general")) return "General";
  return "Other";
}

function normalizeBuildFeat(
  feat: [string, string | null, string | null, string | null] | string[],
  index: number
): DisplayFeat {
  const name = Array.isArray(feat) ? String(feat[0] ?? "") : String(feat);
  const maybeType = Array.isArray(feat) ? (feat[1] ?? feat[2]) : null;
  const maybeLevel = Array.isArray(feat) ? (feat[3] ?? null) : null;
  const levelMatch = typeof maybeLevel === "string" ? maybeLevel.match(/\d+/) : null;
  return {
    key: `build-${index}-${name}`,
    name,
    type: displayFeatType(maybeType),
    level: levelMatch ? Number(levelMatch[0]) : null,
    source: Array.isArray(feat) ? (feat[2] ?? null) : null,
    description: null,
  };
}

function dedupeDisplayFeats(feats: DisplayFeat[]): DisplayFeat[] {
  const byKey = new Map<string, DisplayFeat>();
  for (const feat of feats) {
    const key = `${feat.name.trim().toLowerCase()}|${feat.type}`;
    const existing = byKey.get(key);
    if (
      !existing ||
      (!existing.description && feat.description) ||
      (!existing.rowId && feat.rowId)
    ) {
      byKey.set(key, feat);
    }
  }
  return [...byKey.values()].sort(
    (a, b) => (a.level ?? 999) - (b.level ?? 999) || a.name.localeCompare(b.name)
  );
}

function spellRankLabel(rank: number): string {
  return rank === 0 ? "Cantrip" : `Rank ${rank}`;
}

function rankLabel(rank: number): string {
  return PROFICIENCY_RANK_OPTIONS.find((option) => option.value === rank)?.label ?? "Untrained";
}

function formatList(values: unknown, fallback = "None"): string {
  const list = Array.isArray(values)
    ? values.map((value) => (typeof value === "string" ? value.trim() : "")).filter(Boolean)
    : typeof values === "string"
      ? values
          .split(/[,;]+/)
          .map((value) => value.trim())
          .filter(Boolean)
      : [];
  return list.length ? list.join(", ") : fallback;
}

type SheetAttack = NonNullable<PBBuild["custom_attacks"]>[number];

function formatAttackBonus(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return signedTotal(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return "";
}

function formatAttackTraits(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((trait) => (typeof trait === "string" ? trait.trim() : ""))
      .filter(Boolean)
      .join(", ");
  }
  return typeof value === "string" ? value.trim() : "";
}

function damageTypeLabel(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  const labels: Record<string, string> = {
    B: "Bludgeoning",
    P: "Piercing",
    S: "Slashing",
  };
  return labels[raw] ?? raw;
}

function normalizeWeaponAttack(value: unknown): SheetAttack | null {
  if (!isRecord(value)) return null;
  const name =
    (typeof value.display === "string" && value.display.trim()) ||
    (typeof value.name === "string" && value.name.trim());
  if (!name) return null;
  const die =
    (typeof value.die === "string" && value.die.trim()) ||
    (typeof value.damage === "string" && value.damage.trim());
  const damageBonus =
    typeof value.damageBonus === "number" && value.damageBonus !== 0
      ? signedTotal(value.damageBonus)
      : "";
  const damageType = damageTypeLabel(value.damageType);
  return {
    name,
    bonus: formatAttackBonus(value.attack ?? value.attackBonus),
    damage: [die ? `${die}${damageBonus}` : "", damageType].filter(Boolean).join(" "),
    traits: formatAttackTraits(value.traits),
    category: typeof value.type === "string" ? value.type : undefined,
    range: typeof value.range === "string" ? value.range : undefined,
  };
}

function getCharacterAttacks(build: PBBuild): SheetAttack[] {
  const attacks = new Map<string, SheetAttack>();
  if (Array.isArray(build.weapons)) {
    for (const attack of build.weapons
      .map(normalizeWeaponAttack)
      .filter((attack): attack is SheetAttack => !!attack)) {
      attacks.set(attack.name.toLowerCase(), attack);
    }
  }
  for (const attack of build.custom_attacks ?? []) {
    if (!attack.name?.trim()) continue;
    attacks.set(attack.name.toLowerCase(), {
      ...attack,
      bonus: formatAttackBonus(attack.bonus),
      traits: formatAttackTraits(attack.traits),
    });
  }
  return [...attacks.values()];
}

function getLoreSkills(build: PBBuild, level: number, usesRawBonus: boolean) {
  const intMod = abilityModNum(build.abilities?.int ?? 10);
  if (!Array.isArray(build.lores)) return [];
  return build.lores
    .map((lore): { skill: string; rank: number; total: number } | null => {
      let name = "";
      let rawRank = 0;
      let totalOverride: number | null = null;
      if (Array.isArray(lore) && typeof lore[0] === "string") {
        name = lore[0];
        rawRank = typeof lore[1] === "number" ? lore[1] : 0;
        totalOverride = typeof lore[2] === "number" ? lore[2] : null;
      } else if (isRecord(lore)) {
        name =
          (typeof lore.name === "string" && lore.name) ||
          (typeof lore.skill === "string" && lore.skill) ||
          "";
        rawRank =
          (typeof lore.rank === "number" && lore.rank) ||
          (typeof lore.prof === "number" && lore.prof) ||
          0;
        totalOverride = typeof lore.total === "number" ? lore.total : null;
      }
      if (!name.trim()) return null;
      return {
        skill: name,
        rank: proficiencyValueToRank(rawRank, usesRawBonus),
        total: totalOverride ?? normalizedProfBonus(rawRank, level, usesRawBonus) + intMod,
      };
    })
    .filter((lore): lore is { skill: string; rank: number; total: number } => !!lore);
}

function getEquipmentEntries(build: PBBuild): { name: string; qty: number }[] {
  if (!Array.isArray(build.equipment)) return [];
  return build.equipment
    .map((item) => {
      if (Array.isArray(item)) {
        return {
          name: typeof item[0] === "string" ? item[0] : "",
          qty: typeof item[1] === "number" ? item[1] : 1,
        };
      }
      if (isRecord(item)) {
        return {
          name: typeof item.name === "string" ? item.name : "",
          qty: typeof item.qty === "number" ? item.qty : 1,
        };
      }
      return { name: "", qty: 1 };
    })
    .filter((item) => item.name.trim());
}

// ── ContentModal — shared feat / item detail modal ────────────────────────────

function ContentModal({
  type,
  name,
  onClose,
}: {
  type: ContentType;
  name: string;
  onClose: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const { data, isLoading } = useQuery<FeatData | ItemData | null>({
    queryKey: ["content-modal", type, name.toLowerCase()],
    queryFn: async () => {
      const endpoint = type === "feat" ? "feats" : "items";
      const res = await fetch(`/api/content/${endpoint}?name=${encodeURIComponent(name)}&limit=5`);
      if (!res.ok) return null;
      const { data: rows } = (await res.json()) as { data: (FeatData | ItemData)[] };
      return rows?.find((r) => r.name.toLowerCase() === name.toLowerCase()) ?? null;
    },
    staleTime: Infinity,
  });

  const traits = Array.isArray(data?.traits) ? (data.traits as string[]) : [];
  const rarity = data?.rarity?.toLowerCase() ?? "common";
  const source = data?.source;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      {/* Card */}
      <div className="relative bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 pb-0">
          <div className="flex-1 min-w-0">
            <h2 className="font-heading text-xl font-bold leading-tight">{name}</h2>
            {data && (
              <p className="text-sm text-muted-foreground mt-0.5 capitalize">
                {type === "feat"
                  ? `${(data as FeatData).feat_type?.replace(/_/g, " ") ?? "Feat"} · Level ${data.level ?? "—"}`
                  : `${(data as ItemData).item_type ?? "Item"}${(data as ItemData).item_subtype ? ` · ${(data as ItemData).item_subtype}` : ""} · Level ${data.level ?? "—"}`}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="spinner" />
            </div>
          )}

          {!isLoading && !data && (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{name}</span> isn&apos;t in the local
                database yet.
              </p>
              <a
                href={`https://2e.aonprd.com/Search.aspx?query=${encodeURIComponent(name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink size={13} />
                Look up on Archives of Nethys
              </a>
            </div>
          )}

          {!isLoading && data && (
            <>
              {/* Traits + Rarity row */}
              {(traits.length > 0 || rarity !== "common") && (
                <div className="flex flex-wrap gap-1.5">
                  {rarity !== "common" && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${RARITY_STYLES[rarity] ?? RARITY_STYLES.common}`}
                    >
                      {rarity}
                    </span>
                  )}
                  {traits.map((t) => (
                    <TraitBadge key={t} trait={t} />
                  ))}
                </div>
              )}

              {/* Feat-specific metadata */}
              {type === "feat" &&
                (() => {
                  const f = data as FeatData;
                  const cost = actionCostLabel(f.action_cost);
                  return (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {cost && (
                        <>
                          <dt className="text-muted-foreground">Action</dt>
                          <dd className="font-mono text-xs">{cost}</dd>
                        </>
                      )}
                      {f.prerequisites && (
                        <>
                          <dt className="text-muted-foreground">Prerequisites</dt>
                          <dd>{f.prerequisites}</dd>
                        </>
                      )}
                      {f.trigger && (
                        <>
                          <dt className="text-muted-foreground">Trigger</dt>
                          <dd>{f.trigger}</dd>
                        </>
                      )}
                    </div>
                  );
                })()}

              {/* Item-specific metadata */}
              {type === "item" &&
                (() => {
                  const it = data as ItemData;
                  return (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {it.price_cp !== null && it.price_cp !== undefined && (
                        <>
                          <dt className="text-muted-foreground">Price</dt>
                          <dd>{formatPriceCp(it.price_cp)}</dd>
                        </>
                      )}
                      {it.bulk && (
                        <>
                          <dt className="text-muted-foreground">Bulk</dt>
                          <dd>{it.bulk}</dd>
                        </>
                      )}
                      {it.usage && (
                        <>
                          <dt className="text-muted-foreground">Usage</dt>
                          <dd className="capitalize">{it.usage}</dd>
                        </>
                      )}
                      {it.is_magical && (
                        <>
                          <dt className="text-muted-foreground">Magical</dt>
                          <dd>Yes</dd>
                        </>
                      )}
                    </div>
                  );
                })()}

              {/* Description */}
              {data.description && (
                <div className="border-t border-border pt-3">
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                    {data.description}
                  </p>
                </div>
              )}

              {/* Source */}
              {source && (
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <span className="text-xs text-muted-foreground/60">{source}</span>
                  <a
                    href={`https://2e.aonprd.com/Search.aspx?query=${encodeURIComponent(name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground/60 hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink size={11} />
                    AoN
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared presentational components ─────────────────────────────────────────

const PROF_STYLES: Record<number, string> = {
  0: "bg-muted text-muted-foreground",
  1: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  2: "bg-green-500/20 text-green-400 border border-green-500/30",
  3: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  4: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
};
const PROF_LETTERS = ["U", "T", "E", "M", "L"];
const PROF_NAMES = ["Untrained", "Trained", "Expert", "Master", "Legendary"];

function ProfBadge({ rank }: { rank: number }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold shrink-0 ${PROF_STYLES[rank] ?? PROF_STYLES[0]}`}
      title={PROF_NAMES[rank] ?? "Untrained"}
    >
      {PROF_LETTERS[rank] ?? "U"}
    </span>
  );
}

function AbilityBlock({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex flex-col items-center py-3 px-1 bg-muted/60 rounded-lg border border-border/50">
      <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">
        {label}
      </span>
      <span className="text-xl font-bold font-mono mt-0.5">{abilityModStr(score)}</span>
      <span className="text-xs text-muted-foreground mt-0.5">{score}</span>
    </div>
  );
}

function PipRow({
  count,
  max,
  color,
  label,
}: {
  count: number;
  max: number;
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-colors ${
              i < count
                ? `${color} border-transparent`
                : "border-muted-foreground/30 bg-transparent"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
      <Radio size={10} className="animate-pulse" />
      Live
    </span>
  );
}

function SaveBox({
  label,
  rank,
  abilityScore,
  level,
  usesRawBonus,
}: {
  label: string;
  rank: number;
  abilityScore: number;
  level: number;
  usesRawBonus: boolean;
}) {
  const total = normalizedProfBonus(rank, level, usesRawBonus) + abilityModNum(abilityScore);
  const displayRank = proficiencyValueToRank(rank, usesRawBonus);
  return (
    <div className="flex flex-col items-center p-2 bg-muted/40 rounded-lg">
      <ProfBadge rank={displayRank} />
      <span className="text-xl font-bold font-mono mt-1">{signedTotal(total)}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
        {label}
      </span>
    </div>
  );
}

// ── Companion card ────────────────────────────────────────────────────────────

function MiniDetail({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function companionMaxHp(comp: BotCompanion, charLevel: number): number | null {
  if (comp.baseType !== "custom" || !comp.customStats) return null;
  const base = comp.customStats.hpPerLevel ?? 8;
  const con = comp.customStats.abilities?.con ?? 0;
  if (comp.form === "young") return base * charLevel;
  if (comp.form === "mature") return (base + con) * charLevel;
  return (base + con + 1) * charLevel;
}

const COMPANION_FORM_OPTIONS = [
  { value: "young", label: "Young" },
  { value: "mature", label: "Mature" },
  { value: "nimble", label: "Nimble" },
  { value: "savage", label: "Savage" },
];

function CompanionCard({
  comp,
  compId,
  charLevel,
  updateMutation,
}: {
  comp: BotCompanion;
  compId: string;
  charLevel: number;
  updateMutation: ReturnType<typeof useUpdateCompanion>;
}) {
  const maxHp = companionMaxHp(comp, charLevel);
  const curHp = comp.currentHp;
  const hpPct = maxHp && curHp !== null ? Math.max(0, Math.min(100, (curHp / maxHp) * 100)) : null;
  const isPending =
    updateMutation.isPending && (updateMutation.variables as { compId: string })?.compId === compId;

  return (
    <div className="p-4 bg-muted/40 rounded-lg space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">{comp.displayName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-muted-foreground capitalize">
              {comp.baseType.replace(/-/g, " ")} ·
            </span>
            <InlineSelect
              value={comp.form}
              options={COMPANION_FORM_OPTIONS}
              onCommit={(form) => updateMutation.mutate({ compId, form })}
              isPending={isPending}
              aria-label="Companion form"
            />
          </div>
        </div>

        {/* HP display */}
        {curHp !== null ? (
          maxHp ? (
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0 ${
                curHp === 0
                  ? "text-destructive bg-destructive/10"
                  : curHp / maxHp < 0.3
                    ? "text-orange-400 bg-orange-500/10"
                    : "text-green-400 bg-green-500/10"
              }`}
            >
              {curHp}/{maxHp} HP
            </span>
          ) : (
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0 ${
                curHp === 0
                  ? "text-destructive bg-destructive/10"
                  : "text-green-400 bg-green-500/10"
              }`}
            >
              {curHp} HP
            </span>
          )
        ) : (
          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted shrink-0">
            Not in combat
          </span>
        )}
      </div>

      {/* HP bar */}
      {hpPct !== null && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${hpPct === 0 ? "bg-destructive" : hpPct < 30 ? "bg-orange-400" : "bg-green-400"}`}
            style={{ width: `${hpPct}%` }}
          />
        </div>
      )}

      {/* HP stepper */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">HP</span>
        <NumberStepper
          value={curHp ?? 0}
          min={0}
          max={maxHp ?? undefined}
          onCommit={(v) => updateMutation.mutate({ compId, current_hp: v })}
          isPending={isPending}
        />
        {curHp !== null && (
          <button
            onClick={() => updateMutation.mutate({ compId, current_hp: null })}
            disabled={isPending}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors ml-1"
            title="Clear HP (not in combat)"
          >
            clear
          </button>
        )}
      </div>

      {/* Notes */}
      <InlineTextarea
        value={comp.notes ?? ""}
        placeholder="Add companion notes…"
        emptyText="No notes."
        onCommit={(notes) => updateMutation.mutate({ compId, notes })}
        isPending={isPending}
      />
    </div>
  );
}

// ── Mutation hooks ────────────────────────────────────────────────────────────

function useAddNote(characterId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { text: string; category: string; pinned?: boolean }>({
    mutationFn: (body) =>
      fetch(`/api/characters/${characterId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: notesKeys.all }),
  });
}

function useDeleteNote(characterId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { noteId: number }>({
    mutationFn: (body) =>
      fetch(`/api/characters/${characterId}/notes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: notesKeys.all }),
  });
}

function useSpendDowntime(characterId: string) {
  const qc = useQueryClient();
  return useMutation<
    { actualDelta: number; clipped: boolean },
    Error,
    { delta: number; reason: string }
  >({
    mutationFn: (body) =>
      fetch(`/api/characters/${characterId}/downtime`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: downtimeKeys.all }),
  });
}

function useAddItem() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { name: string; qty: number; category: string }>({
    mutationFn: (body) =>
      fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: bagKeys.mine() }),
  });
}

function useRemoveItem() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { category: string; itemName: string }>({
    mutationFn: (body) =>
      fetch("/api/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: bagKeys.mine() }),
  });
}

function useUpdateItemQty() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { category: string; itemName: string; qty: number }>({
    mutationFn: (body) =>
      fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: bagKeys.mine() }),
  });
}

// ── Inline qty editor ─────────────────────────────────────────────────────────

function EditableQty({ item, category }: { item: BagItem; category: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(item.qty));
  const updateQty = useUpdateItemQty();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(String(item.qty));
          setEditing(true);
        }}
        className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
        title="Click to edit quantity"
      >
        ×{item.qty}
      </button>
    );
  }

  const save = () => {
    const n = parseInt(value, 10);
    if (n >= 1 && n !== item.qty) {
      updateQty.mutate({ category, itemName: item.name, qty: n });
    }
    setEditing(false);
  };

  return (
    <input
      className="w-14 text-xs text-center bg-muted/60 border border-primary/50 rounded px-1 py-0.5 font-mono focus:outline-none focus:border-primary"
      type="text"
      inputMode="numeric"
      pattern="[0-9+-]*"
      min={1}
      value={value}
      autoFocus
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          setEditing(false);
        }
      }}
    />
  );
}

// ── Forms ─────────────────────────────────────────────────────────────────────

function AddNoteForm({ characterId, onClose }: { characterId: string; onClose: () => void }) {
  const addNote = useAddNote(characterId);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("npcs");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addNote.mutateAsync({ text: text.trim(), category });
    setText("");
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-border">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Category</label>
        <select
          className="input text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="npcs">🧑 NPCs</option>
          <option value="locations">🗺️ Locations</option>
          <option value="plot-threads">🎭 Plot Threads</option>
          <option value="influence">🤝 Influence</option>
          <option value="items">💎 Items</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Note</label>
        <textarea
          className="input text-sm resize-none"
          rows={3}
          placeholder="Write your session note here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          required
        />
      </div>
      {addNote.error && <p className="text-xs text-destructive">{addNote.error.message}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
          Cancel
        </button>
        <button
          type="submit"
          disabled={addNote.isPending || !text.trim()}
          className="btn btn-primary btn-sm"
        >
          {addNote.isPending ? "Saving…" : "Add Note"}
        </button>
      </div>
    </form>
  );
}

function SpendDowntimeForm({
  characterId,
  currentBank,
  onClose,
}: {
  characterId: string;
  currentBank: number;
  onClose: () => void;
}) {
  const spendMutation = useSpendDowntime(characterId);
  const [days, setDays] = useState("1");
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"spend" | "add">("spend");
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(days, 10);
    if (!n || n < 1) return;
    const delta = mode === "spend" ? -n : n;
    const result = await spendMutation.mutateAsync({ delta, reason: reason.trim() });
    if (result.clipped) {
      setFeedback(`Only ${Math.abs(result.actualDelta)} day(s) deducted (not enough remaining).`);
    }
    setDays("1");
    setReason("");
    if (!result.clipped) onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-border">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("spend")}
          className={`btn btn-sm flex-1 ${mode === "spend" ? "btn-primary" : "btn-ghost"}`}
        >
          Spend Days
        </button>
        <button
          type="button"
          onClick={() => setMode("add")}
          className={`btn btn-sm flex-1 ${mode === "add" ? "btn-primary" : "btn-ghost"}`}
        >
          Add Days
        </button>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">
          {mode === "spend" ? `Days to spend (have ${currentBank})` : "Days to add"}
        </label>
        <input
          className="input text-sm"
          type="text"
          inputMode="numeric"
          pattern="[0-9+-]*"
          min={1}
          max={mode === "spend" ? currentBank : undefined}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Reason (optional)</label>
        <input
          className="input text-sm"
          placeholder={mode === "spend" ? "e.g. Crafting, Studying…" : "e.g. Session reward"}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      {(spendMutation.error || feedback) && (
        <p className={`text-xs ${spendMutation.error ? "text-destructive" : "text-amber-400"}`}>
          {spendMutation.error?.message ?? feedback}
        </p>
      )}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
          Cancel
        </button>
        <button
          type="submit"
          disabled={spendMutation.isPending || !days || parseInt(days) < 1}
          className="btn btn-primary btn-sm"
        >
          {spendMutation.isPending ? "Saving…" : "Confirm"}
        </button>
      </div>
    </form>
  );
}

const DEFAULT_CATEGORIES = ["General", "Armor", "Weapons", "Potions", "Tools", "Valuables"];

function AddItemForm({
  existingCategories,
  onClose,
}: {
  existingCategories: string[];
  onClose: () => void;
}) {
  const addMutation = useAddItem();
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [category, setCategory] = useState("");
  const [customCat, setCustomCat] = useState("");

  const allCats = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories])).sort();
  const effectiveCat = category === "__custom__" ? customCat.trim() : category || "General";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const cat = category === "__custom__" ? customCat.trim() : category || "General";
    if (!cat) return;
    await addMutation.mutateAsync({ name: name.trim(), qty: parseInt(qty) || 1, category: cat });
    setName("");
    setQty("1");
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-border">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium">Add Item</p>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={15} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Item Name</label>
          <ItemSearchCombobox
            value={name}
            onChange={setName}
            placeholder="Search or enter item name…"
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Quantity</label>
          <input
            className="input text-sm"
            type="text"
            inputMode="numeric"
            pattern="[0-9+-]*"
            min={1}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Category</label>
          <select
            className="input text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">General</option>
            {allCats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="__custom__">+ New category…</option>
          </select>
        </div>
        {category === "__custom__" && (
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">New Category Name</label>
            <input
              className="input text-sm"
              placeholder="e.g. Quest Items"
              value={customCat}
              onChange={(e) => setCustomCat(e.target.value)}
              required
            />
          </div>
        )}
      </div>
      {addMutation.error && <p className="text-xs text-destructive">{addMutation.error.message}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={
            addMutation.isPending || !name.trim() || (category === "__custom__" && !effectiveCat)
          }
        >
          {addMutation.isPending ? "Adding…" : "Add Item"}
        </button>
      </div>
    </form>
  );
}

// ── Tab panels ────────────────────────────────────────────────────────────────

function ProficiencyEditor({
  rank,
  disabled,
  onChange,
}: {
  rank: number;
  disabled: boolean;
  onChange: (rank: number) => void;
}) {
  return (
    <select
      className="input h-8 w-28 px-2 py-1 text-xs"
      value={rank}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
    >
      {PROFICIENCY_RANK_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function StatsTabPanel({
  build,
  level,
  onSaveLevel,
  onSaveAbilities,
  onSaveExtras,
  onSaveProficiencies,
  onSaveCustomAttacks,
  isSaving,
  usesRawBonus,
}: {
  build: PBBuild;
  level: number;
  onSaveLevel: (level: number) => void;
  onSaveAbilities: (abilities: NonNullable<PBBuild["abilities"]>) => void;
  onSaveExtras: (extras: Record<string, unknown>) => void;
  onSaveProficiencies: (proficiencies: Record<string, number>) => void;
  onSaveCustomAttacks: (
    attacks: { name: string; bonus: string; damage: string; traits: string }[]
  ) => void;
  isSaving: boolean;
  usesRawBonus: boolean;
}) {
  const abs = build.abilities;
  const profs = build.proficiencies ?? {};
  const profEntries = Object.entries(profs).filter(([, rank]) => rank > 0);
  const loreFromPathbuilder = getLoreSkills(build, level, usesRawBonus);
  const pathbuilderLoreNames = new Set(loreFromPathbuilder.map((lore) => customKey(lore.skill)));
  const loreProfs = profEntries.filter(([key]) => canonicalProfKey(key).includes("lore"));
  const combatProfs = profEntries.filter(([key]) => COMBAT_PROF_KEYS.has(canonicalProfKey(key)));
  const spellDcProfs = profEntries.filter(([key]) => SPELL_DC_PROF_KEYS.has(canonicalProfKey(key)));
  const extraProfs = profEntries.filter(([key]) => {
    const canonical = canonicalProfKey(key);
    return (
      !NON_SKILL_PROF_KEYS.has(canonical) &&
      !canonical.includes("lore") &&
      !COMBAT_PROF_KEYS.has(canonical) &&
      !SPELL_DC_PROF_KEYS.has(canonical)
    );
  });
  const sheetAttacks = getCharacterAttacks(build);
  const customAttacks = build.custom_attacks ?? [];
  const defenses = getDefenseDetails(build, level, usesRawBonus);
  const [extraSkillName, setExtraSkillName] = useState("");
  const [extraSkillRank, setExtraSkillRank] = useState(1);
  const [loreSkillName, setLoreSkillName] = useState("");
  const [loreSkillRank, setLoreSkillRank] = useState(1);
  const [profToAdd, setProfToAdd] = useState("light_armor");
  const [profToAddRank, setProfToAddRank] = useState(1);
  const [attackName, setAttackName] = useState("");
  const [attackBonus, setAttackBonus] = useState("");
  const [attackDamage, setAttackDamage] = useState("");
  const [attackTraits, setAttackTraits] = useState("");
  const classDcAbility = abilityKey(build.keyability, "str");
  const spellcastingAbility = abilityKey(
    build.spellCasters?.[0]?.ability?.toLowerCase?.() ?? build.keyability,
    "int"
  );

  function storedProfBonus(rankOrBonus: number): number {
    return normalizedProfBonus(rankOrBonus, level, usesRawBonus);
  }

  function customLoreTotal(rankOrBonus: number): number {
    return storedProfBonus(rankOrBonus) + abilityModNum(abs?.int ?? 10);
  }

  function classDcTotal(rankOrBonus: number): number {
    return 10 + storedProfBonus(rankOrBonus) + abilityModNum(abs?.[classDcAbility] ?? 10);
  }

  function spellAttackTotal(rankOrBonus: number): number {
    return storedProfBonus(rankOrBonus) + abilityModNum(abs?.[spellcastingAbility] ?? 10);
  }

  function spellDcTotal(rankOrBonus: number): number {
    return 10 + spellAttackTotal(rankOrBonus);
  }

  function spellcastingSummary(key: string, rankOrBonus: number): string {
    return canonicalProfKey(key) === "class_dc"
      ? `DC ${classDcTotal(rankOrBonus)}`
      : `${signedTotal(spellAttackTotal(rankOrBonus))} / DC ${spellDcTotal(rankOrBonus)}`;
  }

  function addExtraSkill() {
    const key = customKey(extraSkillName);
    if (!key) return;
    onSaveProficiencies({ [key]: rankToStoredProficiency(extraSkillRank, usesRawBonus) });
    setExtraSkillName("");
    setExtraSkillRank(1);
  }

  function addLoreSkill() {
    const label = loreSkillName.trim().replace(/\s+lore$/i, "");
    const key = customKey(`${label} Lore`);
    if (!key) return;
    onSaveProficiencies({ [key]: rankToStoredProficiency(loreSkillRank, usesRawBonus) });
    setLoreSkillName("");
    setLoreSkillRank(1);
  }

  function addManagedProficiency() {
    if (!profToAdd) return;
    onSaveProficiencies({
      [profToAdd]: rankToStoredProficiency(profToAddRank, usesRawBonus),
    });
    setProfToAddRank(1);
  }

  function setProficiencyRank(key: string, rank: number) {
    onSaveProficiencies({ [key]: rankToStoredProficiency(rank, usesRawBonus) });
  }

  function removeExtraSkill(key: string) {
    onSaveProficiencies({ [key]: 0 });
  }

  function addCustomAttack() {
    const name = attackName.trim();
    if (!name) return;
    onSaveCustomAttacks([
      ...customAttacks.map((attack) => ({
        name: attack.name,
        bonus: String(attack.bonus ?? ""),
        damage: attack.damage,
        traits: formatAttackTraits(attack.traits),
      })),
      {
        name,
        bonus: attackBonus.trim(),
        damage: attackDamage.trim(),
        traits: attackTraits.trim(),
      },
    ]);
    setAttackName("");
    setAttackBonus("");
    setAttackDamage("");
    setAttackTraits("");
  }

  function removeCustomAttack(index: number) {
    onSaveCustomAttacks(
      customAttacks
        .filter((_, i) => i !== index)
        .map((attack) => ({
          name: attack.name,
          bonus: String(attack.bonus ?? ""),
          damage: attack.damage,
          traits: formatAttackTraits(attack.traits),
        }))
    );
  }

  function saveDefenseText(key: "immunities" | "resistances" | "weaknesses", value: string) {
    onSaveExtras({ [key]: value.trim() || null });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Level & Ability Scores
          </h4>
          <p className="text-xs text-muted-foreground">
            Ability Boost uses PF2e&apos;s +2 below 18 and +1 at 18 or higher.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Level</label>
            <NumberStepper
              value={level}
              min={1}
              max={20}
              onCommit={(nextLevel) => onSaveLevel(nextLevel)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Max HP recalculates from ancestry HP, class HP, CON, and level.
            </p>
          </div>
          {abs && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
              {Object.keys(abs)
                .filter(isEditableBuildKey)
                .map((key) => (
                  <div key={key} className="rounded-lg border border-border bg-background/40 p-2">
                    <div className="text-xs text-muted-foreground uppercase">{key}</div>
                    <div className="text-lg font-bold">{abs[key]}</div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {abilityModStr(abs[key])}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        className="btn-outline px-2 py-1 text-xs"
                        disabled={isSaving}
                        onClick={() =>
                          onSaveAbilities({ ...abs, [key]: abilityBoostedScore(abs[key], -1) })
                        }
                      >
                        - Boost
                      </button>
                      <button
                        type="button"
                        className="btn-outline px-2 py-1 text-xs"
                        disabled={isSaving}
                        onClick={() =>
                          onSaveAbilities({ ...abs, [key]: abilityBoostedScore(abs[key], 1) })
                        }
                      >
                        + Boost
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {abs && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Perception
          </h4>
          <div className="flex items-center gap-3 py-2 px-3 bg-muted/40 rounded-lg">
            <ProfBadge rank={proficiencyValueToRank(profs.perception ?? 2, usesRawBonus)} />
            <span className="flex-1 text-sm font-medium">Perception</span>
            <span className="text-xs text-muted-foreground">WIS {abilityModStr(abs.wis)}</span>
            <span className="font-mono font-bold text-sm w-10 text-right">
              {signedTotal(
                normalizedProfBonus(profs.perception ?? 2, level, usesRawBonus) +
                  abilityModNum(abs.wis)
              )}
            </span>
            <ProficiencyEditor
              rank={proficiencyValueToRank(profs.perception ?? 2, usesRawBonus)}
              disabled={isSaving}
              onChange={(rank) => setProficiencyRank("perception", rank)}
            />
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Defenses
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Track immunities, resistances, and weaknesses from ancestry, class features, items, or
              conditions.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(["immunities", "resistances", "weaknesses"] as const).map((key) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground mb-1 block capitalize">{key}</label>
              <textarea
                className="input min-h-24 resize-y text-sm"
                defaultValue={defenses[key]}
                placeholder={
                  key === "resistances"
                    ? "e.g. fire 5, mental 2"
                    : key === "weaknesses"
                      ? "e.g. vitality 3, silver 5"
                      : "e.g. disease, poison"
                }
                disabled={isSaving}
                onBlur={(event) => saveDefenseText(key, event.currentTarget.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Skills
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
          {SKILL_ORDER.map((skill) => {
            const rank = profs[skill] ?? 0;
            const abilKey = SKILL_ABILITY_MAP[skill];
            const abilScore = abs ? (abs[abilKey] ?? 10) : 10;
            const total = normalizedProfBonus(rank, level, usesRawBonus) + abilityModNum(abilScore);
            return (
              <div
                key={skill}
                className="flex items-center gap-3 py-1.5 px-3 rounded-md hover:bg-muted/40 transition-colors"
              >
                <ProfBadge rank={proficiencyValueToRank(rank, usesRawBonus)} />
                <span className="flex-1 text-sm capitalize">{skill}</span>
                <span className="text-xs text-muted-foreground uppercase w-7">
                  {abilKey.slice(0, 3)}
                </span>
                <span className="font-mono font-bold text-sm w-10 text-right">
                  {signedTotal(total)}
                </span>
                <ProficiencyEditor
                  rank={proficiencyValueToRank(rank, usesRawBonus)}
                  disabled={isSaving}
                  onChange={(nextRank) => setProficiencyRank(skill, nextRank)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Additional Skills
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Add or remove unlimited homebrew and campaign skills.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {extraProfs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
              {extraProfs.map(([key, rank]) => (
                <div
                  key={key}
                  className="flex items-center gap-3 py-1.5 px-3 rounded-md hover:bg-muted/40 transition-colors"
                >
                  <ProfBadge rank={proficiencyValueToRank(rank, usesRawBonus)} />
                  <span className="flex-1 text-sm">{profLabel(key)}</span>
                  <span className="font-mono font-bold text-sm w-10 text-right">
                    {signedTotal(customLoreTotal(rank))}
                  </span>
                  <ProficiencyEditor
                    rank={proficiencyValueToRank(rank, usesRawBonus)}
                    disabled={isSaving}
                    onChange={(nextRank) => setProficiencyRank(key, nextRank)}
                  />
                  <button
                    type="button"
                    onClick={() => removeExtraSkill(key)}
                    disabled={isSaving}
                    className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    title="Remove skill"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-[1fr_150px_auto] gap-2">
            <input
              className="input text-sm"
              value={extraSkillName}
              onChange={(e) => setExtraSkillName(e.target.value)}
              placeholder="e.g. Piloting, Dragonmark Training"
            />
            <select
              className="input text-sm"
              value={extraSkillRank}
              onChange={(e) => setExtraSkillRank(Number(e.target.value))}
            >
              <option value={1}>Trained</option>
              <option value={2}>Expert</option>
              <option value={3}>Master</option>
              <option value={4}>Legendary</option>
            </select>
            <button
              type="button"
              onClick={addExtraSkill}
              disabled={isSaving || !extraSkillName.trim()}
              className="btn-outline text-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Lore Skills
          </h4>
          <p className="sr-only">Add, increase, decrease, or remove Lore skills.</p>
        </div>
        <div className="space-y-2">
          {(loreProfs.length > 0 || loreFromPathbuilder.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
              {[
                ...loreProfs.map(([key, rank]) => ({
                  key,
                  label: profLabel(key),
                  rank: proficiencyValueToRank(rank, usesRawBonus),
                  total: null as number | null,
                  removable: true,
                })),
                ...loreFromPathbuilder
                  .filter((lore) => !pathbuilderLoreNames.has(customKey(lore.skill)))
                  .map((lore) => ({
                    key: `pathbuilder-${lore.skill}`,
                    label: lore.skill,
                    rank: lore.rank,
                    total: lore.total,
                    removable: false,
                  })),
              ].map((lore) => (
                <div
                  key={lore.key}
                  className="flex items-center gap-3 py-1.5 px-3 rounded-md hover:bg-muted/40 transition-colors"
                >
                  <ProfBadge rank={lore.rank} />
                  <span className="text-sm flex-1">{lore.label}</span>
                  <span className="font-mono text-sm font-semibold w-10 text-right">
                    {signedTotal(lore.total ?? customLoreTotal(profs[lore.key] ?? 0))}
                  </span>
                  {lore.removable && (
                    <ProficiencyEditor
                      rank={lore.rank}
                      disabled={isSaving}
                      onChange={(nextRank) => setProficiencyRank(lore.key, nextRank)}
                    />
                  )}
                  {lore.removable && (
                    <button
                      type="button"
                      onClick={() => removeExtraSkill(lore.key)}
                      disabled={isSaving}
                      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                      title="Remove lore skill"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_150px_auto] gap-2">
            <input
              className="input text-sm"
              value={loreSkillName}
              onChange={(e) => setLoreSkillName(e.target.value)}
              placeholder="e.g. Warfare, Airship, Undead"
            />
            <select
              className="input text-sm"
              value={loreSkillRank}
              onChange={(e) => setLoreSkillRank(Number(e.target.value))}
            >
              <option value={1}>Trained</option>
              <option value={2}>Expert</option>
              <option value={3}>Master</option>
              <option value={4}>Legendary</option>
            </select>
            <button
              type="button"
              onClick={addLoreSkill}
              disabled={isSaving || !loreSkillName.trim()}
              className="btn-outline text-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus size={14} />
              Add Lore
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Spells & DCs
          </h4>
        </div>
        {spellDcProfs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
            {spellDcProfs.map(([key, rank]) => (
              <div
                key={key}
                className="flex items-center gap-3 py-1.5 px-3 rounded-md hover:bg-muted/40 transition-colors"
              >
                <ProfBadge rank={proficiencyValueToRank(rank, usesRawBonus)} />
                <span className="text-sm flex-1">{profLabel(key)}</span>
                <span className="font-mono font-bold text-sm whitespace-nowrap">
                  {spellcastingSummary(key, rank)}
                </span>
                <ProficiencyEditor
                  rank={proficiencyValueToRank(rank, usesRawBonus)}
                  disabled={isSaving}
                  onChange={(nextRank) => setProficiencyRank(key, nextRank)}
                />
                <button
                  type="button"
                  onClick={() => removeExtraSkill(key)}
                  disabled={isSaving}
                  className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  title="Remove proficiency"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Armor & Weapons
          </h4>
        </div>
        {combatProfs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
            {combatProfs.map(([key, rank]) => (
              <div
                key={key}
                className="flex items-center gap-3 py-1.5 px-3 rounded-md hover:bg-muted/40 transition-colors"
              >
                <ProfBadge rank={proficiencyValueToRank(rank, usesRawBonus)} />
                <span className="text-sm flex-1">{profLabel(key)}</span>
                <span className="font-mono font-bold text-sm w-10 text-right">
                  {signedTotal(storedProfBonus(rank))}
                </span>
                <ProficiencyEditor
                  rank={proficiencyValueToRank(rank, usesRawBonus)}
                  disabled={isSaving}
                  onChange={(nextRank) => setProficiencyRank(key, nextRank)}
                />
                <button
                  type="button"
                  onClick={() => removeExtraSkill(key)}
                  disabled={isSaving}
                  className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  title="Remove proficiency"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Add Proficiency
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_150px_auto] gap-2">
          <select
            className="input text-sm"
            value={profToAdd}
            onChange={(e) => setProfToAdd(e.target.value)}
          >
            {ADDABLE_MANAGED_PROFS.map((key) => (
              <option key={key} value={key}>
                {profLabel(key)}
              </option>
            ))}
          </select>
          <select
            className="input text-sm"
            value={profToAddRank}
            onChange={(e) => setProfToAddRank(Number(e.target.value))}
          >
            <option value={1}>Trained</option>
            <option value={2}>Expert</option>
            <option value={3}>Master</option>
            <option value={4}>Legendary</option>
          </select>
          <button
            type="button"
            onClick={addManagedProficiency}
            disabled={isSaving || !profToAdd}
            className="btn-outline text-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Custom Attacks
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Add or remove strikes, spell attacks, and special attack options.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {sheetAttacks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sheetAttacks.map((attack, index) => (
                <div
                  key={`${attack.name}-${index}`}
                  className="bg-muted/40 rounded-md p-3 flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{attack.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[attack.bonus, attack.damage].filter(Boolean).join(" · ") ||
                        "No attack details set"}
                    </p>
                    {formatAttackTraits(attack.traits) && (
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatAttackTraits(attack.traits)}
                      </p>
                    )}
                  </div>
                  {customAttacks.some(
                    (custom) => custom.name.toLowerCase() === attack.name.toLowerCase()
                  ) && (
                    <button
                      type="button"
                      onClick={() =>
                        removeCustomAttack(
                          customAttacks.findIndex(
                            (custom) => custom.name.toLowerCase() === attack.name.toLowerCase()
                          )
                        )
                      }
                      disabled={isSaving}
                      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                      title="Remove attack"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_90px_1fr_auto] gap-2">
            <input
              className="input text-sm"
              value={attackName}
              onChange={(e) => setAttackName(e.target.value)}
              placeholder="Name, e.g. Storm Saber"
            />
            <input
              className="input text-sm"
              value={attackBonus}
              onChange={(e) => setAttackBonus(e.target.value)}
              placeholder="+9"
            />
            <input
              className="input text-sm"
              value={attackDamage}
              onChange={(e) => setAttackDamage(e.target.value)}
              placeholder="1d8+4 slashing"
            />
            <button
              type="button"
              onClick={addCustomAttack}
              disabled={isSaving || !attackName.trim()}
              className="btn-outline text-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus size={14} />
              Add
            </button>
          </div>
          <input
            className="input text-sm"
            value={attackTraits}
            onChange={(e) => setAttackTraits(e.target.value)}
            placeholder="Traits, e.g. magical, agile, finesse"
          />
        </div>
      </div>
    </div>
  );
}

function OfficialSheetField({
  label,
  value,
  tall = false,
}: {
  label: string;
  value?: string | number | null;
  tall?: boolean;
}) {
  return (
    <div
      className={`official-field rounded-md border border-slate-900 bg-white px-2 py-1 ${tall ? "min-h-16" : "min-h-10"}`}
    >
      <div className="text-[9px] font-bold uppercase tracking-wide text-slate-600">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-slate-950">{value || ""}</div>
    </div>
  );
}

function OfficialSheetPanel({
  characterId,
  character,
  build,
  level,
  maxHp,
  currentHp,
  usesRawBonus,
  defenses,
}: {
  characterId: string;
  character: Tables<"characters">;
  build: PBBuild;
  level: number;
  maxHp: number | null;
  currentHp: number | null | undefined;
  usesRawBonus: boolean;
  defenses: ReturnType<typeof getDefenseDetails> | null;
}) {
  const { data: characterFeatRows } = useCharacterFeats(characterId);
  const { data: knownSpells } = useCharacterKnownSpells(characterId);
  const abs = build.abilities ?? { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  const profs = build.proficiencies ?? {};
  const attacks = getCharacterAttacks(build);
  const equipment = getEquipmentEntries(build);
  const loreSkills = getLoreSkills(build, level, usesRawBonus);
  const featNames = dedupeDisplayFeats([
    ...(characterFeatRows?.data ?? [])
      .filter((row) => row.feat)
      .map((row) => ({
        key: row.id,
        name: row.feat.name,
        type: displayFeatType(row.feat.feat_type, row.feat_slot),
        level: row.level_acquired ?? row.feat.level ?? null,
        source: row.feat.source ?? null,
        description: row.feat.description ?? row.notes ?? null,
        rowId: row.id,
      })),
    ...(build.feats ?? []).map(normalizeBuildFeat).filter((feat) => feat.name.trim()),
  ]);
  const spells = knownSpells?.data ?? [];
  const spellsByRank = spells.reduce<Record<string, CharacterKnownSpell[]>>((acc, spell) => {
    const key = spellRankLabel(spell.rank);
    (acc[key] ??= []).push(spell);
    return acc;
  }, {});
  const printSheet = () => window.print();
  const saves = [
    { key: "fortitude", label: "Fortitude", ability: "con" as const },
    { key: "reflex", label: "Reflex", ability: "dex" as const },
    { key: "will", label: "Will", ability: "wis" as const },
  ];

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .official-print-sheet, .official-print-sheet * { visibility: visible !important; }
          .official-print-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            color: #020617 !important;
            background: white !important;
            box-shadow: none !important;
          }
          .official-print-actions { display: none !important; }
          .official-print-page { break-after: page; page-break-after: always; }
          @page { size: letter; margin: 0.35in; }
        }
      `}</style>
      <div className="official-print-actions flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-xl font-bold">Official-Style Character Sheet</h3>
          <p className="text-sm text-muted-foreground">
            Print this sheet or choose Save as PDF in your browser&apos;s print dialog.
          </p>
        </div>
        <button
          type="button"
          onClick={printSheet}
          className="btn btn-primary flex items-center gap-2"
        >
          <Printer size={16} />
          Print / Export PDF
        </button>
      </div>

      <div className="official-print-sheet rounded-lg border border-border bg-white p-4 text-slate-950 shadow-lg">
        <section className="official-print-page space-y-3">
          <div className="border-b-4 border-slate-950 pb-2">
            <div className="text-xs font-bold uppercase tracking-[0.35em] text-slate-600">
              Pathfinder Second Edition Remaster
            </div>
            <h2 className="font-serif text-4xl font-black tracking-tight">Character Sheet</h2>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
            <OfficialSheetField label="Character Name" value={character.name} />
            <OfficialSheetField label="Player" value=" " />
            <OfficialSheetField label="Ancestry" value={character.ancestry_name} />
            <OfficialSheetField label="Heritage" value={character.heritage_name} />
            <OfficialSheetField label="Background" value={character.background_name} />
            <OfficialSheetField
              label="Class / Level"
              value={`${character.class_name ?? ""} ${level}`}
            />
            <OfficialSheetField label="Deity" value={build.deity ?? ""} />
            <OfficialSheetField
              label="Size"
              value={getNestedString(build, [["size"], ["stats", "size"]]) ?? ""}
            />
            <OfficialSheetField
              label="Speed"
              value={defenses?.speed ? `${defenses.speed} ft` : ""}
            />
            <OfficialSheetField label="Languages" value={formatList(build.languages)} />
            <OfficialSheetField label="Senses" value={defenses?.senses ?? ""} />
            <OfficialSheetField label="XP" value="0 / 1000" />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-3">
              <div className="rounded-md border-2 border-slate-950">
                <div className="bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Ability Scores
                </div>
                <div className="grid grid-cols-3 gap-px bg-slate-950 md:grid-cols-6">
                  {(["str", "dex", "con", "int", "wis", "cha"] as const).map((key) => (
                    <div key={key} className="bg-white p-2 text-center">
                      <div className="text-xs font-black uppercase">{key}</div>
                      <div className="text-2xl font-black">{abs[key]}</div>
                      <div className="text-sm font-bold">{abilityModStr(abs[key])}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border-2 border-slate-950">
                <div className="bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Defense
                </div>
                <div className="grid grid-cols-2 gap-2 p-2 md:grid-cols-4">
                  <OfficialSheetField label="AC" value={defenses?.ac} />
                  <OfficialSheetField label="Max HP" value={maxHp ?? ""} />
                  <OfficialSheetField label="Current HP" value={currentHp ?? maxHp ?? ""} />
                  <OfficialSheetField label="Temp HP" value="" />
                  <OfficialSheetField label="Armor" value={defenses?.armor ?? ""} />
                  <OfficialSheetField label="Shield" value={defenses?.shield ?? ""} />
                  <OfficialSheetField label="Class DC" value={defenses?.classDc ?? ""} />
                  <OfficialSheetField label="Spell DC" value={defenses?.spellDc ?? ""} />
                  <OfficialSheetField label="Immunities" value={defenses?.immunities ?? ""} tall />
                  <OfficialSheetField
                    label="Resistances"
                    value={defenses?.resistances ?? ""}
                    tall
                  />
                  <OfficialSheetField label="Weaknesses" value={defenses?.weaknesses ?? ""} tall />
                </div>
              </div>

              <div className="rounded-md border-2 border-slate-950">
                <div className="bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Perception & Saving Throws
                </div>
                <div className="divide-y divide-slate-300">
                  <div className="grid grid-cols-[1fr_80px_80px] items-center gap-2 px-3 py-2">
                    <span className="font-semibold">Perception</span>
                    <span>
                      {rankLabel(proficiencyValueToRank(profs.perception ?? 0, usesRawBonus))}
                    </span>
                    <span className="text-right font-mono font-black">
                      {signedTotal(
                        normalizedProfBonus(profs.perception ?? 0, level, usesRawBonus) +
                          abilityModNum(abs.wis)
                      )}
                    </span>
                  </div>
                  {saves.map((save) => (
                    <div
                      key={save.key}
                      className="grid grid-cols-[1fr_80px_80px] items-center gap-2 px-3 py-2"
                    >
                      <span className="font-semibold">{save.label}</span>
                      <span>
                        {rankLabel(proficiencyValueToRank(profs[save.key] ?? 0, usesRawBonus))}
                      </span>
                      <span className="text-right font-mono font-black">
                        {signedTotal(
                          normalizedProfBonus(profs[save.key] ?? 0, level, usesRawBonus) +
                            abilityModNum(abs[save.ability])
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-md border-2 border-slate-950">
                <div className="bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Skills
                </div>
                <div className="grid grid-cols-1 gap-x-4 p-2 md:grid-cols-2">
                  {SKILL_ORDER.map((skill) => {
                    const rank = profs[skill] ?? 0;
                    const ability = SKILL_ABILITY_MAP[skill];
                    const total =
                      normalizedProfBonus(rank, level, usesRawBonus) + abilityModNum(abs[ability]);
                    return (
                      <div
                        key={skill}
                        className="grid grid-cols-[1fr_26px_42px] items-center gap-2 border-b border-slate-200 py-1 text-sm"
                      >
                        <span className="capitalize">{skill}</span>
                        <span className="text-xs font-bold uppercase">
                          {rankLabel(proficiencyValueToRank(rank, usesRawBonus)).slice(0, 1)}
                        </span>
                        <span className="text-right font-mono font-bold">{signedTotal(total)}</span>
                      </div>
                    );
                  })}
                  {loreSkills.map((lore) => (
                    <div
                      key={lore.skill}
                      className="grid grid-cols-[1fr_26px_42px] items-center gap-2 border-b border-slate-200 py-1 text-sm"
                    >
                      <span>{lore.skill}</span>
                      <span className="text-xs font-bold uppercase">
                        {rankLabel(lore.rank).slice(0, 1)}
                      </span>
                      <span className="text-right font-mono font-bold">
                        {signedTotal(lore.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border-2 border-slate-950">
                <div className="bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Attacks
                </div>
                <div className="divide-y divide-slate-300">
                  {attacks.length ? (
                    attacks.map((attack, index) => (
                      <div
                        key={`${attack.name}-${index}`}
                        className="grid grid-cols-[1fr_72px] gap-2 p-2"
                      >
                        <div>
                          <div className="font-bold">{attack.name}</div>
                          <div className="text-xs text-slate-700">
                            {[attack.damage, formatAttackTraits(attack.traits), attack.range]
                              .filter(Boolean)
                              .join(" • ")}
                          </div>
                        </div>
                        <div className="text-right font-mono text-lg font-black">
                          {formatAttackBonus(attack.bonus)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-slate-500">No attacks saved.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3 pt-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-md border-2 border-slate-950">
              <div className="bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Feats & Features
              </div>
              <div className="grid grid-cols-1 gap-px bg-slate-200 p-2">
                {featNames.length ? (
                  featNames.map((feat) => (
                    <div key={feat.key} className="bg-white px-2 py-1 text-sm">
                      <span className="font-bold">{feat.name}</span>
                      <span className="text-slate-600">
                        {" "}
                        {feat.type}
                        {feat.level ? ` ${feat.level}` : ""}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="bg-white px-2 py-2 text-sm text-slate-500">No feats saved.</div>
                )}
                {(build.specials ?? []).map((special) => (
                  <div key={special} className="bg-white px-2 py-1 text-sm">
                    <span className="font-bold">{special}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border-2 border-slate-950">
              <div className="bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Spells
              </div>
              <div className="space-y-2 p-2">
                {Object.keys(spellsByRank).length ? (
                  Object.entries(spellsByRank).map(([rankName, rankSpells]) => (
                    <div key={rankName}>
                      <div className="mb-1 text-xs font-black uppercase text-slate-600">
                        {rankName}
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {rankSpells.map((spell) => (
                          <div
                            key={spell.id}
                            className="rounded border border-slate-300 px-2 py-1 text-sm"
                          >
                            <span className="font-bold">
                              {spell.spell?.name ?? "Unknown Spell"}
                            </span>
                            <span className="text-slate-600"> • {spell.spell_source}</span>
                            {spell.is_signature && (
                              <span className="text-slate-600"> • signature</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No spells saved.</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-md border-2 border-slate-950">
              <div className="bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Equipment
              </div>
              <div className="grid grid-cols-1 gap-px bg-slate-200 p-2 md:grid-cols-2">
                {equipment.length ? (
                  equipment.map((item) => (
                    <div key={`${item.name}-${item.qty}`} className="bg-white px-2 py-1 text-sm">
                      <span className="font-bold">{item.name}</span>
                      <span className="text-slate-600"> x{item.qty}</span>
                    </div>
                  ))
                ) : (
                  <div className="bg-white px-2 py-2 text-sm text-slate-500">
                    No equipment saved.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-md border-2 border-slate-950">
              <div className="bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Notes & Description
              </div>
              <div className="grid gap-2 p-2">
                <OfficialSheetField
                  label="Description"
                  value={getNestedString(build, [["description"], ["stats", "description"]]) ?? ""}
                  tall
                />
                <OfficialSheetField
                  label="Personality"
                  value={getNestedString(build, [["personality"], ["stats", "personality"]]) ?? ""}
                  tall
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// onSelect receives a feat name — parent opens the detail modal
function FeatsTabPanel({
  characterId,
  build,
  onSelect,
  onSaveFeats,
  onSaveSpecials,
  isSaving,
}: {
  characterId: string;
  build: PBBuild;
  onSelect: (name: string) => void;
  onSaveFeats: (feats: Array<[string, string | null, string | null, string | null]>) => void;
  onSaveSpecials: (specials: string[]) => void;
  isSaving: boolean;
}) {
  const { data: characterFeatRows, isLoading: featsLoading } = useCharacterFeats(characterId);
  const feats = build.feats ?? [];
  const specials = build.specials ?? [];
  const [featName, setFeatName] = useState("");
  const [featType, setFeatType] = useState("Ancestry");
  const [featLevel, setFeatLevel] = useState(String(build.level ?? 1));
  const [specialText, setSpecialText] = useState("");

  const tableFeats: DisplayFeat[] = (characterFeatRows?.data ?? [])
    .filter((row) => row.feat)
    .map((row) => ({
      key: row.id,
      name: row.feat.name,
      type: displayFeatType(row.feat.feat_type, row.feat_slot),
      level: row.level_acquired ?? row.feat.level ?? null,
      source: row.feat.source ?? null,
      description: row.feat.description ?? row.notes ?? null,
      rowId: row.id,
    }));
  const buildFeats = feats.map(normalizeBuildFeat).filter((feat) => feat.name.trim());
  const displayFeats = dedupeDisplayFeats([...tableFeats, ...buildFeats]);
  const grouped = displayFeats.reduce<Record<string, DisplayFeat[]>>((acc, feat) => {
    (acc[feat.type] ??= []).push(feat);
    return acc;
  }, {});
  const groupedKeys = [
    ...FEAT_GROUP_ORDER,
    ...Object.keys(grouped).filter((type) => !FEAT_GROUP_ORDER.includes(type)),
  ];
  const normalizedBuildFeats = buildFeats.map(
    (feat): [string, string | null, string | null, string | null] => [
      feat.name,
      null,
      feat.type,
      feat.level ? `Level ${feat.level}` : null,
    ]
  );

  function addFeat() {
    const name = featName.trim();
    if (!name) return;
    onSaveFeats([
      ...normalizedBuildFeats,
      [name, null, featType, featLevel ? `Level ${featLevel}` : null],
    ]);
    setFeatName("");
    setFeatType("Ancestry");
    setFeatLevel(String(build.level ?? 1));
  }

  function removeBuildFeat(featNameToRemove: string) {
    onSaveFeats(normalizedBuildFeats.filter(([name]) => name !== featNameToRemove));
  }

  function addSpecial() {
    const special = specialText.trim();
    if (!special) return;
    onSaveSpecials([...specials, special]);
    setSpecialText("");
  }

  function removeSpecial(index: number) {
    onSaveSpecials(specials.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Click a feat to see its description and details. Builder-selected feats are grouped by type.
      </p>

      <div className="card p-4 bg-muted/20 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Add Feat
        </h4>
        <div className="grid grid-cols-[1fr_150px_100px_auto] gap-2">
          <input
            className="input text-sm"
            value={featName}
            onChange={(e) => setFeatName(e.target.value)}
            placeholder="e.g. Stormmarked Cantrip"
          />
          <select
            className="input text-sm"
            value={featType}
            onChange={(e) => setFeatType(e.target.value)}
          >
            {["Ancestry", "Class", "General (Skill)", "General", "Archetype", "Other"].map(
              (type) => (
                <option key={type}>{type}</option>
              )
            )}
          </select>
          <input
            className="input text-sm"
            type="text"
            inputMode="numeric"
            pattern="[0-9+-]*"
            min={1}
            value={featLevel}
            onChange={(e) => setFeatLevel(e.target.value)}
            aria-label="Feat level"
          />
          <button
            type="button"
            onClick={addFeat}
            disabled={isSaving || !featName.trim()}
            className="btn-outline text-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      {featsLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="spinner" />
          Loading saved feats...
        </div>
      )}

      {!featsLoading && displayFeats.length === 0 && (
        <div className="text-center py-8">
          <BookOpen size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No feats saved yet.</p>
        </div>
      )}

      {groupedKeys.map((type) => {
        const list = grouped[type];
        if (!list || list.length === 0) return null;
        return (
          <div key={type}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {type} Feats
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {list.map((feat) => (
                <li key={feat.key} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSelect(feat.name)}
                    className="flex-1 text-left text-sm py-1.5 px-3 bg-muted/40 rounded-md hover:bg-muted/70 hover:text-primary transition-colors"
                  >
                    <span className="font-medium">{feat.name}</span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">
                      {feat.level ? `Level ${feat.level}` : "Level unknown"}
                      {feat.source ? ` - ${feat.source}` : ""}
                    </span>
                  </button>
                  {!feat.rowId && (
                    <button
                      type="button"
                      onClick={() => removeBuildFeat(feat.name)}
                      disabled={isSaving}
                      className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      title="Remove custom feat"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Special Abilities
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Add or remove custom abilities, features, and granted powers.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_auto] gap-2 items-start">
            <textarea
              className="input text-sm min-h-[74px] resize-y"
              value={specialText}
              onChange={(e) => setSpecialText(e.target.value)}
              placeholder="e.g. Storm Sigil: You can feel shifts in nearby weather and elemental pressure."
            />
            <button
              type="button"
              onClick={addSpecial}
              disabled={isSaving || !specialText.trim()}
              className="btn-outline text-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>

        {specials.length > 0 && (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {specials.map((s, i) => (
              <li
                key={i}
                className="text-sm py-1.5 px-3 bg-muted/40 rounded-md flex items-start gap-3"
              >
                <span className="flex-1">{s}</span>
                <button
                  type="button"
                  onClick={() => removeSpecial(i)}
                  disabled={isSaving}
                  className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 mt-0.5"
                  title="Remove ability"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// onSelect receives an item name — parent opens the detail modal
function SpellsTabPanel({ characterId }: { characterId: string }) {
  const { data: knownSpells, isLoading } = useCharacterKnownSpells(characterId);
  const addKnownSpell = useAddKnownSpell(characterId);
  const removeKnownSpell = useRemoveKnownSpell(characterId);
  const [tradition, setTradition] = useState("arcane");
  const [rank, setRank] = useState(0);
  const [spellSource, setSpellSource] = useState("repertoire");
  const [query, setQuery] = useState("");
  const [signature, setSignature] = useState(false);
  const [notes, setNotes] = useState("");
  const isFocusMode = spellSource === "focus";
  const effectiveTradition = isFocusMode ? "arcane" : tradition;

  const { data: spellResults, isFetching } = useSpells({
    q: query.trim(),
    tradition: isFocusMode ? undefined : tradition,
    level: rank,
    is_focus: isFocusMode ? true : undefined,
    limit: 15,
  });

  const rows = knownSpells?.data ?? [];
  const grouped = rows.reduce<Record<string, CharacterKnownSpell[]>>((acc, row) => {
    const key = `${row.spell_source} - ${spellRankLabel(row.rank)}`;
    (acc[key] ??= []).push(row);
    return acc;
  }, {});

  async function addSpell(spellId: string) {
    await addKnownSpell.mutateAsync({
      spell_id: spellId,
      tradition: effectiveTradition,
      rank,
      spell_source: spellSource,
      is_signature: signature,
      notes: notes.trim() || null,
    });
    setNotes("");
  }

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Known & Prepared Spells
        </h4>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="spinner" />
            Loading spells...
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No spells saved yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([group, list]) => (
                <div key={group}>
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 capitalize">
                    {group}
                  </h5>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {list
                      .slice()
                      .sort((a, b) => a.spell.name.localeCompare(b.spell.name))
                      .map((row) => (
                        <li
                          key={row.id}
                          className="bg-muted/40 rounded-md p-3 flex items-start gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium">{row.spell.name}</p>
                              {row.is_signature && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                                  Signature
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                              {row.spell_source === "focus" ? "focus" : row.tradition} - {spellRankLabel(row.rank)}
                              {row.spell.source ? ` - ${row.spell.source}` : ""}
                            </p>
                            {row.notes && (
                              <p className="text-xs text-muted-foreground/80 mt-1">{row.notes}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeKnownSpell.mutate(row.id)}
                            disabled={removeKnownSpell.isPending}
                            className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                            title="Remove spell"
                          >
                            <Trash2 size={14} />
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="card p-4 bg-muted/20 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Add Spell
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-[140px_120px_150px_1fr] gap-2">
          {isFocusMode ? (
            <div className="input text-sm flex items-center text-muted-foreground">Focus spell</div>
          ) : (
            <select
              className="input text-sm capitalize"
              value={tradition}
              onChange={(e) => setTradition(e.target.value)}
            >
              {["arcane", "divine", "occult", "primal"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          )}
          <select
            className="input text-sm"
            value={rank}
            onChange={(e) => setRank(Number(e.target.value))}
          >
            {Array.from({ length: 11 }).map((_, value) => (
              <option key={value} value={value}>
                {spellRankLabel(value)}
              </option>
            ))}
          </select>
          <select
            className="input text-sm capitalize"
            value={spellSource}
            onChange={(e) => setSpellSource(e.target.value)}
          >
            {["repertoire", "spellbook", "innate", "focus", "staff", "scroll"].map((value) => (
              <option key={value} value={value}>
                {value.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <input
            className="input text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search spells..."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-2 items-center">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={signature}
              onChange={(e) => setSignature(e.target.checked)}
            />
            Signature spell
          </label>
          <input
            className="input text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes, prepared day, source details..."
          />
        </div>

        {addKnownSpell.error && (
          <p className="text-xs text-destructive">{addKnownSpell.error.message}</p>
        )}

        <div className="border border-border rounded-lg overflow-hidden">
          {isFetching && (
            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
              <div className="spinner" />
              Searching...
            </div>
          )}
          {!isFetching && (spellResults?.data ?? []).length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">
              No spells found for this {isFocusMode ? "focus category" : "tradition"} and rank.
            </p>
          )}
          {(spellResults?.data ?? []).map((spell) => {
            const alreadyKnown = rows.some(
              (row) =>
                row.spell_id === spell.id &&
                (row.tradition === effectiveTradition || (isFocusMode && row.spell_source === "focus")) &&
                row.rank === rank &&
                row.spell_source === spellSource
            );
            return (
              <div
                key={spell.id}
                className="flex items-center justify-between gap-3 p-3 border-b border-border last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{spell.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {spellRankLabel(spell.level)} - {spell.source}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addSpell(spell.id)}
                  disabled={addKnownSpell.isPending || alreadyKnown}
                  className="btn-outline btn-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus size={14} />
                  {alreadyKnown ? "Added" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GearTabPanel({ build, onSelect }: { build: PBBuild; onSelect: (name: string) => void }) {
  const { data: bag, isLoading, error } = useBag();
  const removeMutation = useRemoveItem();
  const [showAddForm, setShowAddForm] = useState(false);

  const categories = (bag?.categories ?? {}) as BagCategories;
  const categoryNames = Object.keys(categories).sort();
  const bagItemNames = new Set(
    categoryNames
      .flatMap((cat) => categories[cat] ?? [])
      .map((item) => item.name.trim().toLocaleLowerCase())
  );
  const sheetEquipment = getEquipmentEntries(build).filter(
    (item) => !bagItemNames.has(item.name.trim().toLocaleLowerCase())
  );
  const hasInventory = categoryNames.length > 0 || sheetEquipment.length > 0;

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-8">
        <div className="spinner" />
      </div>
    );
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {bag?.bag_name ?? (bag ? "Inventory" : "No inventory yet")}
          {hasInventory
            ? ` - ${categoryNames.length + (sheetEquipment.length ? 1 : 0)} sections`
            : ""}
        </p>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="btn btn-primary btn-sm flex items-center gap-1.5"
        >
          <Plus size={14} />
          Add Item
        </button>
      </div>

      {showAddForm && (
        <AddItemForm existingCategories={categoryNames} onClose={() => setShowAddForm(false)} />
      )}

      {!bag && !showAddForm && (
        <div className="text-center py-8">
          <Inbox size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No inventory found. Add your first item above, or use{" "}
            <code className="bg-muted px-1 rounded">/bag add</code> in Discord.
          </p>
        </div>
      )}

      {bag && !hasInventory && !showAddForm && (
        <div className="text-center py-8">
          <Package size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Inventory is empty. Add items above or use{" "}
            <code className="bg-muted px-1 rounded">/bag add</code> in Discord.
          </p>
        </div>
      )}

      {hasInventory && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryNames.map((cat) => (
            <div key={cat} className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {cat}
              </h4>
              <ul className="space-y-1">
                {(categories[cat] ?? []).map((item: BagItem, i: number) => (
                  <li key={i} className="flex items-center justify-between text-sm group py-0.5">
                    <span className="flex-1 min-w-0 truncate">{item.name}</span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {/* Editable quantity — click to edit, blur/Enter saves */}
                      <EditableQty item={item} category={cat} />
                      <button
                        type="button"
                        onClick={() =>
                          removeMutation.mutate({ category: cat, itemName: item.name })
                        }
                        disabled={removeMutation.isPending}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity disabled:opacity-30"
                        title="Remove item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {sheetEquipment.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Character Equipment
                <span className="ml-1.5 font-normal normal-case text-muted-foreground/60">
                  (from sheet)
                </span>
              </h4>
              <ul className="space-y-1">
                {sheetEquipment.map((item, i) => (
                  <li
                    key={`${item.name}-${i}`}
                    className="flex items-center justify-between text-sm py-0.5"
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(item.name)}
                      className="flex-1 min-w-0 truncate text-left hover:text-primary transition-colors"
                    >
                      {item.name}
                    </button>
                    {item.qty > 1 && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground shrink-0 ml-2">
                        &times;{item.qty}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotesTabPanel({
  characterId,
  notesRecord,
}: {
  characterId: string;
  notesRecord: { notes: unknown } | null | undefined;
}) {
  const [showAddNote, setShowAddNote] = useState(false);
  const deleteNote = useDeleteNote(characterId);
  const notes = notesRecord ? (notesRecord.notes as unknown as BotNote[]) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </p>
        {!showAddNote && (
          <button
            type="button"
            onClick={() => setShowAddNote(true)}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <Plus size={14} /> Add Note
          </button>
        )}
      </div>

      {showAddNote && (
        <AddNoteForm characterId={characterId} onClose={() => setShowAddNote(false)} />
      )}

      {notes.length === 0 && !showAddNote && (
        <div className="text-center py-8">
          <BookOpen size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No session notes yet.</p>
        </div>
      )}

      {NOTE_CATEGORY_ORDER.map((catKey) => {
        const cat = NOTE_CATEGORIES[catKey];
        const inCat = notes
          .filter((n) => n.category === catKey)
          .sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return b.createdAt.localeCompare(a.createdAt);
          });
        if (inCat.length === 0) return null;
        return (
          <div key={catKey}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {cat.icon} {cat.label}
            </h4>
            <ul className="space-y-2">
              {inCat.map((note) => (
                <li key={note.id} className="text-sm bg-muted/40 rounded-lg p-3 space-y-1 group">
                  <div className="flex items-start justify-between gap-2">
                    <p className="leading-snug flex-1">{note.text}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {note.pinned && <span className="text-xs">📌</span>}
                      <button
                        type="button"
                        onClick={() => deleteNote.mutate({ noteId: note.id })}
                        disabled={deleteNote.isPending}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity disabled:opacity-30"
                        title="Delete note"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {note.authorName} · {new Date(note.createdAt).toLocaleDateString()}
                    {note.editedAt ? " (edited)" : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function DowntimeTabPanel({
  characterId,
  downtime,
}: {
  characterId: string;
  downtime: { bank: number; log: unknown } | null | undefined;
}) {
  const [showForm, setShowForm] = useState(false);

  if (!downtime) {
    return (
      <div className="text-center py-8">
        <CalendarDays size={32} className="mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          No downtime tracked yet. Use <code className="bg-muted px-1 rounded">/downtime</code> in
          Discord to start.
        </p>
      </div>
    );
  }

  const log = (downtime.log as unknown as DowntimeLogEntry[]).slice().reverse();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums">{downtime.bank}</span>
          <span className="text-sm text-muted-foreground">days available</span>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <Plus size={14} /> Manage
          </button>
        )}
      </div>

      {showForm && (
        <SpendDowntimeForm
          characterId={characterId}
          currentBank={downtime.bank}
          onClose={() => setShowForm(false)}
        />
      )}

      {log.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Activity Log
          </h4>
          <ul className="space-y-0.5">
            {log.map((entry, i) => (
              <li
                key={i}
                className="flex items-center justify-between text-xs py-1.5 px-3 rounded-md hover:bg-muted/40 transition-colors"
              >
                <span className="text-muted-foreground">
                  {entry.date}
                  {entry.reason ? ` · ${entry.reason}` : ""}
                </span>
                <span
                  className={`font-mono font-semibold shrink-0 ml-3 ${entry.delta > 0 ? "text-green-400" : "text-orange-400"}`}
                >
                  {entry.delta > 0 ? "+" : ""}
                  {entry.delta}d
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const characterId = params.id as string;

  const {
    data: character,
    isLoading,
    error,
  } = useCharacterLive(characterId, {
    enabled: !!characterId && !!user && !authLoading,
  });
  const syncMutation = useSyncCharacter();
  const shareMutation = useShareCharacter(characterId);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("stats");

  // Modal state: null = closed, otherwise { type, name }
  const [modal, setModal] = useState<{ type: ContentType; name: string } | null>(null);

  const charKey = character ? (character as unknown as { char_key: string | null }).char_key : null;
  const { data: downtime } = useCharacterDowntime(charKey);
  const { data: notesRecord } = useCharacterNotes(charKey);
  const { companions, companionRows } = useCompanions(characterId, charKey, {
    enabled: !!characterId && !!user,
  });

  const updateCharacter = useUpdateCharacter(characterId);
  const updateCompanion = useUpdateCompanion(characterId);

  useEffect(() => {
    if (!authLoading && !isLoading && (error || !character)) {
      router.replace(`/share/characters/${characterId}`);
    }
  }, [authLoading, character, characterId, error, isLoading, router]);

  if (authLoading || isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      </MainLayout>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="card p-6 bg-destructive/10 border-destructive">
          <p className="text-destructive font-semibold">Opening public character view...</p>
          <p className="text-sm text-muted-foreground mt-1">
            If this character has sharing enabled, Pathway will open the read-only sheet.
          </p>
        </div>
      </div>
    );
  }

  const pb = character.pathbuilder_data as { build?: PBBuild } | PBBuild | null;
  const build = pb ? ((pb as { build?: PBBuild }).build ?? (pb as PBBuild)) : null;
  const abs = build?.abilities;

  const currentHp = (character as unknown as { current_hp: number | null }).current_hp;
  const overlay = (character as unknown as { overlay: CharacterOverlay }).overlay ?? {};
  const daily = overlay.daily;
  const hasLiveHp = currentHp !== null && currentHp !== undefined;

  const level = character.level ?? build?.level ?? 1;
  const maxHp = build ? deriveMaxHp(build, level) : null;
  const dying = character.dying ?? 0;
  const wounded = character.wounded ?? 0;

  const heroPoints = daily?.hero_points ?? character.hero_points ?? 1;
  const focusSpent = daily?.focus_spent ?? 0;
  const focusMax = (build?.spellCasters ?? []).reduce(
    (sum, c) => sum + ((c as unknown as { focusPoints?: number }).focusPoints ?? 0),
    0
  );

  const profs = build?.proficiencies ?? {};
  const usesRawBonus = build
    ? usesPf2eProficiencyBonus(
        build,
        profs,
        character.source === "pathbuilder" ||
          Boolean((character as unknown as { pathbuilder_id: number | null }).pathbuilder_id)
      )
    : false;
  const defenses = build ? getDefenseDetails(build, level, usesRawBonus) : null;
  // Companions come from the dedicated `companions` table via useCompanions()
  const hasCompanions = companions.length > 0;

  type TabDef = { key: TabKey; label: string };
  const tabs: TabDef[] = [
    { key: "stats", label: "Stats" },
    { key: "feats", label: "Feats" },
    { key: "spells", label: "Spells" },
    { key: "gear", label: "Gear" },
    { key: "notes", label: "Notes" },
    { key: "downtime", label: "Downtime" },
    { key: "official", label: "Official Sheet" },
    ...(hasCompanions ? [{ key: "companions" as TabKey, label: "Companions" }] : []),
  ];

  return (
    <MainLayout>
      {/* Detail modal — rendered outside main flow so it overlays everything */}
      {modal && <ContentModal type={modal.type} name={modal.name} onClose={() => setModal(null)} />}

      <div className="mb-4">
        <Link
          href="/characters"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to Characters
        </Link>
      </div>

      <div className="space-y-4">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl font-bold leading-tight">{character.name}</h1>
              <p className="text-muted-foreground mt-0.5">
                Level {level} ·{" "}
                {[character.ancestry_name, character.heritage_name, character.class_name]
                  .filter(Boolean)
                  .join(" ")}
              </p>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                Pathway JSON ID: {character.id}
              </p>
              {character.background_name && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {character.background_name} background
                </p>
              )}
              {build?.languages && build.languages.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1 opacity-70">
                  {build.languages.join(" · ")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              <Link
                href={`/characters?edit=${character.id}`}
                className="btn-outline flex items-center gap-2 text-sm"
              >
                Edit Full Sheet
              </Link>
              <button
                type="button"
                onClick={async () => {
                  setShareMessage(null);
                  try {
                    const result = await shareMutation.mutateAsync({ enabled: true });
                    await navigator.clipboard?.writeText(result.share_url);
                    setShareMessage("Public link copied.");
                    window.setTimeout(() => setShareMessage(null), 3500);
                  } catch (err) {
                    setShareMessage(err instanceof Error ? err.message : "Could not create link.");
                  }
                }}
                disabled={shareMutation.isPending}
                className="btn-outline flex items-center gap-2 text-sm disabled:opacity-60"
                title="Create and copy a public read-only link"
              >
                {shareMutation.isPending ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : shareMessage === "Public link copied." ? (
                  <Check size={14} />
                ) : (
                  <Share2 size={14} />
                )}
                Share
              </button>
              {(character as unknown as { pathbuilder_id: number | null }).pathbuilder_id && (
                <button
                  onClick={async () => {
                    setSyncError(null);
                    try {
                      await syncMutation.mutateAsync(characterId);
                    } catch (err) {
                      setSyncError(err instanceof Error ? err.message : "Sync failed");
                    }
                  }}
                  disabled={syncMutation.isPending}
                  className="btn-outline flex items-center gap-2 text-sm"
                  title="Re-fetch latest data from Pathbuilder"
                >
                  <RefreshCw size={14} className={syncMutation.isPending ? "animate-spin" : ""} />
                  {syncMutation.isPending ? "Syncing…" : "Sync"}
                </button>
              )}
              <span
                className={`text-sm px-3 py-1 rounded-full ${
                  character.status === "active"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {character.status}
              </span>
            </div>
          </div>
          {syncMutation.isSuccess && (
            <p className="text-xs text-green-400 mt-2">Sheet refreshed from Pathbuilder.</p>
          )}
          {syncError && <p className="text-xs text-destructive mt-2">{syncError}</p>}
          {shareMessage && (
            <p
              className={`mt-2 text-xs ${
                shareMessage === "Public link copied." ? "text-green-400" : "text-destructive"
              }`}
            >
              {shareMessage}
            </p>
          )}
        </div>

        {/* ── Core Stats ─────────────────────────────────────────────────── */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Core Stats
            </h2>
            {hasLiveHp && <LiveBadge />}
          </div>

          {hasLiveHp && maxHp ? (
            <div className="space-y-2">
              <HealthBar currentHp={currentHp!} maxHp={maxHp} size="lg" />
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-muted-foreground">Adjust HP</span>
                <NumberStepper
                  value={currentHp!}
                  min={0}
                  max={maxHp}
                  onCommit={(v) => updateCharacter.mutate({ current_hp: v })}
                  isPending={updateCharacter.isPending}
                />
              </div>
            </div>
          ) : maxHp ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-muted-foreground/20 rounded-full w-full" />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">Max {maxHp} HP</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Set HP</span>
                <NumberStepper
                  value={0}
                  min={0}
                  max={maxHp}
                  onCommit={(v) => updateCharacter.mutate({ current_hp: v })}
                  isPending={updateCharacter.isPending}
                />
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic flex items-center gap-1.5">
              <Zap size={12} className="opacity-40" />
              HP will appear once the bot syncs this character.
            </div>
          )}

          {(dying > 0 || wounded > 0) && (
            <div className="flex gap-3 flex-wrap">
              {dying > 0 && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-destructive bg-destructive/10 px-3 py-1 rounded-full">
                  <Heart size={14} /> Dying {dying}
                </span>
              )}
              {wounded > 0 && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full">
                  <Flame size={14} /> Wounded {wounded}
                </span>
              )}
            </div>
          )}

          {abs && (
            <div className="grid grid-cols-4 gap-2">
              <SaveBox
                label="Perception"
                rank={profs.perception ?? 0}
                abilityScore={abs.wis}
                level={level}
                usesRawBonus={usesRawBonus}
              />
              {(["fortitude", "reflex", "will"] as const).map((save) => (
                <SaveBox
                  key={save}
                  label={SAVE_LABELS[save]}
                  rank={profs[save] ?? 0}
                  abilityScore={abs[SAVE_ABILITY[save]] ?? 10}
                  level={level}
                  usesRawBonus={usesRawBonus}
                />
              ))}
            </div>
          )}

          {defenses &&
            (defenses.ac ||
              defenses.speed ||
              defenses.armor ||
              defenses.shield ||
              defenses.senses ||
              defenses.classDc ||
              defenses.spellDc ||
              defenses.immunities ||
              defenses.resistances ||
              defenses.weaknesses) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-border">
                <MiniDetail label="AC" value={defenses.ac} />
                {defenses.speed && (
                  <MiniDetail
                    label="Speed"
                    value={`${defenses.speed} ft${defenses.size ? ` · ${defenses.size}` : ""}`}
                  />
                )}
                {defenses.armor && <MiniDetail label="Armor" value={defenses.armor} />}
                {defenses.shield && <MiniDetail label="Shield" value={defenses.shield} />}
                {defenses.senses && <MiniDetail label="Senses" value={defenses.senses} />}
                {defenses.classDc && <MiniDetail label="Class DC" value={defenses.classDc} />}
                {defenses.spellDc && <MiniDetail label="Spell DC" value={defenses.spellDc} />}
                {defenses.immunities && (
                  <MiniDetail label="Immunities" value={defenses.immunities} />
                )}
                {defenses.resistances && (
                  <MiniDetail label="Resistances" value={defenses.resistances} />
                )}
                {defenses.weaknesses && (
                  <MiniDetail label="Weaknesses" value={defenses.weaknesses} />
                )}
              </div>
            )}

          <div className="space-y-2">
            {/* Hero points — each pip is a button to set the value */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-24 shrink-0">Hero Points</span>
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      updateCharacter.mutate({ hero_points: i < heroPoints ? i : i + 1 })
                    }
                    disabled={updateCharacter.isPending}
                    title={`Set hero points to ${i < heroPoints ? i : i + 1}`}
                    className={`w-4 h-4 rounded-full border-2 transition-all hover:scale-110 disabled:cursor-not-allowed ${
                      i < heroPoints
                        ? "bg-yellow-400 border-transparent hover:bg-yellow-300"
                        : "border-muted-foreground/30 bg-transparent hover:border-yellow-400/50"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">{heroPoints}/3</span>
            </div>
            {focusMax > 0 && (
              <PipRow
                count={Math.max(0, focusMax - focusSpent)}
                max={focusMax}
                color="bg-blue-400"
                label="Focus Pool"
              />
            )}
          </div>

          {daily?.slots_used && Object.keys(daily.slots_used).length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Spell Slots — Today
              </p>
              {Object.entries(daily.slots_used).map(([caster, ranks]) => (
                <div key={caster}>
                  <p className="text-xs text-muted-foreground mb-1">{caster}</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ranks).map(([rank, used]) =>
                      used > 0 ? (
                        <span key={rank} className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                          Rank {rank}: {used} used
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Ability Scores ──────────────────────────────────────────────── */}
        {abs && (
          <div className="grid grid-cols-6 gap-2">
            <AbilityBlock label="STR" score={abs.str} />
            <AbilityBlock label="DEX" score={abs.dex} />
            <AbilityBlock label="CON" score={abs.con} />
            <AbilityBlock label="INT" score={abs.int} />
            <AbilityBlock label="WIS" score={abs.wis} />
            <AbilityBlock label="CHA" score={abs.cha} />
          </div>
        )}

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="flex border-b border-border overflow-x-auto">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {label}
                {key === "notes" && notesRecord && (
                  <span className="ml-1.5 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-normal">
                    {(notesRecord.notes as unknown as BotNote[]).length}
                  </span>
                )}
                {key === "downtime" && downtime && (
                  <span className="ml-1.5 text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-normal">
                    {downtime.bank}d
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-5">
            {tab === "stats" &&
              (build ? (
                <StatsTabPanel
                  build={build}
                  level={level}
                  usesRawBonus={usesRawBonus}
                  isSaving={updateCharacter.isPending}
                  onSaveLevel={(nextLevel) =>
                    updateCharacter.mutate({
                      level: nextLevel,
                      build_patch: { level: nextLevel },
                    })
                  }
                  onSaveAbilities={(abilities) =>
                    updateCharacter.mutate({ build_patch: { abilities } })
                  }
                  onSaveExtras={(extras) => updateCharacter.mutate({ build_patch: { extras } })}
                  onSaveProficiencies={(proficiencies) =>
                    updateCharacter.mutate({ build_patch: { proficiencies } })
                  }
                  onSaveCustomAttacks={(custom_attacks) =>
                    updateCharacter.mutate({ build_patch: { custom_attacks } })
                  }
                />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No Pathbuilder data available.
                </p>
              ))}
            {tab === "official" &&
              (build ? (
                <OfficialSheetPanel
                  characterId={characterId}
                  character={character}
                  build={build}
                  level={level}
                  maxHp={maxHp}
                  currentHp={currentHp}
                  usesRawBonus={usesRawBonus}
                  defenses={defenses}
                />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No Pathbuilder data available.
                </p>
              ))}
            {tab === "feats" &&
              (build ? (
                <FeatsTabPanel
                  characterId={characterId}
                  build={build}
                  isSaving={updateCharacter.isPending}
                  onSaveFeats={(feats) => updateCharacter.mutate({ build_patch: { feats } })}
                  onSaveSpecials={(specials) =>
                    updateCharacter.mutate({ build_patch: { specials } })
                  }
                  onSelect={(name) => setModal({ type: "feat", name })}
                />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No Pathbuilder data available.
                </p>
              ))}
            {tab === "spells" && <SpellsTabPanel characterId={characterId} />}
            {tab === "gear" &&
              (build ? (
                <GearTabPanel build={build} onSelect={(name) => setModal({ type: "item", name })} />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No Pathbuilder data available.
                </p>
              ))}
            {tab === "notes" && (
              <NotesTabPanel characterId={characterId} notesRecord={notesRecord} />
            )}
            {tab === "downtime" && (
              <DowntimeTabPanel characterId={characterId} downtime={downtime} />
            )}
            {tab === "companions" && hasCompanions && (
              <div className="space-y-3">
                {companions.map((comp, i) => (
                  <CompanionCard
                    key={companionRows[i]?.comp_key ?? i}
                    comp={comp}
                    compId={companionRows[i]?.id ?? ""}
                    charLevel={level}
                    updateMutation={updateCompanion}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
