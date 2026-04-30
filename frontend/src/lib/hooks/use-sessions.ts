"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Encounter, EncounterEvent } from "@/lib/types/bot-integration";

export const sessionKeys = {
  past: ["sessions", "past"] as const,
  detail: (id: string) => ["sessions", "detail", id] as const,
  events: (id: string) => ["sessions", "events", id] as const,
};

async function fetchPastEncounters(): Promise<Encounter[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("encounters")
    .select("*")
    .eq("status", "ended")
    .order("started_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as Encounter[];
}

async function fetchEncounterById(id: string): Promise<Encounter | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("encounters")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Encounter | null;
}

async function fetchEncounterEvents(encounterId: string): Promise<EncounterEvent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("encounter_events")
    .select("*")
    .eq("encounter_id", encounterId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EncounterEvent[];
}

export function usePastEncounters() {
  return useQuery<Encounter[], Error>({
    queryKey: sessionKeys.past,
    queryFn: fetchPastEncounters,
    staleTime: 60_000,
  });
}

export function useEncounterDetail(id: string) {
  return useQuery<Encounter | null, Error>({
    queryKey: sessionKeys.detail(id),
    queryFn: () => fetchEncounterById(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useEncounterEvents(encounterId: string) {
  return useQuery<EncounterEvent[], Error>({
    queryKey: sessionKeys.events(encounterId),
    queryFn: () => fetchEncounterEvents(encounterId),
    enabled: !!encounterId,
    staleTime: 60_000,
  });
}
