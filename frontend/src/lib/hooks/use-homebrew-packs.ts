import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HomebrewEntry } from "@/lib/hooks/use-homebrew";

export type HomebrewPackVisibility = "private" | "shared" | "public";
export type HomebrewPackStatus = "draft" | "published";
export type HomebrewPackContentType = "spell" | "item";

export type HomebrewPack = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  visibility: HomebrewPackVisibility;
  status: HomebrewPackStatus;
  content_types: HomebrewPackContentType[];
  created_at: string;
  updated_at: string;
  entry_count?: number;
};

export type HomebrewPackEntry = {
  id: string;
  pack_id: string;
  homebrew_entry_id: string;
  sort_order: number;
  notes: string | null;
  created_at: string;
  homebrew_entry: HomebrewEntry;
};

type PackListResult = {
  data: HomebrewPack[];
  total: number | null;
};

type PackDetailResult = {
  data: HomebrewPack;
  entries: HomebrewPackEntry[];
  canWrite: boolean;
};

type PackPayload = {
  title: string;
  description?: string | null;
  cover_image_url?: string | null;
  visibility?: HomebrewPackVisibility;
  status?: HomebrewPackStatus;
  content_types?: HomebrewPackContentType[];
};

export const homebrewPackKeys = {
  all: ["homebrew-packs"] as const,
  list: (q?: string) => [...homebrewPackKeys.all, "list", q ?? ""] as const,
  detail: (id: string) => [...homebrewPackKeys.all, "detail", id] as const,
};

export function useHomebrewPacks(q = "") {
  return useQuery<PackListResult, Error>({
    queryKey: homebrewPackKeys.list(q),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      const res = await fetch(`/api/homebrew/packs?${qs}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });
}

export function useHomebrewPack(id: string, options?: { enabled?: boolean }) {
  return useQuery<PackDetailResult, Error>({
    queryKey: homebrewPackKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/homebrew/packs/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: options?.enabled !== false && !!id,
  });
}

export function useCreateHomebrewPack() {
  const qc = useQueryClient();
  return useMutation<{ data: HomebrewPack }, Error, PackPayload>({
    mutationFn: async (payload) => {
      const res = await fetch("/api/homebrew/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: homebrewPackKeys.all }),
  });
}

export function useUpdateHomebrewPack() {
  const qc = useQueryClient();
  return useMutation<{ data: HomebrewPack }, Error, { id: string } & Partial<PackPayload>>({
    mutationFn: async ({ id, ...payload }) => {
      const res = await fetch(`/api/homebrew/packs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: homebrewPackKeys.all });
      qc.invalidateQueries({ queryKey: homebrewPackKeys.detail(id) });
    },
  });
}

export function useDeleteHomebrewPack() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/homebrew/packs/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: homebrewPackKeys.all }),
  });
}

export function useAddHomebrewPackEntry(packId: string) {
  const qc = useQueryClient();
  return useMutation<{ data: HomebrewPackEntry }, Error, { homebrew_entry_id: string; notes?: string }>({
    mutationFn: async (payload) => {
      const res = await fetch(`/api/homebrew/packs/${packId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: homebrewPackKeys.detail(packId) }),
  });
}

export function useRemoveHomebrewPackEntry(packId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (entryId) => {
      const res = await fetch(`/api/homebrew/packs/${packId}/entries/${entryId}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: homebrewPackKeys.detail(packId) }),
  });
}
