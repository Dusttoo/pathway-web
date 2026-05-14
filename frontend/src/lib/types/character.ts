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
  ancestry_hp?: number;
  ancestry_speed?: number;
  ancestry_size?: string;
  ancestry_boost_mode?: "printed" | "remaster";
  ancestry_boosts?: string[];
  ancestry_flaws?: string[];
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
  custom_specials?: string[];
  custom_attacks?: { name: string; bonus: string; damage: string; traits: string }[];
  deity: string;
  languages: string[];
  money: { cp: number; sp: number; gp: number; pp: number };
  // Equipment selected at character creation. Stored as [name, qty] tuples
  // inside pathbuilder_data.build.equipment so the bot can read it directly.
  equipment_refs?: { name: string; quantity: number }[];
  // Companion bookkeeping — currently free-form; future iteration ties into
  // the companions table.
  companion?: { type: string; name: string; subtype: string };
  // Narrative + physical — stored on pathbuilder_data.build.description /
  // .personality so the sheet can render them, plus art on characters.art.
  description?: {
    height?: string;
    weight?: string;
    eyes?: string;
    hair?: string;
    skin?: string;
    distinguishing_features?: string;
    portrait_url?: string;
  };
  personality?: {
    traits?: string;
    ideals?: string;
    bonds?: string;
    flaws?: string;
    backstory?: string;
  };
};

export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}
