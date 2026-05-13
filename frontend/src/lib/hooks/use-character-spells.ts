import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/lib/types/database.types";

type Spell = Tables<"spells">;
export type CharacterKnownSpell = {
  id: string;
  spell_id: string;
  tradition: "arcane" | "divine" | "occult" | "primal";
  rank: number;
  spell_source: "spellbook" | "repertoire" | "innate" | "focus" | "staff" | "scroll";
  is_signature: boolean;
  notes: string | null;
  spell: Spell;
};

export const characterSpellKeys = {
  known: (characterId: string) => ["character-known-spells", characterId] as const,
};

export function useCharacterKnownSpells(characterId: string, options?: { enabled?: boolean }) {
  return useQuery<{ data: CharacterKnownSpell[] }, Error>({
    queryKey: characterSpellKeys.known(characterId),
    queryFn: async () => {
      const res = await fetch(`/api/characters/${characterId}/known-spells`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: options?.enabled !== false && !!characterId,
  });
}

export function useAddKnownSpell(characterId: string) {
  const qc = useQueryClient();
  return useMutation<
    CharacterKnownSpell,
    Error,
    {
      spell_id: string;
      tradition: string;
      rank?: number;
      spell_source?: string;
      is_signature?: boolean;
      notes?: string | null;
    }
  >({
    mutationFn: async (input) => {
      const res = await fetch(`/api/characters/${characterId}/known-spells`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: characterSpellKeys.known(characterId) });
    },
  });
}

export function useRemoveKnownSpell(characterId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (rowId) => {
      const res = await fetch(`/api/characters/${characterId}/known-spells/${rowId}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: characterSpellKeys.known(characterId) });
    },
  });
}
