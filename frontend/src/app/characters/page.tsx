"use client";

import { MainLayout } from "@/components/layout";
import {
  useCharacterImages,
  useCharacters,
  useDeleteCharacter,
  useDeleteCharacterImage,
  useUploadCharacterImage,
} from "@/lib/hooks/use-characters";
import { useAuth } from "@/lib/providers/auth-provider";
import type { CharacterOverlay } from "@/lib/types/bot-integration";
import type { Json, Tables } from "@/lib/types/database.types";
import { ImagePlus, Loader2, Plus, Swords, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

type Character = Tables<"characters">;

const PATHWAY_AVATAR = "/images/pathway-avatar.png";

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
  return storedImage ?? getCustomCharacterImage(character) ?? getPathbuilderCharacterImage(character);
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

  const subtitle = [
    character.ancestry_name,
    character.heritage_name,
    character.class_name,
  ]
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

  const isBusy =
    isUploading || uploadCharacterImage.isPending || deleteCharacterImage.isPending;

  return (
    <div className="card group relative overflow-hidden transition-all hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={`Image for ${character.name}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
            {isBusy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ImagePlus size={16} />
            )}
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
          <p className="relative z-10 mt-2 text-xs text-destructive">
            {uploadError}
          </p>
        )}
      </div>
    </div>
  );
}

export default function CharactersPage() {
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: characters, isLoading, error } = useCharacters(
    {},
    { enabled: !!user },
  );
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
