// Builder state for the v2 (icon-led) character flow. Superset of the
// original BuilderForm state — adds description/personality fields plus
// companion bookkeeping. Persisted in memory only; ReviewStep flushes
// to /api/characters and the join tables on submit.

export type FeatSlot =
  | "ancestry"
  | "class"
  | "general"
  | "skill"
  | "archetype"
  | "free_archetype"
  | "bonus";

export type Tradition = "arcane" | "divine" | "occult" | "primal";
export type SpellSource = "spellbook" | "repertoire" | "innate" | "focus";

export type SelectedFeat = {
  feat_id: string;
  feat_name: string;
  feat_slot: FeatSlot;
  level_acquired: number;
};

export type SelectedSpell = {
  spell_id: string;
  spell_name: string;
  tradition: Tradition;
  rank: number;
  spell_source: SpellSource;
};

export type StartingItem = {
  item_id: string;
  item_name: string;
  quantity: number;
};

export type BuilderState = {
  // Start
  name: string;
  level: number;
  alignment: string;
  gender: string;
  age: string;
  deity: string;

  // Ancestry + Heritage
  ancestryId: string;
  ancestryName: string;
  ancestryHp: number;
  ancestrySpeed: number;
  ancestrySize: string;
  heritageId: string;
  heritageName: string;
  defaultLanguages: string[];
  languages: string[];

  // Class
  classId: string;
  className: string;
  classHp: number;
  classInitialProfs: Record<string, number>;
  classTrainedCount: number;
  keyability: string;

  // Companion (optional, populated when companion step is visible)
  companionType: "animal" | "familiar" | "construct" | "eidolon" | "";
  companionName: string;
  companionSubtype: string;

  // Background
  backgroundId: string;
  backgroundName: string;
  backgroundTrainedSkill: string;
  lore: string;

  // Abilities + Skills
  abilities: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  trainedSkills: string[];
  additionalSkills: { name: string; rank: number }[];

  // Feats (from Nethys reference, persisted to character_feats)
  selectedFeats: SelectedFeat[];

  // Description (physical)
  height: string;
  weight: string;
  eyes: string;
  hair: string;
  skin: string;
  distinguishingFeatures: string;
  portraitUrl: string;

  // Personality (narrative)
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  backstory: string;

  // Equipment + currency
  selectedItems: StartingItem[];
  money: { cp: number; sp: number; gp: number; pp: number };

  // Spells (only relevant if class is spellcaster)
  selectedSpells: SelectedSpell[];

  // Legacy bot-side custom fields preserved for round-trip with the
  // existing native_build create payload. Kept hidden in the v2 UI.
  customFeats: { name: string; featType: string; level: number }[];
  customSpecials: string[];
  customAttacks: { name: string; bonus: string; damage: string; traits: string }[];
};

export const DEFAULT_STATE: BuilderState = {
  name: "",
  level: 1,
  alignment: "N",
  gender: "",
  age: "",
  deity: "",

  ancestryId: "",
  ancestryName: "",
  ancestryHp: 8,
  ancestrySpeed: 25,
  ancestrySize: "Medium",
  heritageId: "",
  heritageName: "",
  defaultLanguages: [],
  languages: [],

  classId: "",
  className: "",
  classHp: 8,
  classInitialProfs: {},
  classTrainedCount: 3,
  keyability: "",

  companionType: "",
  companionName: "",
  companionSubtype: "",

  backgroundId: "",
  backgroundName: "",
  backgroundTrainedSkill: "",
  lore: "",

  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  trainedSkills: [],
  additionalSkills: [],

  selectedFeats: [],

  height: "",
  weight: "",
  eyes: "",
  hair: "",
  skin: "",
  distinguishingFeatures: "",
  portraitUrl: "",

  personalityTraits: "",
  ideals: "",
  bonds: "",
  flaws: "",
  backstory: "",

  selectedItems: [],
  money: { cp: 0, sp: 0, gp: 15, pp: 0 },

  selectedSpells: [],

  customFeats: [],
  customSpecials: [],
  customAttacks: [],
};

export type StepProps = {
  state: BuilderState;
  update: (patch: Partial<BuilderState>) => void;
  onNext: () => void;
  onBack: () => void;
};
