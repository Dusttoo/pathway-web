import { describe, expect, it } from "vitest";
import { DEFAULT_STATE, type BuilderState } from "@/components/characters/builder-v2/types";
import { abilityMod, buildSheetPreview, profBonus, profRank, signed } from "../builder-preview";

function stateWith(patch: Partial<BuilderState>): BuilderState {
  return {
    ...DEFAULT_STATE,
    ...patch,
    abilities: {
      ...DEFAULT_STATE.abilities,
      ...patch.abilities,
    },
    classInitialProfs: {
      ...DEFAULT_STATE.classInitialProfs,
      ...patch.classInitialProfs,
    },
  };
}

describe("builder sheet preview calculations", () => {
  it("formats core PF2e ability and proficiency math", () => {
    expect(abilityMod(8)).toBe(-1);
    expect(abilityMod(10)).toBe(0);
    expect(abilityMod(18)).toBe(4);
    expect(signed(3)).toBe("+3");
    expect(signed(-1)).toBe("-1");
    expect(profRank(6)).toBe(3);
    expect(profRank(99)).toBe(4);
    expect(profBonus(0, 5)).toBe(0);
    expect(profBonus(2, 5)).toBe(9);
  });

  it("builds the sidebar preview from level, abilities, and class proficiencies", () => {
    const preview = buildSheetPreview(
      stateWith({
        level: 5,
        ancestryHp: 8,
        classHp: 10,
        keyability: "str",
        abilities: {
          str: 18,
          dex: 16,
          con: 14,
        },
        classInitialProfs: {
          unarmored: 2,
          class_dc: 2,
          fortitude: 4,
          reflex: 2,
          will: 0,
        },
      })
    );

    expect(preview).toMatchObject({
      level: 5,
      maxHp: 68,
      ac: 22,
      classDc: 23,
    });
    expect(preview.saves).toEqual([
      { key: "fortitude", label: "Fortitude", rank: 4, total: 15 },
      { key: "reflex", label: "Reflex", rank: 2, total: 12 },
      { key: "will", label: "Will", rank: 0, total: 0 },
    ]);
  });

  it("bounds preview level to the supported character range", () => {
    expect(buildSheetPreview(stateWith({ level: -3 })).level).toBe(1);
    expect(buildSheetPreview(stateWith({ level: 999 })).level).toBe(20);
  });
});
