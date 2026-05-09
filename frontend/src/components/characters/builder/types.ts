// Shared state type for the native character builder wizard.
// Owned by BuilderForm and passed down as props to each step.

export type BuilderState = {
  // Step 1 — Identity
  name: string;
  level: number;
  alignment: string;
  gender: string;
  age: string;
  guildId: string;
  // Step 2 — Ancestry & Heritage
  ancestryId: string;
  ancestryName: string;
  ancestryHp: number;
  ancestrySpeed: number;
  ancestrySize: string;
  heritageName: string;
  defaultLanguages: string[];
  // Step 3 — Class & Background
  classId: string;
  className: string;
  classHp: number;
  classInitialProfs: Record<string, number>;
  classTrainedCount: number;
  backgroundName: string;
  keyability: string;
  lore: string;
  // Step 4 — Ability Scores & Skills
  abilities: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  trainedSkills: string[];
  // Step 5 — Details & Review
  deity: string;
  languages: string[];
  money: { cp: number; sp: number; gp: number; pp: number };
};

export const DEFAULT_STATE: BuilderState = {
  name: "", level: 1, alignment: "N", gender: "", age: "", guildId: "",
  ancestryId: "", ancestryName: "", ancestryHp: 8, ancestrySpeed: 25,
  ancestrySize: "Medium", heritageName: "", defaultLanguages: [],
  classId: "", className: "", classHp: 8, classInitialProfs: {},
  classTrainedCount: 3, backgroundName: "", keyability: "", lore: "",
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  trainedSkills: [],
  deity: "", languages: [], money: { cp: 0, sp: 0, gp: 15, pp: 0 },
};

export type StepProps = {
  state: BuilderState;
  update: (patch: Partial<BuilderState>) => void;
  onNext: () => void;
  onBack: () => void;
};
