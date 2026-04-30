import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Tables } from "@/lib/types/database.types";
import { createClient } from "@/lib/supabase/client";

type CharacterNotesRow = Tables<"character_notes">;

export type BotNote = {
  id: number;
  category: string;
  text: string;
  pinned: boolean;
  createdAt: string;
  editedAt: string | null;
  authorId: string;
  authorName: string;
};

export const NOTE_CATEGORIES = {
  npcs:           { label: "NPCs",          icon: "🧑" },
  locations:      { label: "Locations",     icon: "🗺️" },
  "plot-threads": { label: "Plot Threads",  icon: "🎭" },
  influence:      { label: "Influence",     icon: "🤝" },
  items:          { label: "Items",         icon: "💎" },
} as const;

export const NOTE_CATEGORY_ORDER = ["npcs", "locations", "plot-threads", "influence", "items"] as const;

export const notesKeys = {
  all: ["character_notes"] as const,
  forChar: (charKey: string) => [...notesKeys.all, charKey] as const,
};

export function useCharacterNotes(charKey: string | null | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery<CharacterNotesRow | null, Error>({
    queryKey: notesKeys.forChar(charKey ?? ""),
    queryFn: async () => {
      if (!charKey) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("character_notes")
        .select("*")
        .eq("char_key", charKey)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!charKey,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!charKey) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`character-notes-${charKey}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "character_notes", filter: `char_key=eq.${charKey}` },
        (payload) => {
          queryClient.setQueryData(
            notesKeys.forChar(charKey),
            (old: CharacterNotesRow | null | undefined) =>
              old ? { ...old, ...payload.new } : (payload.new as CharacterNotesRow)
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [charKey, queryClient]);

  return query;
}
