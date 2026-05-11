"use client";

import { MainLayout } from "@/components/layout";
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

type FeatTuple = [string, string | null, string | null, string | null];
type EquipmentTuple = [string, number];

const ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha"] as const;

function isRecord(value: Json | unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNestedString(value: Json | null, paths: string[][]) {
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

function featsToText(feats: FeatTuple[]) {
  return feats.map(([name]) => name).join("\n");
}

function textToFeats(value: string): FeatTuple[] {
  return splitList(value).map((name) => [name, null, null, null]);
}

function equipmentToText(equipment: EquipmentTuple[]) {
  return equipment.map(([name, qty]) => `${name} x${qty}`).join("\n");
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

function getSpecialAbilities(character: Character) {
  const build = getCharacterBuild(character);
  return Array.isArray(build.specials)
    ? build.specials.filter(
        (special): special is string => typeof special === "string" && !!special.trim()
      )
    : [];
}

function isCustomAttack(value: unknown): value is CustomAttack {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.bonus === "string" &&
    typeof value.damage === "string" &&
    typeof value.traits === "string"
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
  const [languagesText, setLanguagesText] = useState(() => getLanguages(character).join("\n"));
  const [proficienciesText, setProficienciesText] = useState(() =>
    proficienciesToText(getProficiencies(character))
  );
  const [featsText, setFeatsText] = useState(() => featsToText(getFeats(character)));
  const [equipmentText, setEquipmentText] = useState(() =>
    equipmentToText(getEquipment(character))
  );
  const [specialsText, setSpecialsText] = useState(() => getSpecialAbilities(character).join("\n"));
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
          proficiencies: textToProficiencies(proficienciesText),
          languages: splitList(languagesText),
          feats: textToFeats(featsText),
          equipment: textToEquipment(equipmentText),
          specials: specialsText
            .split("\n")
            .map((special) => special.trim())
            .filter(Boolean),
          custom_attacks: attacks
            .map((attack) => ({
              name: attack.name.trim(),
              bonus: attack.bonus.trim(),
              damage: attack.damage.trim(),
              traits: attack.traits.trim(),
            }))
            .filter((attack) => attack.name),
        },
      });
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save character sheet");
    }
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
                <label className="mt-4 block space-y-1 text-sm">
                  <span>Feats</span>
                  <textarea
                    value={featsText}
                    onChange={(e) => setFeatsText(e.target.value)}
                    rows={8}
                    className="input w-full resize-y"
                    placeholder="One feat per line"
                  />
                </label>
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
                  <textarea
                    value={equipmentText}
                    onChange={(e) => setEquipmentText(e.target.value)}
                    rows={6}
                    className="input w-full resize-y"
                    placeholder="Longsword x1&#10;Rations x7"
                  />
                </label>
                <label className="mt-4 block space-y-1 text-sm">
                  <span>Special Abilities</span>
                  <textarea
                    value={specialsText}
                    onChange={(e) => setSpecialsText(e.target.value)}
                    rows={6}
                    className="input w-full resize-y"
                    placeholder="One special ability per line"
                  />
                </label>
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
                      { name: "", bonus: "", damage: "", traits: "" },
                    ])
                  }
                  className="btn-outline text-sm"
                >
                  Add Attack
                </button>
              </div>
              <div className="space-y-3">
                {attacks.map((attack, index) => (
                  <div
                    key={index}
                    className="grid gap-2 rounded-md border border-border/70 p-3 md:grid-cols-4"
                  >
                    {(["name", "bonus", "damage", "traits"] as const).map((key) => (
                      <label key={key} className="space-y-1 text-sm capitalize">
                        <span>{key}</span>
                        <input
                          value={attack[key]}
                          onChange={(e) =>
                            setAttacks((current) =>
                              current.map((item, currentIndex) =>
                                currentIndex === index ? { ...item, [key]: e.target.value } : item
                              )
                            )
                          }
                          className="input w-full"
                        />
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setAttacks((current) =>
                          current.filter((_, currentIndex) => currentIndex !== index)
                        )
                      }
                      className="btn-outline text-destructive hover:bg-destructive hover:text-white md:col-span-4"
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
  const updateCharacter = useUpdateCharacter(character.id);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isBuildEditorOpen, setIsBuildEditorOpen] = useState(false);
  const [isFullEditorOpen, setIsFullEditorOpen] = useState(false);
  const [specialEdits, setSpecialEdits] = useState<Record<number, string>>({});
  const [attackEdits, setAttackEdits] = useState<Record<number, CustomAttack>>({});
  const [specialDraft, setSpecialDraft] = useState("");
  const [attackDraft, setAttackDraft] = useState<CustomAttack>({
    name: "",
    bonus: "",
    damage: "",
    traits: "",
  });

  const specialAbilities = getSpecialAbilities(character);
  const customAttacks = getCustomAttacks(character);

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

  async function saveSpecialAbilities(nextSpecials: string[]) {
    setBuildError(null);
    try {
      await updateCharacter.mutateAsync({ build_patch: { specials: nextSpecials } });
    } catch (err) {
      setBuildError(err instanceof Error ? err.message : "Could not save special abilities");
    }
  }

  async function addSpecialAbility(event: React.FormEvent) {
    event.preventDefault();
    const nextSpecial = specialDraft.trim();
    if (!nextSpecial) return;
    await saveSpecialAbilities([...specialAbilities, nextSpecial]);
    setSpecialDraft("");
  }

  async function removeSpecialAbility(index: number) {
    await saveSpecialAbilities(
      specialAbilities.filter((_, currentIndex) => currentIndex !== index)
    );
  }

  async function editSpecialAbility(index: number) {
    const nextSpecial = (specialEdits[index] ?? specialAbilities[index] ?? "").trim();
    if (!nextSpecial) return;
    await saveSpecialAbilities(
      specialAbilities.map((special, currentIndex) =>
        currentIndex === index ? nextSpecial : special
      )
    );
  }

  async function saveCustomAttacks(nextAttacks: CustomAttack[]) {
    setBuildError(null);
    try {
      await updateCharacter.mutateAsync({ build_patch: { custom_attacks: nextAttacks } });
    } catch (err) {
      setBuildError(err instanceof Error ? err.message : "Could not save custom attacks");
    }
  }

  async function addCustomAttack(event: React.FormEvent) {
    event.preventDefault();
    const nextAttack = {
      name: attackDraft.name.trim(),
      bonus: attackDraft.bonus.trim(),
      damage: attackDraft.damage.trim(),
      traits: attackDraft.traits.trim(),
    };
    if (!nextAttack.name) return;
    await saveCustomAttacks([...customAttacks, nextAttack]);
    setAttackDraft({ name: "", bonus: "", damage: "", traits: "" });
  }

  async function removeCustomAttack(index: number) {
    await saveCustomAttacks(customAttacks.filter((_, currentIndex) => currentIndex !== index));
  }

  async function editCustomAttack(index: number) {
    const currentAttack = customAttacks[index];
    if (!currentAttack) return;
    const editedAttack = attackEdits[index] ?? currentAttack;
    const nextAttack = {
      name: editedAttack.name.trim(),
      bonus: editedAttack.bonus.trim(),
      damage: editedAttack.damage.trim(),
      traits: editedAttack.traits.trim(),
    };
    if (!nextAttack.name) return;
    await saveCustomAttacks(
      customAttacks.map((attack, currentIndex) => (currentIndex === index ? nextAttack : attack))
    );
  }

  const isBusy = isUploading || uploadCharacterImage.isPending || deleteCharacterImage.isPending;
  const isBuildSaving = updateCharacter.isPending;

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
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsBuildEditorOpen((open) => !open);
              }}
              className="btn-outline w-full justify-center text-sm"
            >
              {isBuildEditorOpen ? "Close Specials & Attacks" : "Edit Specials & Attacks"}
            </button>

            {!isBuildEditorOpen && (specialAbilities.length > 0 || customAttacks.length > 0) && (
              <p className="mt-2 text-xs text-muted-foreground">
                {specialAbilities.length} special
                {specialAbilities.length === 1 ? "" : "s"} · {customAttacks.length} custom attack
                {customAttacks.length === 1 ? "" : "s"}
              </p>
            )}

            {isBuildEditorOpen && (
              <div className="mt-4 space-y-5" onClick={(e) => e.stopPropagation()}>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Special Abilities</h3>
                    {isBuildSaving && (
                      <Loader2 size={14} className="animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {specialAbilities.length > 0 ? (
                    <div className="mb-3 space-y-2">
                      {specialAbilities.map((special, index) => (
                        <div
                          key={`${special}-${index}`}
                          className="rounded-md border border-border/70 bg-background/35 p-2 text-sm"
                        >
                          <textarea
                            value={specialEdits[index] ?? special}
                            onChange={(e) =>
                              setSpecialEdits((edits) => ({ ...edits, [index]: e.target.value }))
                            }
                            disabled={isBuildSaving}
                            rows={3}
                            className="input min-h-20 w-full resize-y text-sm"
                            aria-label={`Edit special ability ${index + 1}`}
                          />
                          <div className="mt-2 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => editSpecialAbility(index)}
                              disabled={isBuildSaving || !(specialEdits[index] ?? special).trim()}
                              className="btn-primary px-3 py-1.5 text-xs text-slate-950 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSpecialAbility(index)}
                              disabled={isBuildSaving}
                              className="btn-outline px-3 py-1.5 text-xs text-destructive hover:bg-destructive hover:text-white disabled:opacity-50"
                              aria-label={`Remove special ability ${special}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mb-3 text-xs text-muted-foreground">
                      No special abilities added yet.
                    </p>
                  )}
                  <form onSubmit={addSpecialAbility} className="space-y-2">
                    <textarea
                      value={specialDraft}
                      onChange={(e) => setSpecialDraft(e.target.value)}
                      disabled={isBuildSaving}
                      rows={3}
                      className="input min-h-20 w-full resize-y text-sm"
                      placeholder="Add a special ability..."
                    />
                    <button
                      type="submit"
                      disabled={isBuildSaving || !specialDraft.trim()}
                      className="btn-primary w-full justify-center text-sm text-slate-950 disabled:opacity-50"
                    >
                      Add Ability
                    </button>
                  </form>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold">Custom Attacks</h3>
                  {customAttacks.length > 0 ? (
                    <div className="mb-3 space-y-2">
                      {customAttacks.map((attack, index) => (
                        <div
                          key={`${attack.name}-${index}`}
                          className="rounded-md border border-border/70 bg-background/35 p-2 text-sm"
                        >
                          <div className="space-y-2">
                            <input
                              value={(attackEdits[index] ?? attack).name}
                              onChange={(e) =>
                                setAttackEdits((edits) => ({
                                  ...edits,
                                  [index]: { ...(edits[index] ?? attack), name: e.target.value },
                                }))
                              }
                              disabled={isBuildSaving}
                              className="input w-full text-sm"
                              aria-label={`Edit attack ${index + 1} name`}
                              placeholder="Attack name"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                value={(attackEdits[index] ?? attack).bonus}
                                onChange={(e) =>
                                  setAttackEdits((edits) => ({
                                    ...edits,
                                    [index]: { ...(edits[index] ?? attack), bonus: e.target.value },
                                  }))
                                }
                                disabled={isBuildSaving}
                                className="input w-full text-sm"
                                aria-label={`Edit attack ${index + 1} bonus`}
                                placeholder="+7 to hit"
                              />
                              <input
                                value={(attackEdits[index] ?? attack).damage}
                                onChange={(e) =>
                                  setAttackEdits((edits) => ({
                                    ...edits,
                                    [index]: {
                                      ...(edits[index] ?? attack),
                                      damage: e.target.value,
                                    },
                                  }))
                                }
                                disabled={isBuildSaving}
                                className="input w-full text-sm"
                                aria-label={`Edit attack ${index + 1} damage`}
                                placeholder="1d8 slashing"
                              />
                            </div>
                            <input
                              value={(attackEdits[index] ?? attack).traits}
                              onChange={(e) =>
                                setAttackEdits((edits) => ({
                                  ...edits,
                                  [index]: { ...(edits[index] ?? attack), traits: e.target.value },
                                }))
                              }
                              disabled={isBuildSaving}
                              className="input w-full text-sm"
                              aria-label={`Edit attack ${index + 1} traits`}
                              placeholder="agile, finesse, magical"
                            />
                          </div>
                          <div className="mt-2 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => editCustomAttack(index)}
                              disabled={
                                isBuildSaving || !(attackEdits[index] ?? attack).name.trim()
                              }
                              className="btn-primary px-3 py-1.5 text-xs text-slate-950 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCustomAttack(index)}
                              disabled={isBuildSaving}
                              className="btn-outline px-3 py-1.5 text-xs text-destructive hover:bg-destructive hover:text-white disabled:opacity-50"
                              aria-label={`Remove custom attack ${attack.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mb-3 text-xs text-muted-foreground">
                      No custom attacks added yet.
                    </p>
                  )}
                  <form onSubmit={addCustomAttack} className="space-y-2">
                    <input
                      value={attackDraft.name}
                      onChange={(e) =>
                        setAttackDraft((draft) => ({ ...draft, name: e.target.value }))
                      }
                      disabled={isBuildSaving}
                      className="input w-full text-sm"
                      placeholder="Attack name"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={attackDraft.bonus}
                        onChange={(e) =>
                          setAttackDraft((draft) => ({ ...draft, bonus: e.target.value }))
                        }
                        disabled={isBuildSaving}
                        className="input w-full text-sm"
                        placeholder="+7 to hit"
                      />
                      <input
                        value={attackDraft.damage}
                        onChange={(e) =>
                          setAttackDraft((draft) => ({ ...draft, damage: e.target.value }))
                        }
                        disabled={isBuildSaving}
                        className="input w-full text-sm"
                        placeholder="1d8 slashing"
                      />
                    </div>
                    <input
                      value={attackDraft.traits}
                      onChange={(e) =>
                        setAttackDraft((draft) => ({ ...draft, traits: e.target.value }))
                      }
                      disabled={isBuildSaving}
                      className="input w-full text-sm"
                      placeholder="agile, finesse, magical"
                    />
                    <button
                      type="submit"
                      disabled={isBuildSaving || !attackDraft.name.trim()}
                      className="btn-primary w-full justify-center text-sm text-slate-950 disabled:opacity-50"
                    >
                      Add Attack
                    </button>
                  </form>
                </div>

                {buildError && <p className="text-xs text-destructive">{buildError}</p>}
              </div>
            )}
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading mb-2 text-4xl font-bold">My Characters</h1>
          <p className="text-muted-foreground">Your Pathfinder 2e characters</p>
        </div>
        <Link href="/characters/new" className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Import Character
        </Link>
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

      {!isLoading && !error && characters && characters.length > 0 && (
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
    </MainLayout>
  );
}
