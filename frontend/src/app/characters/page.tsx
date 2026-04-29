"use client";

import { MainLayout } from "@/components/layout";
import { useCharacters, useDeleteCharacter } from "@/lib/hooks/use-characters";
import { useAuth } from "@/lib/providers/auth-provider";
import type { Tables } from "@/lib/types/database.types";
import { Plus, Swords, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Character = Tables<"characters">;

function CharacterCard({
  character,
  onDelete,
  isDeleting,
}: {
  character: Character;
  onDelete: (id: string, name: string) => void;
  isDeleting: boolean;
}) {
  return (
    <div className="card p-6 hover:shadow-lg transition-all group relative">
      <Link
        href={`/characters/${character.id}`}
        className="absolute inset-0 z-0"
        aria-label={`View ${character.name}`}
      />

      <div className="mb-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-lg">{character.name}</p>
            <p className="text-sm text-muted-foreground">
              {[character.ancestry_name, character.heritage_name, character.class_name]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <span className="text-xs bg-muted px-2 py-1 rounded-full shrink-0 ml-2">
            Lvl {character.level}
          </span>
        </div>
        {character.background_name && (
          <p className="text-xs text-muted-foreground mt-1">{character.background_name} background</p>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
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

      <div className="flex items-center gap-2 relative z-10">
        <Link
          href={`/characters/${character.id}`}
          className="btn-primary flex-1 text-center text-sm"
        >
          View Sheet
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(character.id, character.name);
          }}
          disabled={isDeleting}
          className="btn-outline px-3 py-2 text-destructive hover:bg-destructive hover:text-white disabled:opacity-50"
          aria-label={`Delete ${character.name}`}
        >
          {isDeleting ? <div className="spinner w-4 h-4" /> : <Trash2 size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function CharactersPage() {
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: characters, isLoading, error } = useCharacters({}, { enabled: !!user });
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold mb-2">My Characters</h1>
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
        <div className="card p-6 bg-destructive/10 border-destructive">
          <p className="text-destructive font-semibold">Failed to load characters</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
      )}

      {!isLoading && !error && characters?.length === 0 && (
        <div className="card p-12 text-center">
          <Swords size={48} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="font-heading text-2xl font-bold mb-2">No Characters Yet</h2>
          <p className="text-muted-foreground mb-6">
            Import a character from Pathbuilder 2e to get started.
          </p>
          <Link href="/characters/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={20} />
            Import from Pathbuilder
          </Link>
        </div>
      )}

      {!isLoading && !error && characters && characters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onDelete={handleDelete}
              isDeleting={deletingId === character.id}
            />
          ))}
        </div>
      )}
    </MainLayout>
  );
}
