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
  specials?: unknown;
  custom_attacks?: unknown;
  build?: CharacterBuild;
};

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
                                  [index]: { ...(edits[index] ?? attack), damage: e.target.value },
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
                            disabled={isBuildSaving || !(attackEdits[index] ?? attack).name.trim()}
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
                  <p className="mb-3 text-xs text-muted-foreground">No custom attacks added yet.</p>
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
