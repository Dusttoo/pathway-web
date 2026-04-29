import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/lib/types/database.types";

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
