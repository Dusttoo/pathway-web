import type { Tables } from "./database.types";

export type Character = Tables<"characters">;

export type NativeBuildInput = {
  name: string;
  level: number;
  alignment: string;
  gender: string;
  age: string;
  ancestry: string;
  ancestry_id: string;
  heritage: string;
  class: string;
  class_id: string;
  background: string;
  keyability: string;
  lore: string;
  abilities: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  trained_skills: string[];
  background_trained_skill?: string; // e.g. "athletics" — auto-granted by background
  additional_skills?: { name: string; rank: number }[];
  custom_feats?: { name: string; featType: string; level: number }[];
  deity: string;
  languages: string[];
  money: { cp: number; sp: number; gp: number; pp: number };
};

export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}
