import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/lib/types/database.types";

type Feat = Tables<"feats">;
type CharacterFeat = {
  id: string;
  feat_id: string;
  feat_slot: string;
  level_acquired: number;
  selection: Record<string, unknown>;
  notes: string | null;
  feat: Feat;
};
type FeatPage = { data: Feat[]; total: number; page: number; limit: number };

export type FeatParams = {
  q?: string;
  feat_type?: string;
  level?: number;
  level_min?: number;
  level_max?: number;
  rarity?: string;
  trait?: string[];
  class?: string;
  ancestry?: string;
  heritage?: string;
  archetype?: string;
  page?: number;
  limit?: number;
};

export const featKeys = {
  all: ["feats"] as const,
  list: (p: FeatParams) => [...featKeys.all, "list", p] as const,
  detail: (id: string) => [...featKeys.all, "detail", id] as const,
  character: (characterId: string) => ["character-feats", characterId] as const,
};

function buildQs(params: FeatParams): URLSearchParams {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.feat_type) qs.set("feat_type", params.feat_type);
  if (params.level !== undefined) qs.set("level", String(params.level));
  if (params.level_min !== undefined) qs.set("level_min", String(params.level_min));
  if (params.level_max !== undefined) qs.set("level_max", String(params.level_max));
  if (params.rarity) qs.set("rarity", params.rarity);
  if (params.class) qs.set("class", params.class);
  if (params.ancestry) qs.set("ancestry", params.ancestry);
  if (params.heritage) qs.set("heritage", params.heritage);
  if (params.archetype) qs.set("archetype", params.archetype);
  if (params.trait) for (const t of params.trait) qs.append("trait", t);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  return qs;
}

export function useFeats(params: FeatParams = {}, options?: { enabled?: boolean }) {
  return useQuery<FeatPage, Error>({
    queryKey: featKeys.list(params),
    queryFn: async () => {
      const res = await fetch(`/api/content/feats?${buildQs(params)}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCharacterFeats(characterId: string, options?: { enabled?: boolean }) {
  return useQuery<{ data: CharacterFeat[] }, Error>({
    queryKey: featKeys.character(characterId),
    queryFn: async () => {
      const res = await fetch(`/api/characters/${characterId}/feats`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: options?.enabled !== false && !!characterId,
  });
}

export function useAddCharacterFeat(characterId: string) {
  const qc = useQueryClient();
  return useMutation<
    CharacterFeat,
    Error,
    {
      feat_id: string;
      feat_slot: string;
      level_acquired?: number;
      selection?: Record<string, unknown>;
      notes?: string | null;
    }
  >({
    mutationFn: async (input) => {
      const res = await fetch(`/api/characters/${characterId}/feats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: featKeys.character(characterId) });
    },
  });
}

export function useRemoveCharacterFeat(characterId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (rowId) => {
      const res = await fetch(`/api/characters/${characterId}/feats/${rowId}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: featKeys.character(characterId) });
    },
  });
}
