import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Tables } from "@/lib/types/database.types";
import { createClient } from "@/lib/supabase/client";

type Character = Tables<"characters">;

type CharacterListParams = {
  guild_id?: string;
  status?: string;
};

export const characterKeys = {
  all: ["characters"] as const,
  list: (params: CharacterListParams) => [...characterKeys.all, "list", params] as const,
  detail: (id: string) => [...characterKeys.all, "detail", id] as const,
};

export function useCharacters(params: CharacterListParams = {}, options?: { enabled?: boolean }) {
  return useQuery<Character[], Error>({
    queryKey: characterKeys.list(params),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params.guild_id) qs.set("guild_id", params.guild_id);
      if (params.status) qs.set("status", params.status);
      const res = await fetch(`/api/characters?${qs}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: options?.enabled !== false,
  });
}

export function useCharacter(id: string, options?: { enabled?: boolean }) {
  return useQuery<Character, Error>({
    queryKey: characterKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/characters/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: options?.enabled !== false && !!id,
  });
}

type PathbuilderImport = {
  discord_guild_id: string;
  pathbuilder_id?: number;
  pathbuilder_data?: unknown;
};

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  return useMutation<Character, Error, PathbuilderImport>({
    mutationFn: async (data) => {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: characterKeys.all }),
  });
}

// Wraps useCharacter and adds a Supabase Realtime subscription so the
// character detail page updates live when the bot changes HP or overlay.
export function useCharacterLive(id: string, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const query = useCharacter(id, options);

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`character-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "characters", filter: `id=eq.${id}` },
        (payload) => {
          queryClient.setQueryData(characterKeys.detail(id), (old: Character | undefined) =>
            old ? { ...old, ...payload.new } : payload.new as Character
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, queryClient]);

  return query;
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/characters/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: characterKeys.all }),
  });
}
