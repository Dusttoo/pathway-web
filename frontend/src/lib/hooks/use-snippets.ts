import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/lib/types/database.types";
import { createClient } from "@/lib/supabase/client";

type UserSnippetsRow = Tables<"user_snippets">;
type GuildSnippetsRow = Tables<"guild_snippets">;

export type SnippetMap = Record<string, string>;

export const snippetKeys = {
  all: ["snippets"] as const,
  user: () => [...snippetKeys.all, "user"] as const,
  guild: (guildId: string) => [...snippetKeys.all, "guild", guildId] as const,
};

export function useUserSnippets() {
  return useQuery<UserSnippetsRow | null, Error>({
    queryKey: snippetKeys.user(),
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_snippets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}

export function useGuildSnippets(guildId: string | null | undefined) {
  return useQuery<GuildSnippetsRow | null, Error>({
    queryKey: snippetKeys.guild(guildId ?? ""),
    queryFn: async () => {
      if (!guildId) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("guild_snippets")
        .select("*")
        .eq("discord_guild_id", guildId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!guildId,
    staleTime: 30_000,
  });
}
