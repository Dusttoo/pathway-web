import { describe, expect, it } from "vitest";
import { DEFAULT_STATE, type BuilderState } from "@/components/characters/builder-v2/types";
import { buildProgressionSlots, progressionSummary } from "../progression";

function stateWith(patch: Partial<BuilderState>): BuilderState {
  return {
    ...DEFAULT_STATE,
    ...patch,
    variantRules: {
      ...DEFAULT_STATE.variantRules,
      ...patch.variantRules,
    },
    selectedFeats: patch.selectedFeats ?? DEFAULT_STATE.selectedFeats,
  };
}

describe("character progression plan", () => {
  it("marks future choices after the current level", () => {
    const slots = buildProgressionSlots(stateWith({ level: 1 }));
    const levelFiveAbility = slots.find((slot) => slot.id === "ability-5");

    expect(levelFiveAbility?.status).toBe("future");
    expect(progressionSummary(slots)).toMatchObject({
      active: slots.filter((slot) => slot.status !== "future").length,
    });
  });

  it("records selected feats as completed choices", () => {
    const slots = buildProgressionSlots(
      stateWith({
        level: 5,
        selectedFeats: [
          {
            feat_id: "power-attack",
            feat_name: "Power Attack",
            feat_slot: "class",
            level_acquired: 2,
          },
        ],
      })
    );

    expect(slots.find((slot) => slot.id === "class-feat-2")).toMatchObject({
      status: "done",
      detail: "Power Attack",
    });
  });

  it("adds variant-rule slots only when enabled", () => {
    const baseSlots = buildProgressionSlots(stateWith({ level: 2 }));
    const variantSlots = buildProgressionSlots(
      stateWith({
        level: 2,
        variantRules: {
          freeArchetype: true,
        },
      })
    );

    expect(baseSlots.some((slot) => slot.id === "free-archetype-2")).toBe(false);
    expect(variantSlots.find((slot) => slot.id === "free-archetype-2")).toMatchObject({
      label: "Free Archetype Feat",
      status: "todo",
    });
  });
});
