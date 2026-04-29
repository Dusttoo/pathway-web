import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/lib/types/database.types";

type Monster = Tables<"monsters">;
type MonsterPage = { data: Monster[]; total: number; page: number; limit: number };

type MonsterParams = {
  q?: string;
  level?: number;
  creature_type?: string;
  is_companion?: boolean;
  page?: number;
  limit?: number;
};

export function useMonsters(params: MonsterParams = {}, options?: { enabled?: boolean }) {
  return useQuery<MonsterPage, Error>({
    queryKey: ["monsters", "list", params],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params.q) qs.set("q", params.q);
      if (params.level !== undefined) qs.set("level", String(params.level));
      if (params.creature_type) qs.set("creature_type", params.creature_type);
      if (params.is_companion !== undefined) qs.set("is_companion", String(params.is_companion));
      if (params.page) qs.set("page", String(params.page));
      if (params.limit) qs.set("limit", String(params.limit));
      const res = await fetch(`/api/content/monsters?${qs}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: options?.enabled !== false,
  });
}

export function useMonster(id: string, options?: { enabled?: boolean }) {
  return useQuery<Monster, Error>({
    queryKey: ["monsters", "detail", id],
    queryFn: async () => {
      const res = await fetch(`/api/content/monsters/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: options?.enabled !== false && !!id,
  });
}
