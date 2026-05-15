"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ── Types ─────────────────────────────────────────────────────────────────────

export type HomebrewHeritage = { name: string; description?: string };

export type HomebrewAncestryInput = {
  name: string;
  ancestry_hp: number;
  speed: number;
  size: string;
  description?: string;
  heritages: HomebrewHeritage[];
};

export type HomebrewClassInput = {
  name: string;
  class_hp: number;
  key_attribute: string[];
  is_spellcaster: boolean;
  spellcasting_ability?: string;
  trained_skill_count: number;
  class_trained_skills: string[];
  class_lore_skills: string[];
  class_proficiencies: Record<string, number>;
  spellcasting_type?: "prepared" | "spontaneous";
  spellcasting_tradition?: "arcane" | "divine" | "occult" | "primal";
  cantrips_known?: number;
  focus_points?: number;
  spell_slot_progression?: Record<string, number[]>;
  spells_known_progression?: Record<string, number[]>;
  description?: string;
};

export type HomebrewBackgroundInput = {
  name: string;
  description?: string;
  trained_skill?: string;
  lore_skill?: string;
};

// ── Keys ──────────────────────────────────────────────────────────────────────

const hbKeys = {
  ancestries: ["homebrew-ancestries"] as const,
  classes: ["homebrew-classes"] as const,
  backgrounds: ["homebrew-backgrounds"] as const,
};

// ── Ancestries ────────────────────────────────────────────────────────────────

export function useHomebrewAncestries() {
  return useQuery({
    queryKey: hbKeys.ancestries,
    queryFn: async () => {
      const res = await fetch("/api/homebrew/ancestries");
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Record<string, unknown>[]>;
    },
  });
}

export function useCreateHomebrewAncestry() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, HomebrewAncestryInput>({
    mutationFn: async (input) => {
      const res = await fetch("/api/homebrew/ancestries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hbKeys.ancestries });
      qc.invalidateQueries({ queryKey: ["ancestries"] });
    },
  });
}

export function useUpdateHomebrewAncestry() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, HomebrewAncestryInput & { id: string }>({
    mutationFn: async ({ id, ...input }) => {
      const res = await fetch(`/api/homebrew/ancestries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hbKeys.ancestries });
      qc.invalidateQueries({ queryKey: ["ancestries"] });
    },
  });
}

export function useDeleteHomebrewAncestry() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch("/api/homebrew/ancestries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hbKeys.ancestries });
      qc.invalidateQueries({ queryKey: ["ancestries"] });
    },
  });
}

// ── Classes ───────────────────────────────────────────────────────────────────

export function useHomebrewClasses() {
  return useQuery({
    queryKey: hbKeys.classes,
    queryFn: async () => {
      const res = await fetch("/api/homebrew/classes");
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Record<string, unknown>[]>;
    },
  });
}

export function useCreateHomebrewClass() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, HomebrewClassInput>({
    mutationFn: async (input) => {
      const res = await fetch("/api/homebrew/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hbKeys.classes });
      qc.invalidateQueries({ queryKey: ["character_classes"] });
    },
  });
}

export function useUpdateHomebrewClass() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, HomebrewClassInput & { id: string }>({
    mutationFn: async ({ id, ...input }) => {
      const res = await fetch(`/api/homebrew/classes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hbKeys.classes });
      qc.invalidateQueries({ queryKey: ["character_classes"] });
    },
  });
}

export function useDeleteHomebrewClass() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch("/api/homebrew/classes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hbKeys.classes });
      qc.invalidateQueries({ queryKey: ["character_classes"] });
    },
  });
}

// ── Backgrounds ───────────────────────────────────────────────────────────────

export function useHomebrewBackgrounds() {
  return useQuery({
    queryKey: hbKeys.backgrounds,
    queryFn: async () => {
      const res = await fetch("/api/homebrew/backgrounds");
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Record<string, unknown>[]>;
    },
  });
}

export function useCreateHomebrewBackground() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, HomebrewBackgroundInput>({
    mutationFn: async (input) => {
      const res = await fetch("/api/homebrew/backgrounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hbKeys.backgrounds });
      qc.invalidateQueries({ queryKey: ["backgrounds"] });
    },
  });
}

export function useUpdateHomebrewBackground() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, HomebrewBackgroundInput & { id: string }>({
    mutationFn: async ({ id, ...input }) => {
      const res = await fetch(`/api/homebrew/backgrounds/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hbKeys.backgrounds });
      qc.invalidateQueries({ queryKey: ["backgrounds"] });
    },
  });
}

export function useDeleteHomebrewBackground() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch("/api/homebrew/backgrounds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hbKeys.backgrounds });
      qc.invalidateQueries({ queryKey: ["backgrounds"] });
    },
  });
}
