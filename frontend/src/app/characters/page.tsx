"use client";

import { MainLayout } from "@/components/layout";
import { ItemSearchCombobox } from "@/components/ui/ItemSearchCombobox";
import {
  useCharacterImages,
  useCharacters,
  useDeleteCharacter,
  useDeleteCharacterImage,
  useUpdateCharacter,
  useUploadCharacterImage,
} from "@/lib/hooks/use-characters";
import { useAuth } from "@/lib/providers/auth-provider";
import type { CharacterOverlay } from "@/lib/types/bot-integration";
import type { Json, Tables } from "@/lib/types/database.types";
import { ImagePlus, Loader2, Plus, Swords, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Character = Tables<"characters">;

const PATHWAY_AVATAR = "/images/pathway-avatar.png";

type CustomAttack = {
  name: string;
  bonus: string;
  damage: string;
  traits: string;
  action?: string;
  category?: string;
  range?: string;
  notes?: string;
};

type CharacterBuild = {
  name?: unknown;
  class?: unknown;
  ancestry?: unknown;
  heritage?: unknown;
  background?: unknown;
  level?: unknown;
  deity?: unknown;
  keyability?: unknown;
  languages?: unknown;
  abilities?: unknown;
  attributes?: unknown;
  ac?: unknown;
  armor?: unknown;
  shield?: unknown;
  speed?: unknown;
  senses?: unknown;
  class_dc?: unknown;
  spell_dc?: unknown;
  feats?: unknown;
  equipment?: unknown;
  proficiencies?: unknown;
  specials?: unknown;
  custom_attacks?: unknown;
  build?: CharacterBuild;
};

type AbilityScores = {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
};

type HpAttributes = {
  ancestryhp: number;
  classhp: number;
  bonushp: number;
  bonushpPerLevel: number;
};

type DefenseDetails = {
  ac: string;
  armor: string;
  shield: string;
  speed: string;
  senses: string;
  classDc: string;
  spellDc: string;
};

type FeatTuple = [string, string | null, string | null, string | null];
type EquipmentTuple = [string, number];
type SpecialAbilityEntry = {
  name: string;
  type: string;
  source: string;
  details: string;
};

const ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha"] as const;
const SAVE_KEYS = [
  ["fortitude", "Fortitude"],
  ["reflex", "Reflex"],
  ["will", "Will"],
] as const;
const PROFICIENCY_OPTIONS = [
  ["0", "Untrained"],
  ["1", "Trained"],
  ["2", "Expert"],
  ["3", "Master"],
  ["4", "Legendary"],
] as const;
const SKILL_ABILITY_MAP: Record<string, keyof AbilityScores> = {
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
const SKILL_ORDER = Object.keys(SKILL_ABILITY_MAP);
const SAVE_ABILITY: Record<(typeof SAVE_KEYS)[number][0], keyof AbilityScores> = {
  fortitude: "con",
  reflex: "dex",
  will: "wis",
};

function isRecord(value: Json | unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNestedString(value: Json | CharacterBuild | null, paths: string[][]) {
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

function getNestedNumber(value: Json | CharacterBuild | null, paths: string[][]) {
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

function getCustomCharacterImage(character: Character) {
  const overlay = (character.overlay ?? {}) as CharacterOverlay;
  return overlay.profile_image_url?.trim() || null;
}

function getPathbuilderCharacterImage(character: Character) {
  return getNestedString(character.pathbuilder_data, [
    ["image"],
    ["img"],
    ["avatar"],
    ["portrait"],
    ["art"],
    ["thumbnail"],
    ["build", "image"],
    ["build", "img"],
    ["build", "avatar"],
    ["build", "portrait"],
    ["build", "art"],
    ["build", "thumbnail"],
    ["build", "character", "image"],
    ["build", "character", "portrait"],
    ["character", "image"],
    ["character", "portrait"],
  ]);
}

function getCharacterImage(character: Character, storedImage?: string | null) {
  return (
    storedImage ?? getCustomCharacterImage(character) ?? getPathbuilderCharacterImage(character)
  );
}

function getCharacterBuild(character: Character) {
  const data = character.pathbuilder_data as CharacterBuild | null;
  if (isRecord(data?.build)) return data.build as CharacterBuild;
  return data ?? {};
}

function getBuildString(build: CharacterBuild, key: keyof CharacterBuild) {
  const value = build[key];
  return typeof value === "string" ? value : "";
}

function getBuildNumber(build: CharacterBuild, key: keyof CharacterBuild, fallback: number) {
  const value = build[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getAbilityScores(character: Character): AbilityScores {
  const build = getCharacterBuild(character);
  const abilities = isRecord(build.abilities) ? build.abilities : {};
  return {
    str: typeof abilities.str === "number" ? abilities.str : 10,
    dex: typeof abilities.dex === "number" ? abilities.dex : 10,
    con: typeof abilities.con === "number" ? abilities.con : 10,
    int: typeof abilities.int === "number" ? abilities.int : 10,
    wis: typeof abilities.wis === "number" ? abilities.wis : 10,
    cha: typeof abilities.cha === "number" ? abilities.cha : 10,
  };
}

function getHpAttributes(character: Character): HpAttributes {
  const build = getCharacterBuild(character);
  const attributes = isRecord(build.attributes) ? build.attributes : {};
  return {
    ancestryhp: typeof attributes.ancestryhp === "number" ? attributes.ancestryhp : 8,
    classhp: typeof attributes.classhp === "number" ? attributes.classhp : 8,
    bonushp: typeof attributes.bonushp === "number" ? attributes.bonushp : 0,
    bonushpPerLevel:
      typeof attributes.bonushpPerLevel === "number" ? attributes.bonushpPerLevel : 0,
  };
}

function getDefenseDetails(character: Character): DefenseDetails {
  const build = getCharacterBuild(character);
  const ac =
    getNestedNumber(build, [["ac"], ["armorClass"], ["armor_class"], ["stats", "ac"]]) ??
    deriveAc(character);
  const speed =
    getNestedNumber(build, [["speed"], ["speed_ft"], ["stats", "speed"]]) ??
    getNestedNumber(character.pathbuilder_data, [["speed"], ["build", "speed"]]);
  const classDc =
    getNestedNumber(build, [["class_dc"], ["classDC"], ["stats", "class_dc"]]) ??
    getNestedNumber(character.pathbuilder_data, [["class_dc"], ["build", "class_dc"]]);
  const spellDc =
    getNestedNumber(build, [["spell_dc"], ["spellDC"], ["stats", "spell_dc"]]) ??
    getNestedNumber(character.pathbuilder_data, [["spell_dc"], ["build", "spell_dc"]]);

  return {
    ac: ac ? String(ac) : "",
    armor: getNestedString(build, [["armor"], ["equipped_armor"], ["stats", "armor"]]) ?? "",
    shield: getNestedString(build, [["shield"], ["equipped_shield"], ["stats", "shield"]]) ?? "",
    speed: speed ? String(speed) : "",
    senses:
      getNestedString(build, [["senses"], ["stats", "senses"]]) ??
      getNestedString(character.pathbuilder_data, [["senses"], ["build", "senses"]]) ??
      "",
    classDc: classDc ? String(classDc) : "",
    spellDc: spellDc ? String(spellDc) : "",
  };
}

function getLanguages(character: Character) {
  const build = getCharacterBuild(character);
  return Array.isArray(build.languages)
    ? build.languages.filter((language): language is string => typeof language === "string")
    : [];
}

function getFeats(character: Character): FeatTuple[] {
  const build = getCharacterBuild(character);
  if (!Array.isArray(build.feats)) return [];
  return build.feats
    .map((feat): FeatTuple | null => {
      if (typeof feat === "string") return [feat, null, null, null];
      if (Array.isArray(feat) && typeof feat[0] === "string") {
        return [
          feat[0],
          typeof feat[1] === "string" ? feat[1] : null,
          typeof feat[2] === "string" ? feat[2] : null,
          typeof feat[3] === "string" ? feat[3] : null,
        ];
      }
      return null;
    })
    .filter((feat): feat is FeatTuple => !!feat && !!feat[0].trim());
}

function getEquipment(character: Character): EquipmentTuple[] {
  const build = getCharacterBuild(character);
  if (!Array.isArray(build.equipment)) return [];
  return build.equipment
    .map((item): EquipmentTuple | null => {
      if (Array.isArray(item) && typeof item[0] === "string") {
        return [item[0], typeof item[1] === "number" ? item[1] : 1];
      }
      if (isRecord(item) && typeof item.name === "string") {
        return [item.name, typeof item.qty === "number" ? item.qty : 1];
      }
      return null;
    })
    .filter((item): item is EquipmentTuple => !!item && !!item[0].trim());
}

function getProficiencies(character: Character) {
  const build = getCharacterBuild(character);
  return isRecord(build.proficiencies)
    ? Object.fromEntries(
        Object.entries(build.proficiencies)
          .filter((entry): entry is [string, number] => typeof entry[1] === "number")
          .sort(([a], [b]) => a.localeCompare(b))
      )
    : {};
}

function splitList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function equipmentToText(equipment: EquipmentTuple[]) {
  return equipment.map(([name, qty]) => `${name} x${qty}`).join("\n");
}

function addEquipmentToText(currentText: string, itemName: string, quantity: number) {
  const name = itemName.trim();
  if (!name) return currentText;
  const qty = Math.max(1, Math.round(quantity || 1));
  const equipment = textToEquipment(currentText);
  const existingIndex = equipment.findIndex(
    ([existingName]) => existingName.toLowerCase() === name.toLowerCase()
  );

  if (existingIndex >= 0) {
    equipment[existingIndex] = [equipment[existingIndex][0], equipment[existingIndex][1] + qty];
  } else {
    equipment.push([name, qty]);
  }

  return equipmentToText(equipment);
}

function textToEquipment(value: string): EquipmentTuple[] {
  return value
    .split("\n")
    .map((line): EquipmentTuple | null => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      const match = trimmed.match(/^(.*?)(?:\s+x(\d+))?$/i);
      const name = match?.[1]?.trim() || trimmed;
      const qty = match?.[2] ? Number(match[2]) : 1;
      return [name, Number.isFinite(qty) && qty > 0 ? qty : 1];
    })
    .filter((item): item is EquipmentTuple => !!item);
}

function proficienciesToText(proficiencies: Record<string, number>) {
  return Object.entries(proficiencies)
    .map(([key, rank]) => `${key}: ${rank}`)
    .join("\n");
}

function textToProficiencies(value: string) {
  return Object.fromEntries(
    value
      .split("\n")
      .map((line): [string, number] | null => {
        const [rawKey, rawRank] = line.split(":");
        const key = rawKey?.trim();
        if (!key) return null;
        const rank = Math.max(0, Math.min(4, Math.round(Number(rawRank) || 0)));
        return [key, rank];
      })
      .filter((entry): entry is [string, number] => !!entry)
  );
}

function abilityMod(score: number) {
  return Math.floor((score - 10) / 2);
}

function signed(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function proficiencyBonus(rank: number, level: number) {
  return rank === 0 ? 0 : rank * 2 + level;
}

function proficiencyLabel(rank: number) {
  return PROFICIENCY_OPTIONS.find(([value]) => Number(value) === rank)?.[1] ?? "Untrained";
}

function formatFeat(feat: FeatTuple) {
  const [, featType, source, detail] = feat;
  return { featType, source, detail };
}

function deriveMaxHp(character: Character) {
  const build = getCharacterBuild(character);
  const level = character.level ?? getBuildNumber(build, "level", 1);
  const abilities = getAbilityScores(character);
  const attrs = getHpAttributes(character);
  return (
    attrs.ancestryhp +
    (attrs.classhp + abilityMod(abilities.con) + attrs.bonushpPerLevel) * level +
    attrs.bonushp
  );
}

function deriveAc(character: Character) {
  const build = getCharacterBuild(character);
  const directAc = getNestedNumber(build, [
    ["ac"],
    ["armorClass"],
    ["armor_class"],
    ["stats", "ac"],
  ]);
  if (directAc !== null) return directAc;
  const abilities = getAbilityScores(character);
  const proficiencies = getProficiencies(character);
  const level = character.level ?? getBuildNumber(build, "level", 1);
  const armorRank =
    proficiencies.unarmored ??
    proficiencies.light_armor ??
    proficiencies.medium_armor ??
    proficiencies.heavy_armor ??
    0;
  return 10 + abilityMod(abilities.dex) + proficiencyBonus(armorRank, level);
}

function getSpecialAbilities(character: Character) {
  const build = getCharacterBuild(character);
  return Array.isArray(build.specials)
    ? build.specials.filter(
        (special): special is string => typeof special === "string" && !!special.trim()
      )
    : [];
}

function parseSpecialAbility(special: string): SpecialAbilityEntry {
  const [header, ...bodyLines] = special.split("\n");
  const parts = header.split("|").map((part) => part.trim());
  if (parts.length > 1) {
    return {
      name: parts[0] || "Special Ability",
      type: parts[1] ?? "",
      source: parts[2] ?? "",
      details: bodyLines.join("\n").trim(),
    };
  }

  const colonIndex = special.indexOf(":");
  if (colonIndex > 0) {
    return {
      name: special.slice(0, colonIndex).trim(),
      type: "",
      source: "",
      details: special.slice(colonIndex + 1).trim(),
    };
  }

  return {
    name: header.trim() || "Special Ability",
    type: "",
    source: "",
    details: bodyLines.join("\n").trim() || special.trim(),
  };
}

function serializeSpecialAbility(entry: SpecialAbilityEntry) {
  const header = [entry.name.trim(), entry.type.trim(), entry.source.trim()]
    .filter(Boolean)
    .join(" | ");
  const details = entry.details.trim();
  return [header, details].filter(Boolean).join("\n");
}

function getSpecialAbilityEntries(character: Character) {
  return getSpecialAbilities(character).map(parseSpecialAbility);
}

function isCustomAttack(value: unknown): value is CustomAttack {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.bonus === "string" &&
    typeof value.damage === "string" &&
    typeof value.traits === "string" &&
    (value.action === undefined || typeof value.action === "string") &&
    (value.category === undefined || typeof value.category === "string") &&
    (value.range === undefined || typeof value.range === "string") &&
    (value.notes === undefined || typeof value.notes === "string")
  );
}

function getCustomAttacks(character: Character) {
  const build = getCharacterBuild(character);
  return Array.isArray(build.custom_attacks) ? build.custom_attacks.filter(isCustomAttack) : [];
}

function FullSheetEditor({ character, onClose }: { character: Character; onClose: () => void }) {
  const build = getCharacterBuild(character);
  const updateCharacter = useUpdateCharacter(character.id);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [identity, setIdentity] = useState({
    name: character.name,
    level: String(character.level ?? getBuildNumber(build, "level", 1)),
    ancestry: character.ancestry_name ?? getBuildString(build, "ancestry"),
    heritage: character.heritage_name ?? getBuildString(build, "heritage"),
    className: character.class_name ?? getBuildString(build, "class"),
    background: character.background_name ?? getBuildString(build, "background"),
    deity: getBuildString(build, "deity"),
    keyability: getBuildString(build, "keyability"),
    status: character.status ?? "active",
  });
  const [abilities, setAbilities] = useState<AbilityScores>(() => getAbilityScores(character));
  const [attributes, setAttributes] = useState<HpAttributes>(() => getHpAttributes(character));
  const [defenses, setDefenses] = useState<DefenseDetails>(() => getDefenseDetails(character));
  const [armorSearch, setArmorSearch] = useState("");
  const [shieldSearch, setShieldSearch] = useState("");
  const [saveRanks, setSaveRanks] = useState(() => {
    const proficiencies = getProficiencies(character);
    return {
      fortitude: proficiencies.fortitude ?? 0,
      reflex: proficiencies.reflex ?? 0,
      will: proficiencies.will ?? 0,
    };
  });
  const [languagesText, setLanguagesText] = useState(() => getLanguages(character).join("\n"));
  const [proficienciesText, setProficienciesText] = useState(() =>
    proficienciesToText(getProficiencies(character))
  );
  const [featEntries, setFeatEntries] = useState<FeatTuple[]>(() => getFeats(character));
  const [equipmentText, setEquipmentText] = useState(() =>
    equipmentToText(getEquipment(character))
  );
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [equipmentQuantity, setEquipmentQuantity] = useState("1");
  const [specialEntries, setSpecialEntries] = useState<SpecialAbilityEntry[]>(() =>
    getSpecialAbilityEntries(character)
  );
  const [attacks, setAttacks] = useState<CustomAttack[]>(() => getCustomAttacks(character));

  async function saveSheet(event: React.FormEvent) {
    event.preventDefault();
    setSaveError(null);

    const level = Math.max(1, Math.min(20, Math.round(Number(identity.level) || 1)));
    const trimmedName = identity.name.trim();
    if (!trimmedName) {
      setSaveError("Character name is required.");
      return;
    }

    try {
      await updateCharacter.mutateAsync({
        name: trimmedName,
        level,
        ancestry_name: identity.ancestry.trim() || null,
        heritage_name: identity.heritage.trim() || null,
        class_name: identity.className.trim() || null,
        background_name: identity.background.trim() || null,
        status: identity.status.trim() || "active",
        build_patch: {
          name: trimmedName,
          level,
          ancestry: identity.ancestry.trim() || null,
          heritage: identity.heritage.trim() || null,
          class: identity.className.trim() || null,
          background: identity.background.trim() || null,
          deity: identity.deity.trim() || null,
          keyability: identity.keyability.trim() || null,
          abilities,
          attributes,
          extras: {
            ac: defenses.ac ? Math.round(Number(defenses.ac) || 0) : null,
            armor: defenses.armor.trim() || null,
            shield: defenses.shield.trim() || null,
            speed: defenses.speed ? Math.round(Number(defenses.speed) || 0) : null,
            senses: defenses.senses.trim() || null,
            class_dc: defenses.classDc ? Math.round(Number(defenses.classDc) || 0) : null,
            spell_dc: defenses.spellDc ? Math.round(Number(defenses.spellDc) || 0) : null,
          },
          proficiencies: {
            ...textToProficiencies(proficienciesText),
            ...saveRanks,
          },
          languages: splitList(languagesText),
          feats: featEntries
            .map(
              (feat): FeatTuple => [
                feat[0].trim(),
                feat[1]?.trim() || null,
                feat[2]?.trim() || null,
                feat[3]?.trim() || null,
              ]
            )
            .filter((feat) => feat[0]),
          equipment: textToEquipment(equipmentText),
          specials: specialEntries
            .map((special) => ({
              name: special.name.trim(),
              type: special.type.trim(),
              source: special.source.trim(),
              details: special.details.trim(),
            }))
            .filter((special) => special.name)
            .map(serializeSpecialAbility),
          custom_attacks: attacks
            .map((attack) => ({
              name: attack.name.trim(),
              bonus: attack.bonus.trim(),
              damage: attack.damage.trim(),
              traits: attack.traits.trim(),
              action: attack.action?.trim() ?? "",
              category: attack.category?.trim() ?? "",
              range: attack.range?.trim() ?? "",
              notes: attack.notes?.trim() ?? "",
            }))
            .filter((attack) => attack.name),
        },
      });
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save character sheet");
    }
  }

  function addEquipmentItem(itemName: string) {
    const quantity = Math.max(1, Math.round(Number(equipmentQuantity) || 1));
    setEquipmentText((currentText) => addEquipmentToText(currentText, itemName, quantity));
    setEquipmentSearch("");
    setEquipmentQuantity("1");
  }

  function equipArmor(itemName: string) {
    const name = itemName.trim();
    if (!name) return;
    setDefenses((current) => ({ ...current, armor: name }));
    setEquipmentText((currentText) => addEquipmentToText(currentText, name, 1));
    setArmorSearch("");
  }

  function equipShield(itemName: string) {
    const name = itemName.trim();
    if (!name) return;
    setDefenses((current) => ({ ...current, shield: name }));
    setEquipmentText((currentText) => addEquipmentToText(currentText, name, 1));
    setShieldSearch("");
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl rounded-lg border border-border bg-card shadow-2xl">
        <form onSubmit={saveSheet}>
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-card p-5">
            <div>
              <h2 className="font-heading text-2xl font-bold">Edit Character Sheet</h2>
              <p className="text-sm text-muted-foreground">
                Save changes to the character data used across Characters and the sheet view.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="btn-outline">
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateCharacter.isPending}
                className="btn-primary text-slate-950 disabled:opacity-50"
              >
                {updateCharacter.isPending ? "Saving..." : "Save Sheet"}
              </button>
            </div>
          </div>

          <div className="space-y-6 p-5">
            <section className="rounded-lg border border-border bg-background/30 p-4">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Identity
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span>Name</span>
                  <input
                    value={identity.name}
                    onChange={(e) => setIdentity((draft) => ({ ...draft, name: e.target.value }))}
                    className="input w-full"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Level</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={identity.level}
                    onChange={(e) => setIdentity((draft) => ({ ...draft, level: e.target.value }))}
                    className="input w-full"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Ancestry</span>
                  <input
                    value={identity.ancestry}
                    onChange={(e) =>
                      setIdentity((draft) => ({ ...draft, ancestry: e.target.value }))
                    }
                    className="input w-full"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Heritage</span>
                  <input
                    value={identity.heritage}
                    onChange={(e) =>
                      setIdentity((draft) => ({ ...draft, heritage: e.target.value }))
                    }
                    className="input w-full"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Class</span>
                  <input
                    value={identity.className}
                    onChange={(e) =>
                      setIdentity((draft) => ({ ...draft, className: e.target.value }))
                    }
                    className="input w-full"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Background</span>
                  <input
                    value={identity.background}
                    onChange={(e) =>
                      setIdentity((draft) => ({ ...draft, background: e.target.value }))
                    }
                    className="input w-full"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Deity</span>
                  <input
                    value={identity.deity}
                    onChange={(e) => setIdentity((draft) => ({ ...draft, deity: e.target.value }))}
                    className="input w-full"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Key Ability</span>
                  <input
                    value={identity.keyability}
                    onChange={(e) =>
                      setIdentity((draft) => ({ ...draft, keyability: e.target.value }))
                    }
                    className="input w-full"
                    placeholder="str, dex, con, int, wis, or cha"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-primary/40 bg-primary/5 p-4">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">
                Saving Throws
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                {SAVE_KEYS.map(([key, label]) => (
                  <label key={key} className="space-y-1 text-sm">
                    <span>{label}</span>
                    <select
                      value={String(saveRanks[key])}
                      onChange={(e) =>
                        setSaveRanks((draft) => ({
                          ...draft,
                          [key]: Number(e.target.value),
                        }))
                      }
                      className="input w-full"
                    >
                      {PROFICIENCY_OPTIONS.map(([value, optionLabel]) => (
                        <option key={value} value={value}>
                          {optionLabel}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-background/30 p-4">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Defenses & Equipped Gear
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-1 text-sm">
                  <span>Armor Class</span>
                  <input
                    type="number"
                    value={defenses.ac}
                    onChange={(e) => setDefenses((current) => ({ ...current, ac: e.target.value }))}
                    className="input w-full"
                    placeholder="18"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Speed (ft)</span>
                  <input
                    type="number"
                    value={defenses.speed}
                    onChange={(e) =>
                      setDefenses((current) => ({ ...current, speed: e.target.value }))
                    }
                    className="input w-full"
                    placeholder="25"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Senses</span>
                  <input
                    value={defenses.senses}
                    onChange={(e) =>
                      setDefenses((current) => ({ ...current, senses: e.target.value }))
                    }
                    className="input w-full"
                    placeholder="low-light vision, darkvision..."
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Class DC</span>
                  <input
                    type="number"
                    value={defenses.classDc}
                    onChange={(e) =>
                      setDefenses((current) => ({ ...current, classDc: e.target.value }))
                    }
                    className="input w-full"
                    placeholder="17"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Spell DC</span>
                  <input
                    type="number"
                    value={defenses.spellDc}
                    onChange={(e) =>
                      setDefenses((current) => ({ ...current, spellDc: e.target.value }))
                    }
                    className="input w-full"
                    placeholder="17"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-md border border-border/70 bg-background/30 p-3">
                  <label className="space-y-1 text-sm">
                    <span>Equipped Armor</span>
                    <input
                      value={defenses.armor}
                      onChange={(e) =>
                        setDefenses((current) => ({ ...current, armor: e.target.value }))
                      }
                      className="input mb-3 w-full"
                      placeholder="None"
                    />
                  </label>
                  <ItemSearchCombobox
                    value={armorSearch}
                    onChange={setArmorSearch}
                    onSelect={equipArmor}
                    placeholder="Search armor from the item database..."
                    className="w-full"
                  />
                  <button
                    type="button"
                    onClick={() => equipArmor(armorSearch)}
                    disabled={!armorSearch.trim()}
                    className="btn-outline mt-3 w-full text-sm disabled:opacity-50"
                  >
                    Equip Armor
                  </button>
                </div>

                <div className="rounded-md border border-border/70 bg-background/30 p-3">
                  <label className="space-y-1 text-sm">
                    <span>Equipped Shield</span>
                    <input
                      value={defenses.shield}
                      onChange={(e) =>
                        setDefenses((current) => ({ ...current, shield: e.target.value }))
                      }
                      className="input mb-3 w-full"
                      placeholder="None"
                    />
                  </label>
                  <ItemSearchCombobox
                    value={shieldSearch}
                    onChange={setShieldSearch}
                    onSelect={equipShield}
                    placeholder="Search shields from the item database..."
                    className="w-full"
                  />
                  <button
                    type="button"
                    onClick={() => equipShield(shieldSearch)}
                    disabled={!shieldSearch.trim()}
                    className="btn-outline mt-3 w-full text-sm disabled:opacity-50"
                  >
                    Equip Shield
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-background/30 p-4">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Ability Scores & HP
              </h3>
              <div className="grid gap-4 md:grid-cols-6">
                {ABILITY_KEYS.map((key) => (
                  <label key={key} className="space-y-1 text-sm uppercase">
                    <span>{key}</span>
                    <input
                      type="number"
                      value={abilities[key]}
                      onChange={(e) =>
                        setAbilities((draft) => ({
                          ...draft,
                          [key]: Math.round(Number(e.target.value) || 0),
                        }))
                      }
                      className="input w-full"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                {[
                  ["ancestryhp", "Ancestry HP"],
                  ["classhp", "Class HP"],
                  ["bonushp", "Bonus HP"],
                  ["bonushpPerLevel", "Bonus HP/Level"],
                ].map(([key, label]) => (
                  <label key={key} className="space-y-1 text-sm">
                    <span>{label}</span>
                    <input
                      type="number"
                      value={attributes[key as keyof HpAttributes]}
                      onChange={(e) =>
                        setAttributes((draft) => ({
                          ...draft,
                          [key]: Math.round(Number(e.target.value) || 0),
                        }))
                      }
                      className="input w-full"
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-border bg-background/30 p-4">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Languages & Feats
                </h3>
                <label className="space-y-1 text-sm">
                  <span>Languages</span>
                  <textarea
                    value={languagesText}
                    onChange={(e) => setLanguagesText(e.target.value)}
                    rows={4}
                    className="input w-full resize-y"
                    placeholder="Common&#10;Elven&#10;Draconic"
                  />
                </label>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm">Feats</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFeatEntries((current) => [...current, ["", null, null, null]])
                      }
                      className="btn-outline text-sm"
                    >
                      Add Feat
                    </button>
                  </div>
                  {featEntries.length > 0 ? (
                    <div className="space-y-3">
                      {featEntries.map((feat, index) => (
                        <div
                          key={index}
                          className="rounded-md border border-border/70 bg-background/30 p-3"
                        >
                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="space-y-1 text-sm">
                              <span>Feat Name</span>
                              <input
                                value={feat[0]}
                                onChange={(e) =>
                                  setFeatEntries((current) =>
                                    current.map((item, currentIndex) =>
                                      currentIndex === index
                                        ? [e.target.value, item[1], item[2], item[3]]
                                        : item
                                    )
                                  )
                                }
                                className="input w-full"
                                placeholder="e.g. Elemental Wrath"
                              />
                            </label>
                            <label className="space-y-1 text-sm">
                              <span>Type / Category</span>
                              <input
                                value={feat[1] ?? ""}
                                onChange={(e) =>
                                  setFeatEntries((current) =>
                                    current.map((item, currentIndex) =>
                                      currentIndex === index
                                        ? [item[0], e.target.value, item[2], item[3]]
                                        : item
                                    )
                                  )
                                }
                                className="input w-full"
                                placeholder="Ancestry Feat, Class Feat, Skill Feat..."
                              />
                            </label>
                          </div>
                          <label className="mt-3 block space-y-1 text-sm">
                            <span>Source / Prerequisites</span>
                            <input
                              value={feat[2] ?? ""}
                              onChange={(e) =>
                                setFeatEntries((current) =>
                                  current.map((item, currentIndex) =>
                                    currentIndex === index
                                      ? [item[0], item[1], e.target.value, item[3]]
                                      : item
                                  )
                                )
                              }
                              className="input w-full"
                              placeholder="Level 1, Pathway Homebrew, prerequisite text..."
                            />
                          </label>
                          <label className="mt-3 block space-y-1 text-sm">
                            <span>Rules Text / What It Does</span>
                            <textarea
                              value={feat[3] ?? ""}
                              onChange={(e) =>
                                setFeatEntries((current) =>
                                  current.map((item, currentIndex) =>
                                    currentIndex === index
                                      ? [item[0], item[1], item[2], e.target.value]
                                      : item
                                  )
                                )
                              }
                              rows={5}
                              className="input w-full resize-y"
                              placeholder="Describe the feat's benefit, action cost, frequency, trigger, and any special rules."
                            />
                          </label>
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                setFeatEntries((current) =>
                                  current.filter((_, currentIndex) => currentIndex !== index)
                                )
                              }
                              className="btn-outline text-sm text-destructive hover:bg-destructive hover:text-white"
                            >
                              Remove Feat
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No feats added yet.</p>
                  )}
                </div>
                <label className="mt-4 block space-y-1 text-sm">
                  <span>Proficiencies</span>
                  <textarea
                    value={proficienciesText}
                    onChange={(e) => setProficienciesText(e.target.value)}
                    rows={8}
                    className="input w-full resize-y font-mono text-sm"
                    placeholder="acrobatics: 1&#10;perception: 2&#10;fortitude: 1"
                  />
                  <span className="text-xs text-muted-foreground">
                    Use ranks 0-4 for untrained, trained, expert, master, legendary.
                  </span>
                </label>
              </div>

              <div className="rounded-lg border border-border bg-background/30 p-4">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Equipment & Specials
                </h3>
                <label className="space-y-1 text-sm">
                  <span>Equipment</span>
                  <div className="mb-3 rounded-md border border-border/70 bg-background/30 p-3">
                    <div className="grid gap-3 md:grid-cols-[1fr_110px]">
                      <ItemSearchCombobox
                        value={equipmentSearch}
                        onChange={setEquipmentSearch}
                        onSelect={addEquipmentItem}
                        placeholder="Search the item database..."
                        className="w-full"
                      />
                      <input
                        type="number"
                        min={1}
                        value={equipmentQuantity}
                        onChange={(e) => setEquipmentQuantity(e.target.value)}
                        className="input w-full"
                        aria-label="Equipment quantity"
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        Search includes the imported Pathfinder 2e item database.
                      </p>
                      <button
                        type="button"
                        onClick={() => addEquipmentItem(equipmentSearch)}
                        disabled={!equipmentSearch.trim()}
                        className="btn-outline text-sm disabled:opacity-50"
                      >
                        Add Item
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={equipmentText}
                    onChange={(e) => setEquipmentText(e.target.value)}
                    rows={6}
                    className="input w-full resize-y"
                    placeholder="Longsword x1&#10;Rations x7"
                  />
                </label>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm">Special Abilities</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSpecialEntries((current) => [
                          ...current,
                          { name: "", type: "", source: "", details: "" },
                        ])
                      }
                      className="btn-outline text-sm"
                    >
                      Add Ability
                    </button>
                  </div>
                  {specialEntries.length > 0 ? (
                    <div className="space-y-3">
                      {specialEntries.map((special, index) => (
                        <div
                          key={index}
                          className="rounded-md border border-border/70 bg-background/30 p-3"
                        >
                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="space-y-1 text-sm">
                              <span>Ability Name</span>
                              <input
                                value={special.name}
                                onChange={(e) =>
                                  setSpecialEntries((current) =>
                                    current.map((item, currentIndex) =>
                                      currentIndex === index
                                        ? { ...item, name: e.target.value }
                                        : item
                                    )
                                  )
                                }
                                className="input w-full"
                                placeholder="e.g. Fanatical Frenzy"
                              />
                            </label>
                            <label className="space-y-1 text-sm">
                              <span>Type / Category</span>
                              <input
                                value={special.type}
                                onChange={(e) =>
                                  setSpecialEntries((current) =>
                                    current.map((item, currentIndex) =>
                                      currentIndex === index
                                        ? { ...item, type: e.target.value }
                                        : item
                                    )
                                  )
                                }
                                className="input w-full"
                                placeholder="Class Feature, Ancestry Ability, Reaction..."
                              />
                            </label>
                          </div>
                          <label className="mt-3 block space-y-1 text-sm">
                            <span>Source / Trigger / Frequency</span>
                            <input
                              value={special.source}
                              onChange={(e) =>
                                setSpecialEntries((current) =>
                                  current.map((item, currentIndex) =>
                                    currentIndex === index
                                      ? { ...item, source: e.target.value }
                                      : item
                                  )
                                )
                              }
                              className="input w-full"
                              placeholder="Pathway Homebrew, once per hour, Trigger: ..."
                            />
                          </label>
                          <label className="mt-3 block space-y-1 text-sm">
                            <span>Rules Text / What It Does</span>
                            <textarea
                              value={special.details}
                              onChange={(e) =>
                                setSpecialEntries((current) =>
                                  current.map((item, currentIndex) =>
                                    currentIndex === index
                                      ? { ...item, details: e.target.value }
                                      : item
                                  )
                                )
                              }
                              rows={5}
                              className="input w-full resize-y"
                              placeholder="Describe the ability's effect, action cost, trigger, duration, and any restrictions."
                            />
                          </label>
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                setSpecialEntries((current) =>
                                  current.filter((_, currentIndex) => currentIndex !== index)
                                )
                              }
                              className="btn-outline text-sm text-destructive hover:bg-destructive hover:text-white"
                            >
                              Remove Ability
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No special abilities added yet.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-background/30 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Custom Attacks
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setAttacks((current) => [
                      ...current,
                      {
                        name: "",
                        bonus: "",
                        damage: "",
                        traits: "",
                        action: "",
                        category: "",
                        range: "",
                        notes: "",
                      },
                    ])
                  }
                  className="btn-outline text-sm"
                >
                  Add Attack
                </button>
              </div>
              <div className="space-y-3">
                {attacks.map((attack, index) => (
                  <div key={index} className="rounded-md border border-border/70 p-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      {(["name", "category", "action", "bonus"] as const).map((key) => (
                        <label key={key} className="space-y-1 text-sm capitalize">
                          <span>{key === "bonus" ? "Attack Bonus" : key}</span>
                          <input
                            value={attack[key] ?? ""}
                            onChange={(e) =>
                              setAttacks((current) =>
                                current.map((item, currentIndex) =>
                                  currentIndex === index ? { ...item, [key]: e.target.value } : item
                                )
                              )
                            }
                            className="input w-full"
                            placeholder={
                              key === "name"
                                ? "Longsword"
                                : key === "category"
                                  ? "Melee Strike, Ranged Strike, Spell Attack..."
                                  : key === "action"
                                    ? "1 action, 2 actions, reaction..."
                                    : "+7 to hit"
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      {(["damage", "traits", "range"] as const).map((key) => (
                        <label key={key} className="space-y-1 text-sm capitalize">
                          <span>{key}</span>
                          <input
                            value={attack[key] ?? ""}
                            onChange={(e) =>
                              setAttacks((current) =>
                                current.map((item, currentIndex) =>
                                  currentIndex === index ? { ...item, [key]: e.target.value } : item
                                )
                              )
                            }
                            className="input w-full"
                            placeholder={
                              key === "damage"
                                ? "1d8 slashing"
                                : key === "traits"
                                  ? "agile, finesse, magical"
                                  : "reach 10 ft., 60 feet..."
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <label className="mt-3 block space-y-1 text-sm">
                      <span>Attack Rules / Notes</span>
                      <textarea
                        value={attack.notes ?? ""}
                        onChange={(e) =>
                          setAttacks((current) =>
                            current.map((item, currentIndex) =>
                              currentIndex === index ? { ...item, notes: e.target.value } : item
                            )
                          )
                        }
                        rows={4}
                        className="input w-full resize-y"
                        placeholder="Add critical effects, reload, special damage riders, MAP notes, or when this attack applies."
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setAttacks((current) =>
                          current.filter((_, currentIndex) => currentIndex !== index)
                        )
                      }
                      className="mt-3 btn-outline w-full text-destructive hover:bg-destructive hover:text-white"
                    >
                      Remove Attack
                    </button>
                  </div>
                ))}
                {attacks.length === 0 && (
                  <p className="text-sm text-muted-foreground">No custom attacks added yet.</p>
                )}
              </div>
            </section>

            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-background/35 p-2 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-heading text-lg font-bold leading-tight">{value}</p>
      {sub && <p className="truncate text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function MiniSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border/70 bg-background/20 p-3">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
        {title}
      </h3>
      {children}
    </section>
  );
}

function MiniCharacterSheet({
  character,
  storedImage,
}: {
  character: Character;
  storedImage?: string | null;
}) {
  const [isFullEditorOpen, setIsFullEditorOpen] = useState(false);
  const build = getCharacterBuild(character);
  const image = getCharacterImage(character, storedImage);
  const abilities = getAbilityScores(character);
  const attributes = getHpAttributes(character);
  const proficiencies = getProficiencies(character);
  const feats = getFeats(character);
  const equipment = getEquipment(character);
  const specials = getSpecialAbilityEntries(character);
  const attacks = getCustomAttacks(character);
  const languages = getLanguages(character);
  const defenses = getDefenseDetails(character);
  const level = character.level ?? getBuildNumber(build, "level", 1);
  const maxHp = deriveMaxHp(character);
  const ac = Number(defenses.ac) || deriveAc(character);
  const perceptionRank = proficiencies.perception ?? 0;
  const perception = proficiencyBonus(perceptionRank, level) + abilityMod(abilities.wis);
  const visibleSkills = SKILL_ORDER.map((skill) => ({
    skill,
    rank: proficiencies[skill] ?? 0,
    total:
      proficiencyBonus(proficiencies[skill] ?? 0, level) +
      abilityMod(abilities[SKILL_ABILITY_MAP[skill]]),
  })).filter(({ rank }) => rank > 0);
  const extraSkills = Object.entries(proficiencies)
    .filter(
      ([key, rank]) =>
        !SKILL_ORDER.includes(key) &&
        !SAVE_KEYS.some(([save]) => save === key) &&
        key !== "perception" &&
        rank > 0
    )
    .map(([skill, rank]) => ({ skill, rank, total: proficiencyBonus(rank, level) }));

  return (
    <>
      <article className="card overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[220px_1fr]">
          <div className="relative min-h-56 bg-muted">
            {image ? (
              <img
                src={image}
                alt={`Image for ${character.name}`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(211,171,53,0.2),transparent_42%),linear-gradient(145deg,rgba(15,23,42,0.96),rgba(5,8,18,0.98))]">
                <img
                  src={PATHWAY_AVATAR}
                  alt=""
                  className="h-20 w-20 rounded-full border border-primary/30 object-cover opacity-80"
                />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/80 to-transparent p-4">
              <h2 className="font-heading text-2xl font-bold leading-tight">{character.name}</h2>
              <p className="text-sm text-muted-foreground">
                Level {level}{" "}
                {(character.class_name ?? getBuildString(build, "class")) || "Adventurer"}
              </p>
            </div>
          </div>

          <div className="space-y-4 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="mb-1 font-mono text-[11px] text-muted-foreground">
                  Pathway JSON ID: {character.id}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[character.ancestry_name, character.heritage_name, character.background_name]
                    .filter(Boolean)
                    .join(" - ") || "Pathfinder 2e character"}
                </p>
                {languages.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Languages: {languages.join(", ")}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsFullEditorOpen(true)}
                  className="btn-outline text-sm"
                >
                  Edit Sheet
                </button>
                <Link
                  href={`/characters/${character.id}`}
                  className="btn-primary text-sm text-slate-950"
                >
                  Open
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              <MiniStat label="AC" value={ac} />
              <MiniStat label="HP" value={maxHp} sub={`${attributes.classhp} class hp`} />
              <MiniStat
                label="Speed"
                value={defenses.speed || "—"}
                sub={defenses.speed ? "feet" : undefined}
              />
              <MiniStat
                label="Perception"
                value={signed(perception)}
                sub={proficiencyLabel(perceptionRank)}
              />
              {SAVE_KEYS.map(([key, label]) => {
                const rank = proficiencies[key] ?? 0;
                const total =
                  proficiencyBonus(rank, level) + abilityMod(abilities[SAVE_ABILITY[key]]);
                return (
                  <MiniStat
                    key={key}
                    label={label}
                    value={signed(total)}
                    sub={proficiencyLabel(rank)}
                  />
                );
              })}
            </div>

            {(defenses.armor ||
              defenses.shield ||
              defenses.senses ||
              defenses.classDc ||
              defenses.spellDc) && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {defenses.armor && <MiniStat label="Armor" value={defenses.armor} />}
                {defenses.shield && <MiniStat label="Shield" value={defenses.shield} />}
                {defenses.senses && <MiniStat label="Senses" value={defenses.senses} />}
                {defenses.classDc && <MiniStat label="Class DC" value={defenses.classDc} />}
                {defenses.spellDc && <MiniStat label="Spell DC" value={defenses.spellDc} />}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {ABILITY_KEYS.map((key) => (
                <MiniStat
                  key={key}
                  label={key.toUpperCase()}
                  value={signed(abilityMod(abilities[key]))}
                  sub={String(abilities[key])}
                />
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <MiniSection title="Skills">
                {visibleSkills.length > 0 || extraSkills.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    {[...visibleSkills, ...extraSkills]
                      .slice(0, 18)
                      .map(({ skill, rank, total }) => (
                        <div key={skill} className="flex items-center justify-between gap-2">
                          <span className="truncate capitalize text-muted-foreground">
                            {skill.replace(/_/g, " ")}
                          </span>
                          <span className="font-mono font-semibold">
                            {signed(total)}
                            <span className="ml-1 text-[10px] text-muted-foreground">
                              {proficiencyLabel(rank)[0]}
                            </span>
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No trained skills saved yet.</p>
                )}
              </MiniSection>

              <MiniSection title="Attacks">
                {attacks.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {attacks.slice(0, 5).map((attack, index) => (
                      <div key={`${attack.name}-${index}`} className="rounded bg-muted/40 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">{attack.name}</p>
                          {attack.bonus && (
                            <span className="font-mono text-xs">{attack.bonus}</span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {[attack.category, attack.action, attack.range]
                            .filter(Boolean)
                            .map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-border bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[attack.damage, attack.traits].filter(Boolean).join(" - ") ||
                            "No attack details"}
                        </p>
                        {attack.notes && (
                          <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                            {attack.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No custom attacks saved yet.</p>
                )}
              </MiniSection>

              <MiniSection title="Feats">
                {feats.length > 0 ? (
                  <div className="grid gap-2 text-sm">
                    {feats.slice(0, 10).map((feat, index) => (
                      <details key={`${feat[0]}-${index}`} className="rounded bg-muted/40 p-2">
                        <summary className="cursor-pointer font-semibold">{feat[0]}</summary>
                        {(() => {
                          const { featType, source, detail } = formatFeat(feat);
                          return (
                            <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                              {(featType || source) && (
                                <div className="flex flex-wrap gap-2">
                                  {featType && (
                                    <span className="rounded-full border border-border bg-background/40 px-2 py-0.5">
                                      {featType}
                                    </span>
                                  )}
                                  {source && (
                                    <span className="rounded-full border border-border bg-background/40 px-2 py-0.5">
                                      {source}
                                    </span>
                                  )}
                                </div>
                              )}
                              <p className="whitespace-pre-wrap leading-relaxed">
                                {detail || "No feat rules text saved yet."}
                              </p>
                            </div>
                          );
                        })()}
                      </details>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No feats saved yet.</p>
                )}
              </MiniSection>

              <MiniSection title="Special Abilities">
                {specials.length > 0 ? (
                  <div className="grid gap-2 text-sm">
                    {specials.slice(0, 8).map((special, index) => (
                      <details key={`${special.name}-${index}`} className="rounded bg-muted/40 p-2">
                        <summary className="cursor-pointer font-semibold">
                          {special.name || `Ability ${index + 1}`}
                        </summary>
                        <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                          {(special.type || special.source) && (
                            <div className="flex flex-wrap gap-2">
                              {special.type && (
                                <span className="rounded-full border border-border bg-background/40 px-2 py-0.5">
                                  {special.type}
                                </span>
                              )}
                              {special.source && (
                                <span className="rounded-full border border-border bg-background/40 px-2 py-0.5">
                                  {special.source}
                                </span>
                              )}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed">
                            {special.details || "No ability rules text saved yet."}
                          </p>
                        </div>
                      </details>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No special abilities saved yet.</p>
                )}
              </MiniSection>

              <MiniSection title="Equipment">
                {equipment.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    {equipment.slice(0, 16).map(([name, qty]) => (
                      <div key={name} className="flex items-center justify-between gap-2">
                        <span className="truncate text-muted-foreground">{name}</span>
                        <span className="font-mono text-xs">x{qty}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No equipment saved yet.</p>
                )}
              </MiniSection>
            </div>
          </div>
        </div>
      </article>

      {isFullEditorOpen && (
        <FullSheetEditor character={character} onClose={() => setIsFullEditorOpen(false)} />
      )}
    </>
  );
}

function CharacterCard({
  character,
  storedImage,
  onDelete,
  isDeleting,
}: {
  character: Character;
  storedImage?: string | null;
  onDelete: (id: string, name: string) => void;
  isDeleting: boolean;
}) {
  const customImage = storedImage ?? getCustomCharacterImage(character);
  const image = getCharacterImage(character, storedImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadCharacterImage = useUploadCharacterImage();
  const deleteCharacterImage = useDeleteCharacterImage();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFullEditorOpen, setIsFullEditorOpen] = useState(false);

  // Reset error state whenever the resolved image URL changes (e.g. after upload).
  useEffect(() => {
    setImageError(false);
  }, [image]);

  const subtitle = [character.ancestry_name, character.heritage_name, character.class_name]
    .filter(Boolean)
    .join(" · ");

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);
    try {
      await uploadCharacterImage.mutateAsync({ characterId: character.id, file });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function removeImage() {
    setUploadError(null);
    setIsUploading(true);
    try {
      await deleteCharacterImage.mutateAsync(character.id);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not remove image");
    } finally {
      setIsUploading(false);
    }
  }

  const isBusy = isUploading || uploadCharacterImage.isPending || deleteCharacterImage.isPending;

  return (
    <>
      <div className="card group relative overflow-hidden transition-all hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {image && !imageError ? (
            <img
              src={image}
              alt={`Image for ${character.name}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(211,171,53,0.2),transparent_42%),linear-gradient(145deg,rgba(15,23,42,0.96),rgba(5,8,18,0.98))] text-center">
              <img
                src={PATHWAY_AVATAR}
                alt=""
                className="h-20 w-20 rounded-full border border-primary/30 object-cover opacity-75 shadow-xl"
              />
              <span className="mt-4 max-w-[80%] text-sm font-semibold text-foreground/85">
                Add image for {character.name}
              </span>
            </div>
          )}
        </div>

        <div className="p-6">
          <Link
            href={`/characters/${character.id}`}
            className="absolute inset-0 z-0"
            aria-label={`View ${character.name}`}
          />

          <div className="mb-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{character.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {subtitle || "Pathfinder 2e character"}
                </p>
              </div>
              <span className="ml-2 shrink-0 rounded-full bg-muted px-2 py-1 text-xs">
                Lvl {character.level}
              </span>
            </div>
            {character.background_name && (
              <p className="mt-1 text-xs text-muted-foreground">
                {character.background_name} background
              </p>
            )}
          </div>

          <div className="mb-4 flex items-center justify-between">
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                character.status === "active"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {character.status}
            </span>
            <p className="text-xs text-muted-foreground">
              {new Date(character.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2">
            <Link
              href={`/characters/${character.id}`}
              className="btn-primary flex-1 text-center text-sm text-slate-950"
            >
              View Sheet
            </Link>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="btn-outline px-3 py-2 disabled:opacity-50"
              title={image ? "Replace character image" : "Upload character image"}
              aria-label={image ? "Replace character image" : "Upload character image"}
            >
              {isBusy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(character.id, character.name);
              }}
              disabled={isDeleting}
              className="btn-outline px-3 py-2 text-destructive hover:bg-destructive hover:text-white disabled:opacity-50"
              aria-label={`Delete ${character.name}`}
            >
              {isDeleting ? <div className="spinner h-4 w-4" /> : <Trash2 size={16} />}
            </button>
          </div>

          <div className="relative z-10 mt-3 flex min-h-5 items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {customImage
                ? "Custom character image"
                : image
                  ? "Pathbuilder sheet image"
                  : "Upload art for this character"}
            </p>
            {customImage && (
              <button
                type="button"
                onClick={removeImage}
                disabled={isBusy}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 size={12} />
                Remove image
              </button>
            )}
          </div>
          {uploadError && (
            <p className="relative z-10 mt-2 text-xs text-destructive">{uploadError}</p>
          )}

          <div className="relative z-10 mt-4 border-t border-border/60 pt-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsFullEditorOpen(true);
              }}
              className="btn-primary mb-2 w-full justify-center text-sm text-slate-950"
            >
              Edit Full Sheet
            </button>
          </div>
        </div>
      </div>

      {isFullEditorOpen && (
        <FullSheetEditor character={character} onClose={() => setIsFullEditorOpen(false)} />
      )}
    </>
  );
}

export default function CharactersPage() {
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "sheets">("cards");

  const { data: characters, isLoading, error } = useCharacters({}, { enabled: !!user });
  const { data: characterImages = {} } = useCharacterImages({ enabled: !!user });
  const deleteMutation = useDeleteCharacter();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      alert("Failed to delete character. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <MainLayout>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-heading mb-2 text-4xl font-bold">My Characters</h1>
          <p className="text-muted-foreground">Your Pathfinder 2e characters</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg border border-border bg-card p-1">
            {(["cards", "sheets"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  viewMode === mode
                    ? "bg-primary text-slate-950"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode === "cards" ? "Cards" : "Mini Sheets"}
              </button>
            ))}
          </div>
          <Link href="/characters/new" className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            Add Character
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      )}

      {error && (
        <div className="card border-destructive bg-destructive/10 p-6">
          <p className="font-semibold text-destructive">Failed to load characters</p>
          <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        </div>
      )}

      {!isLoading && !error && characters?.length === 0 && (
        <div className="card p-12 text-center">
          <Swords size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="font-heading mb-2 text-2xl font-bold">No Characters Yet</h2>
          <p className="mb-6 text-muted-foreground">
            Import a character from Pathbuilder 2e to get started.
          </p>
          <Link href="/characters/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={20} />
            Import from Pathbuilder
          </Link>
        </div>
      )}

      {!isLoading && !error && characters && characters.length > 0 && viewMode === "cards" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              storedImage={characterImages[character.id]}
              onDelete={handleDelete}
              isDeleting={deletingId === character.id}
            />
          ))}
        </div>
      )}

      {!isLoading && !error && characters && characters.length > 0 && viewMode === "sheets" && (
        <div className="space-y-6">
          {characters.map((character) => (
            <MiniCharacterSheet
              key={character.id}
              character={character}
              storedImage={characterImages[character.id]}
            />
          ))}
        </div>
      )}
    </MainLayout>
  );
}
