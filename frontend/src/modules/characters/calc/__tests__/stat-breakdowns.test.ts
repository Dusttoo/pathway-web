import { describe, expect, it } from "vitest";
import type { Tables } from "@/lib/types/database.types";
import { buildCharacterStatBreakdowns } from "../stat-breakdowns";

function characterWith(build: Record<string, unknown>): Tables<"characters"> {
  return {
    id: "character-1",
    user_id: "user-1",
    discord_guild_id: null,
    name: "Aurelia",
    ancestry_name: "Human",
    heritage_name: null,
    class_name: "Fighter",
    background_name: null,
    level: 5,
    experience: 0,
    pathbuilder_id: null,
    pathbuilder_data: build,
    hero_points: 1,
    dying: 0,
    wounded: 0,
    currency: {},
    status: "active",
    notes: null,
    created_at: "2026-06-29T00:00:00.000Z",
    updated_at: "2026-06-29T00:00:00.000Z",
    char_key: "aurelia",
    current_hp: null,
    is_public: false,
    overlay: {},
    public_share_id: "share",
    source: "native",
  };
}

describe("character stat breakdowns", () => {
  it("explains HP, AC, class DC, perception, and saves", () => {
    const breakdowns = buildCharacterStatBreakdowns(
      characterWith({
        abilities: { str: 18, dex: 16, con: 14, int: 10, wis: 12, cha: 10 },
        attributes: { ancestryhp: 8, classhp: 10, bonushp: 0, bonushpPerLevel: 0 },
        keyability: "str",
        proficiencies: {
          unarmored: 2,
          class_dc: 2,
          perception: 2,
          fortitude: 4,
          reflex: 2,
          will: 0,
        },
      })
    );

    expect(breakdowns.find((stat) => stat.key === "max_hp")?.total).toBe(68);
    expect(breakdowns.find((stat) => stat.key === "ac")?.total).toBe(22);
    expect(breakdowns.find((stat) => stat.key === "class_dc")?.total).toBe(23);
    expect(breakdowns.find((stat) => stat.key === "perception")?.total).toBe(10);
    expect(breakdowns.find((stat) => stat.key === "fortitude")?.total).toBe(15);
  });

  it("uses direct imported totals when present", () => {
    const ac = buildCharacterStatBreakdowns(
      characterWith({
        ac: 31,
        abilities: { dex: 10, con: 10, wis: 10 },
        proficiencies: {},
      })
    ).find((stat) => stat.key === "ac");

    expect(ac).toMatchObject({
      total: 31,
      directSource: "Imported total",
    });
  });

  it("applies enabled manual overrides", () => {
    const ac = buildCharacterStatBreakdowns(
      characterWith({
        abilities: { dex: 10, con: 10, wis: 10 },
        proficiencies: {},
      }),
      [
        {
          stat_key: "ac",
          value: { total: 27 },
          reason: "Table ruling while shield is raised",
          enabled: true,
        },
      ]
    ).find((stat) => stat.key === "ac");

    expect(ac).toMatchObject({
      total: 27,
      override: {
        value: 27,
        reason: "Table ruling while shield is raised",
      },
    });
  });
});
