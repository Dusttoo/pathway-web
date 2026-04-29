import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/lib/types/database.types";

type Background = Tables<"backgrounds">;
type BackgroundPage = { data: Background[]; total: number; page: number; limit: number };

type BackgroundParams = { q?: string; page?: number; limit?: number };

export function useBackgrounds(params: BackgroundParams = {}, options?: { enabled?: boolean }) {
  return useQuery<BackgroundPage, Error>({
    queryKey: ["backgrounds", "list", params],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params.q) qs.set("q", params.q);
      if (params.page) qs.set("page", String(params.page));
      if (params.limit) qs.set("limit", String(params.limit));
      const res = await fetch(`/api/content/backgrounds?${qs}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: options?.enabled !== false,
  });
}

export function useBackground(id: string, options?: { enabled?: boolean }) {
  return useQuery<Background, Error>({
    queryKey: ["backgrounds", "detail", id],
    queryFn: async () => {
      const res = await fetch(`/api/content/backgrounds/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: options?.enabled !== false && !!id,
  });
}
