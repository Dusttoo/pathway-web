"use client";

import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/lib/types/database.types";

type AncestryRow = Tables<"ancestries">;
type ClassRow = Tables<"character_classes">;

type AncestryWithHeritages = AncestryRow & {
  heritages: Tables<"heritages">[];
  versatileHeritages: Tables<"heritages">[];
};

type PagedResult<T> = { data: T[]; total: number; page: number; limit: number };

const BUILDER_STALE = 30 * 60_000;

// ── Ancestries ────────────────────────────────────────────────────────────────

export const ancestryKeys = {
  all: ["ancestries"] as const,
  list: (q: string) => [...ancestryKeys.all, "list", q] as const,
  detail: (id: string) => [...ancestryKeys.all, "detail", id] as const,
};

export function useAncestries(q = "") {
  return useQuery<PagedResult<AncestryRow>, Error>({
    queryKey: ancestryKeys.list(q),
    queryFn: async () => {
      const qs = new URLSearchParams({ limit: "100" });
      if (q) qs.set("q", q);
      qs.set("include_homebrew", "true");
      const res = await fetch(`/api/content/ancestries?${qs}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    staleTime: BUILDER_STALE,
  });
}

export function useAncestryDetail(id: string | null) {
  return useQuery<AncestryWithHeritages, Error>({
    queryKey: ancestryKeys.detail(id ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/content/ancestries/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!id,
    staleTime: BUILDER_STALE,
  });
}

// ── Classes ───────────────────────────────────────────────────────────────────

export const classKeys = {
  all: ["character_classes"] as const,
  list: (q: string) => [...classKeys.all, "list", q] as const,
  detail: (id: string) => [...classKeys.all, "detail", id] as const,
};

export function useClasses(q = "") {
  return useQuery<PagedResult<ClassRow>, Error>({
    queryKey: classKeys.list(q),
    queryFn: async () => {
      const qs = new URLSearchParams({ limit: "100" });
      if (q) qs.set("q", q);
      qs.set("include_homebrew", "true");
      const res = await fetch(`/api/content/classes?${qs}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    staleTime: BUILDER_STALE,
  });
}

export function useClassDetail(id: string | null) {
  return useQuery<ClassRow, Error>({
    queryKey: classKeys.detail(id ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/content/classes/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!id,
    staleTime: BUILDER_STALE,
  });
}

// ── Backgrounds ───────────────────────────────────────────────────────────────

export const backgroundKeys = {
  all: ["backgrounds"] as const,
  list: (q: string) => [...backgroundKeys.all, "list", q] as const,
};

type BackgroundRow = {
  id: string;
  name: string;
  description: string | null;
  skill_proficiencies: unknown;
  attribute_boosts: unknown;
};

export function useBackgroundsList(q = "") {
  return useQuery<PagedResult<BackgroundRow>, Error>({
    queryKey: backgroundKeys.list(q),
    queryFn: async () => {
      const qs = new URLSearchParams({ limit: "500" }); // 219 official + room for homebrew
      if (q) qs.set("q", q);
      qs.set("include_homebrew", "true");
      const res = await fetch(`/api/content/backgrounds?${qs}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    staleTime: BUILDER_STALE,
  });
}
