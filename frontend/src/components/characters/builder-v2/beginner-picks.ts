// Curated "great for a first character" picks, surfaced in Beginner Mode so a
// new player isn't paralyzed by the full A–Z list. Keys are lowercased names;
// values are one short, jargon-free reason the pick is friendly to start with.
// These are recommendations only — every option remains selectable.

export const BEGINNER_ANCESTRIES: Record<string, string> = {
  human: "Flexible and beginner-proof — boost any two abilities and get a bonus feat.",
  dwarf: "Tough and hardy, with extra hit points to keep you on your feet.",
  elf: "Quick and perceptive, and at home in almost any class.",
  halfling: "Lucky and nimble — hard to pin down or keep down.",
  gnome: "Curious and a little magical, with fun, flavorful options.",
  goblin: "Spunky and resilient, and surprisingly simple to play.",
};

export const BEGINNER_CLASSES: Record<string, string> = {
  fighter: "The classic first class — simple, powerful, and forgiving.",
  champion: "A sturdy front-line protector in heavy armor (paladin-style).",
  barbarian: "Rage and hit hard. About as straightforward as it gets.",
  ranger: "Pick a target and excel against it — great with an animal pet.",
  rogue: "Skill-focused and sneaky, with big surprise hits.",
  cleric: "Heal your allies and hold your own — always useful in a party.",
};

/**
 * Returns the beginner-friendly reason for a name, or null if it isn't a
 * recommended pick. Matching is case-insensitive and trims surrounding space.
 */
export function beginnerReason(
  map: Record<string, string>,
  name: string | null | undefined
): string | null {
  if (!name) return null;
  return map[name.trim().toLowerCase()] ?? null;
}
