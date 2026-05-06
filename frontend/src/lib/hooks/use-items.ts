import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/lib/types/database.types";

type Item = Tables<"items">;
type ItemPage = { data: Item[]; total: number; page: number; limit: number };

type ItemParams = {
  q?: string;
  item_type?: string;
  level?: number;
  page?: number;
  limit?: number;
};

export const itemKeys = {
  all:    ["items"] as const,
  list:   (p: ItemParams) => [...itemKeys.all, "list", p] as const,
  detail: (id: string)    => [...itemKeys.all, "detail", id] as const,
};

export function useItems(params: ItemParams = {}, options?: { enabled?: boolean }) {
  return useQuery<ItemPage, Error>({
    queryKey: itemKeys.list(params),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params.q)                          qs.set("q",         params.q);
      if (params.item_type)                  qs.set("item_type", params.item_type);
      if (params.level !== undefined)        qs.set("level",     String(params.level));
      if (params.page  !== undefined)        qs.set("page",      String(params.page));
      if (params.limit !== undefined)        qs.set("limit",     String(params.limit));
      const res = await fetch(`/api/content/items?${qs}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: options?.enabled !== false,
  });
}

export function useItem(id: string, options?: { enabled?: boolean }) {
  return useQuery<Item, Error>({
    queryKey: itemKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/content/items/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: options?.enabled !== false && !!id,
  });
}
