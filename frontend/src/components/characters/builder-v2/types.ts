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
  | "impulse"
  | "bonus";

export type Tradition = "arcane" | "divine" | "occult" | "primal";
export type SpellSource = "spellbook" | "repertoire" | "innate" | "focus";
export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

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

export type CustomProficiency = {
  type: "weapon" | "armor";
  name: string;
  rank: number;
};

export type ClassOptions = {
  subclass?: string;
  doctrine?: string;
  divineFont?: string;
  deityFavoredWeapon?: string;
  domain?: string;
  sanctification?: string;
  anathema?: string;
  patron?: string;
  thesis?: string;
  muse?: string;
  bloodline?: string;
  mystery?: string;
  hybridStudy?: string;
  methodology?: string;
  instinct?: string;
  cause?: string;
  patronSkill?: string;
  kineticGate?: "single" | "dual" | "";
  kineticElements?: string[];
  kineticNotes?: string;
  notes?: string;
};

export type AbilityBoostChoices = {
  ancestryFree: AbilityKey[];
  background: AbilityKey[];
  free: AbilityKey[];
  levelBoosts: Record<string, AbilityKey[]>;
};

export type BuilderFocus = {
  featSlotId?: string;
  spellRank?: number;
};

// PF2e variant rules — toggled per character at creation. Mirrors the
// shape of the `characters.variant_rules` jsonb column (migration
// 20260514000000_character_variant_rules.sql).
export type VariantRules = {
  // Advanced — variant rules
  freeArchetype: boolean;
  freeArchetypeNoRestrictions: boolean;
  freeArchetypeNoAbilityReqs: boolean;
  ancestryParagon: boolean;
  automaticBonusProgression: boolean;
  proficiencyWithoutLevel: boolean;
  legacyDualClassing: boolean;
  legacyStamina: boolean;
  legacyGradualBoost: boolean;

  // Remaster / Mythic
  showMythic: boolean;
  mythicViaCustomFeats: boolean;
  mythicDestiniesAsArchetypes: boolean;
  updatedMagusPsychicSpells: boolean;
};

export const DEFAULT_VARIANT_RULES: VariantRules = {
  freeArchetype: false,
  freeArchetypeNoRestrictions: false,
  freeArchetypeNoAbilityReqs: false,
  ancestryParagon: false,
  automaticBonusProgression: false,
  proficiencyWithoutLevel: false,
  legacyDualClassing: false,
  legacyStamina: false,
  legacyGradualBoost: false,
  showMythic: false,
  mythicViaCustomFeats: false,
  mythicDestiniesAsArchetypes: false,
  updatedMagusPsychicSpells: false,
};

export type BuilderState = {
  // Start
  name: string;
  level: number;
  alignment: string;
  gender: string;
  age: string;
  deity: string;

  // Options (variant rules)
  variantRules: VariantRules;

  // Ancestry + Heritage
  ancestryId: string;
  ancestryName: string;
  ancestryHp: number;
  ancestrySpeed: number;
  ancestrySize: string;
  ancestryBoostMode: "printed" | "remaster";
  ancestryBoostOptions: string[];
  ancestryFlawOptions: string[];
  selectedAncestryFlaws: AbilityKey[];
  heritageId: string;
  heritageName: string;
  defaultLanguages: string[];
  ancestryBonusLanguages: number;
  languages: string[];

  // Class
  classId: string;
  className: string;
  classHp: number;
  classInitialProfs: Record<string, number>;
  classTrainedCount: number;
  keyability: string;
  classOptions: ClassOptions;

  // Companion (optional, populated when companion step is visible)
  companionType: "animal" | "familiar" | "construct" | "eidolon" | "";
  companionName: string;
  companionSubtype: string;

  // Background
  backgroundId: string;
  backgroundName: string;
  backgroundBoostOptions: string[];
  backgroundTrainedSkill: string;
  lore: string;

  // Abilities + Skills
  abilities: Record<AbilityKey, number>;
  abilityBoostChoices: AbilityBoostChoices;
  trainedSkills: string[];
  additionalSkills: { name: string; rank: number }[];
  customProficiencies: CustomProficiency[];

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

  variantRules: DEFAULT_VARIANT_RULES,

  ancestryId: "",
  ancestryName: "",
  ancestryHp: 8,
  ancestrySpeed: 25,
  ancestrySize: "Medium",
  ancestryBoostMode: "remaster",
  ancestryBoostOptions: [],
  ancestryFlawOptions: [],
  selectedAncestryFlaws: [],
  heritageId: "",
  heritageName: "",
  defaultLanguages: [],
  ancestryBonusLanguages: 0,
  languages: [],

  classId: "",
  className: "",
  classHp: 8,
  classInitialProfs: {},
  classTrainedCount: 3,
  keyability: "",
  classOptions: { kineticGate: "", kineticElements: [] },

  companionType: "",
  companionName: "",
  companionSubtype: "",

  backgroundId: "",
  backgroundName: "",
  backgroundBoostOptions: [],
  backgroundTrainedSkill: "",
  lore: "",

  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  abilityBoostChoices: { ancestryFree: [], background: [], free: [], levelBoosts: {} },
  trainedSkills: [],
  additionalSkills: [],
  customProficiencies: [],

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
  onJump?: (stepKey: string, focus?: BuilderFocus) => void;
  focus?: BuilderFocus | null;
  onCreated?: () => Promise<void> | void;
};
