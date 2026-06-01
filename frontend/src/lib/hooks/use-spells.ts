import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/lib/types/database.types";

type Spell = Tables<"spells">;
type SpellPage = { data: Spell[]; total: number; page: number; limit: number };

type SpellParams = {
  q?: string;
  tradition?: string;
  level?: number;
  is_focus?: boolean;
  include_homebrew?: boolean;
  page?: number;
  limit?: number;
};

export const spellKeys = {
  all: ["spells"] as const,
  list: (p: SpellParams) => [...spellKeys.all, "list", p] as const,
  detail: (id: string) => [...spellKeys.all, "detail", id] as const,
};

export function useSpells(params: SpellParams = {}, options?: { enabled?: boolean }) {
  return useQuery<SpellPage, Error>({
    queryKey: spellKeys.list(params),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params.q) qs.set("q", params.q);
      if (params.tradition) qs.set("tradition", params.tradition);
      if (params.level !== undefined) qs.set("level", String(params.level));
      if (params.is_focus !== undefined) qs.set("is_focus", String(params.is_focus));
      if (params.include_homebrew !== undefined) {
        qs.set("include_homebrew", String(params.include_homebrew));
      }
      if (params.page) qs.set("page", String(params.page));
      if (params.limit) qs.set("limit", String(params.limit));
      const res = await fetch(`/api/content/spells?${qs}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: options?.enabled !== false,
  });
}

export function useSpell(id: string, options?: { enabled?: boolean }) {
  return useQuery<Spell, Error>({
    queryKey: spellKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/content/spells/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: options?.enabled !== false && !!id,
  });
}
