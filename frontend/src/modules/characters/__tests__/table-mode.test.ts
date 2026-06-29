import { describe, expect, it } from "vitest";
import type { Tables } from "@/lib/types/database.types";
import { buildTableModeSheet } from "../table-mode";

function character(overrides: Partial<Tables<"characters">> = {}): Tables<"characters"> {
  return {
    id: "char-1",
    user_id: "user-1",
    name: "Lini",
    char_key: "lini",
    source: "native",
    status: "active",
    level: 3,
    ancestry_name: "Gnome",
    heritage_name: "Fey-Touched",
    class_name: "Druid",
    background_name: "Herbalist",
    pathbuilder_id: null,
    pathbuilder_data: {
      abilities: { str: 10, dex: 14, con: 12, int: 10, wis: 18, cha: 12 },
      attributes: { ancestryhp: 8, classhp: 8, bonushp: 0, bonushpPerLevel: 0 },
      proficiencies: { fortitude: 2, reflex: 1, will: 2, nature: 2, medicine: 1 },
      custom_attacks: [{ name: "Sling", bonus: "+8", damage: "1d6 bludgeoning", traits: "propulsive" }],
      equipment: [["Healer's tools", 1]],
    },
    current_hp: null,
    hero_points: 1,
    dying: 0,
    wounded: 0,
    experience: 0,
    currency: {},
    notes: null,
    overlay: {},
    variant_rules: {},
    art: null,
    discord_guild_id: null,
    is_public: false,
    public_share_id: "",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...overrides,
  };
}

describe("buildTableModeSheet", () => {
  it("builds vitals and rollable table data", () => {
    const sheet = buildTableModeSheet(character(), [
      { key: "max_hp", label: "Max HP", total: 35, formula: "", parts: [] },
      { key: "ac", label: "AC", total: 18, formula: "", parts: [] },
      { key: "perception", label: "Perception", total: 9, formula: "", parts: [] },
      { key: "fortitude", label: "Fortitude", total: 8, formula: "", parts: [] },
      { key: "reflex", label: "Reflex", total: 7, formula: "", parts: [] },
      { key: "will", label: "Will", total: 11, formula: "", parts: [] },
    ]);

    expect(sheet.maxHp).toBe(35);
    expect(sheet.currentHp).toBe(35);
    expect(sheet.ac).toBe(18);
    expect(sheet.saves.find((save) => save.key === "will")?.modifier).toBe(11);
    expect(sheet.skills.find((skill) => skill.key === "nature")?.modifier).toBe(11);
    expect(sheet.attacks[0].roll?.modifier).toBe(8);
    expect(sheet.inventory[0]).toEqual({ name: "Healer's tools", quantity: 1 });
  });
});
