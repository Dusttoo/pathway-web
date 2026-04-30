import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/lib/types/database.types";
import { createClient } from "@/lib/supabase/client";

type GuildStateRow = Tables<"guild_state">;

export type CalendarSnapshot = {
  year: number;
  month: number;
  day: number;
  setting: string;
  weekday: string;
  monthName: string;
  season: string;
  seasonEmoji: string;
  description: string;
  holidays: string[];
  nextHoliday: { name: string; daysAway: number; dateString: string } | null;
  updatedAt: string;
};

export type WeatherSnapshot = {
  climate: string;
  season: string;
  day: number;
  temperatureF: number;
  temperatureCategory: string;
  effectiveTemperatureCategory: string;
  precipitation: string;
  wind: string;
  fog: string;
  soaked: boolean;
  description: string;
  updatedAt: string;
};

export const guildStateKeys = {
  all: ["guild_state"] as const,
  forGuild: (guildId: string) => [...guildStateKeys.all, guildId] as const,
};

export function useGuildState(guildId: string | null | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery<GuildStateRow | null, Error>({
    queryKey: guildStateKeys.forGuild(guildId ?? ""),
    queryFn: async () => {
      if (!guildId) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("guild_state")
        .select("*")
        .eq("discord_guild_id", guildId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!guildId,
    staleTime: 30_000,
  });

  // Live updates when the bot pushes a calendar or weather change
  useEffect(() => {
    if (!guildId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`guild-state-${guildId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "guild_state",
          filter: `discord_guild_id=eq.${guildId}`,
        },
        (payload) => {
          queryClient.setQueryData(
            guildStateKeys.forGuild(guildId),
            (old: GuildStateRow | null | undefined) =>
              old ? { ...old, ...payload.new } : (payload.new as GuildStateRow)
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [guildId, queryClient]);

  return {
    ...query,
    calendar: (query.data?.calendar as unknown as CalendarSnapshot) ?? null,
    weather: (query.data?.weather as unknown as WeatherSnapshot) ?? null,
  };
}
