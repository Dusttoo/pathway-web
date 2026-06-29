import type { StepKey } from "./steps";
import type { BuilderState } from "./types";

// Gentle, NON-blocking nudges for Beginner Mode. Each returns a short
// friendly note when the current step still has an obvious choice left, or
// null when it looks complete. These never prevent moving on — they just tell
// a new player what's usually expected so nothing is silently skipped.
export function stepHint(key: StepKey, state: BuilderState): string | null {
  switch (key) {
    case "start":
      return state.name.trim() ? null : "Add a character name to continue.";
    case "ancestry":
      return state.ancestryId ? null : "Choose an ancestry to keep going.";
    case "heritage":
      return state.heritageId ? null : "Pick a heritage for your ancestry.";
    case "class":
      if (!state.classId) return "Choose a class — this shapes the rest of your character.";
      if (!state.keyability) return "Pick your key attribute for this class.";
      return null;
    case "background":
      return state.backgroundId ? null : "Choose a background.";
    case "abilities": {
      const c = state.abilityBoostChoices;
      const levelsDone = Object.values(c.levelBoosts ?? {}).every((picks) => picks.length === 4);
      const done =
        c.free.length === 4 && c.background.length === 2 && c.ancestryFree.length >= 2 && levelsDone;
      return done ? null : "You still have ability boosts to assign.";
    }
    case "skills":
      return state.trainedSkills.length > 0 ? null : "Pick the skills your character is trained in.";
    case "equipment": {
      const hasMoney = Object.values(state.money).some((amount) => amount > 0);
      return state.selectedItems.length > 0 || hasMoney
        ? null
        : "Add some starting gear, or keep your starting gold.";
    }
    case "spells":
      // This step only renders for spellcasters, so empty means none chosen.
      return state.selectedSpells.length > 0 ? null : "Choose your starting cantrips and spells.";
    default:
      return null;
  }
}
