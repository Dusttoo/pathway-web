import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Tables } from "@/lib/types/database.types";
import type { CharacterOverlay } from "@/lib/types/bot-integration";
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
  images: ["characters", "images"] as const,
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
    staleTime: Infinity,
  });
}

import type { NativeBuildInput } from "@/lib/types/character";

type PathbuilderImport = {
  source?: "pathbuilder";
  discord_guild_id?: string;
  pathbuilder_id?: number;
  pathbuilder_data?: unknown; // full { success, build } or just build
};

type NativeCharacterCreate = {
  source: "native";
  discord_guild_id?: string;
  native_build: NativeBuildInput;
  // Builder-v2 sends variant rules at the top level so the synthesizer
  // doesn't need to carry them through.
  variant_rules?: Record<string, boolean>;
};

type CharacterCreatePayload = PathbuilderImport | NativeCharacterCreate;

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  return useMutation<Character, Error, CharacterCreatePayload>({
    mutationFn: async (data) => {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.text();
        try {
          const { error } = JSON.parse(body);
          throw new Error(error ?? body);
        } catch {
          throw new Error(body);
        }
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: characterKeys.all }),
  });
}

export function useCharacterImages(options?: { enabled?: boolean }) {
  return useQuery<Record<string, string>, Error>({
    queryKey: characterKeys.images,
    queryFn: async () => {
      const res = await fetch("/api/characters/images");
      if (!res.ok) throw new Error(await res.text());
      const body = (await res.json()) as { images?: Record<string, string> };
      return body.images ?? {};
    },
    enabled: options?.enabled !== false,
    // Uploads/deletes invalidate this cache explicitly, so we can hold it for
    // a while without refetching on every navigation back to /characters.
    staleTime: 60_000,
  });
}

export function useUploadCharacterImage() {
  const queryClient = useQueryClient();
  return useMutation<string, Error, { characterId: string; file: File }>({
    mutationFn: async ({ characterId, file }) => {
      const formData = new FormData();
      formData.append("character_id", characterId);
      formData.append("file", file);

      const res = await fetch("/api/characters/images", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? "Image upload failed");
      }
      const body = (await res.json()) as { url?: string };
      if (!body.url) throw new Error("Image upload did not return a URL");
      return body.url;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: characterKeys.images }),
  });
}

export function useDeleteCharacterImage() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (characterId) => {
      const res = await fetch(
        `/api/characters/images?character_id=${encodeURIComponent(characterId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? "Could not remove image");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: characterKeys.images }),
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
            old ? { ...old, ...payload.new } : (payload.new as Character)
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  return query;
}

export type DiscordGuild = { id: string; name: string; icon: string | null };

export function useDiscordGuilds() {
  return useQuery<DiscordGuild[], Error>({
    queryKey: ["discord_guilds"],
    queryFn: async () => {
      // provider_token is only reliably available client-side in the Supabase
      // session — the SSR cookie doesn't carry it after the initial exchange.
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const providerToken = session?.provider_token;
      if (!providerToken) throw new Error("No Discord token — please log out and log back in.");

      const res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
        headers: { Authorization: `Bearer ${providerToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch servers from Discord.");
      const guilds: DiscordGuild[] = await res.json();
      return guilds.map((g) => ({ id: g.id, name: g.name, icon: g.icon }));
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

// ── Live stat mutations (HP, hero points, dying, wounded, overlay) ────────────

export type PatchCharacterPayload = {
  name?: string;
  ancestry_name?: string | null;
  heritage_name?: string | null;
  class_name?: string | null;
  background_name?: string | null;
  level?: number;
  status?: string;
  current_hp?: number;
  hero_points?: number;
  dying?: number;
  wounded?: number;
  overlay?: Partial<CharacterOverlay>;
  build_patch?: {
    name?: string;
    ancestry?: string | null;
    heritage?: string | null;
    class?: string | null;
    background?: string | null;
    level?: number;
    deity?: string | null;
    keyability?: string | null;
    languages?: string[];
    abilities?: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
    attributes?: { ancestryhp: number; classhp: number; bonushp: number; bonushpPerLevel: number };
    extras?: Record<string, unknown>;
    feats?: Array<[string, string | null, string | null, string | null]>;
    equipment?: Array<[string, number]>;
    proficiencies?: Record<string, number>;
    specials?: string[];
    custom_attacks?: {
      name: string;
      bonus: string;
      damage: string;
      traits: string;
      action?: string;
      category?: string;
      range?: string;
      notes?: string;
    }[];
  };
};

export function useUpdateCharacter(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Character, Error, PatchCharacterPayload, { prev: Character | undefined }>({
    mutationFn: async (body) => {
      const res = await fetch(`/api/characters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? res.statusText);
      }
      return res.json();
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: characterKeys.detail(id) });
      const prev = queryClient.getQueryData<Character>(characterKeys.detail(id));
      queryClient.setQueryData<Character>(characterKeys.detail(id), (old) => {
        if (!old) return old;
        const existingOverlay = ((old as unknown as { overlay: CharacterOverlay }).overlay ??
          {}) as CharacterOverlay;
        const overlayPatch = (vars.overlay ?? {}) as Partial<CharacterOverlay>;
        return {
          ...old,
          ...(vars.name !== undefined && { name: vars.name }),
          ...(vars.ancestry_name !== undefined && { ancestry_name: vars.ancestry_name }),
          ...(vars.heritage_name !== undefined && { heritage_name: vars.heritage_name }),
          ...(vars.class_name !== undefined && { class_name: vars.class_name }),
          ...(vars.background_name !== undefined && { background_name: vars.background_name }),
          ...(vars.level !== undefined && { level: vars.level }),
          ...(vars.status !== undefined && { status: vars.status }),
          ...(vars.current_hp !== undefined && { current_hp: vars.current_hp }),
          ...(vars.hero_points !== undefined && { hero_points: vars.hero_points }),
          ...(vars.dying !== undefined && { dying: vars.dying }),
          ...(vars.wounded !== undefined && { wounded: vars.wounded }),
          overlay: {
            ...existingOverlay,
            ...overlayPatch,
            daily: { ...existingOverlay.daily, ...overlayPatch.daily },
          },
        } as unknown as Character;
      });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(characterKeys.detail(id), context.prev);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(characterKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: characterKeys.all });
    },
  });
}

export function useSyncCharacter() {
  const queryClient = useQueryClient();
  return useMutation<Character, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/characters/${id}`, { method: "PUT" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(characterKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: characterKeys.all });
    },
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
