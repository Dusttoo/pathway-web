// Single source of truth for the v2 builder step list.
// Adding/removing a step here updates IconStepProgress, the
// nav arrows, and the route map automatically.

import {
  PlayCircle,
  Users,
  GitBranch,
  Shield,
  PawPrint,
  BookOpen,
  Hexagon,
  CheckCircle2,
  Award,
  User,
  Heart,
  Backpack,
  Wand2,
  Eye,
  type LucideIcon,
} from "lucide-react";
import type { BuilderState } from "./types";

export type StepKey =
  | "start"
  | "ancestry"
  | "heritage"
  | "class"
  | "companion"
  | "background"
  | "abilities"
  | "skills"
  | "feats"
  | "description"
  | "personality"
  | "equipment"
  | "spells"
  | "review";

export type StepDef = {
  key: StepKey;
  label: string;
  icon: LucideIcon;
  // Predicate determines whether this step appears in the flow.
  // Always-on steps return true. Companion shows when class grants
  // an animal companion/familiar; Spells shows when class casts.
  shouldShow: (state: BuilderState) => boolean;
};

// Classes that grant an animal companion by default (Lvl 1 class feature).
// Other classes can get one via dedications/feats — that case is handled
// later as a runtime check; for the builder we surface the companion step
// for the base classes that always get one.
const COMPANION_CLASSES = new Set(["druid", "ranger", "cavalier", "summoner", "beastmaster"]);

// We don't have is_spellcaster in builder state at step-config time,
// so spell-step visibility falls back to a class-name heuristic. The
// SpellsStep itself does a second authoritative check via useClassDetail.
const SPELLCASTER_CLASSES = new Set([
  "bard",
  "cleric",
  "druid",
  "sorcerer",
  "wizard",
  "magus",
  "oracle",
  "psychic",
  "witch",
  "summoner",
  "animist",
  "necromancer",
]);

function classNameLower(state: BuilderState): string {
  return state.className.toLowerCase().trim();
}

export const STEPS: StepDef[] = [
  { key: "start", label: "Start", icon: PlayCircle, shouldShow: () => true },
  { key: "ancestry", label: "Ancestry", icon: Users, shouldShow: () => true },
  { key: "heritage", label: "Heritage", icon: GitBranch, shouldShow: () => true },
  { key: "class", label: "Class", icon: Shield, shouldShow: () => true },
  {
    key: "companion",
    label: "Companion",
    icon: PawPrint,
    shouldShow: (s) => COMPANION_CLASSES.has(classNameLower(s)),
  },
  { key: "background", label: "Background", icon: BookOpen, shouldShow: () => true },
  { key: "abilities", label: "Abilities", icon: Hexagon, shouldShow: () => true },
  { key: "skills", label: "Skills", icon: CheckCircle2, shouldShow: () => true },
  { key: "feats", label: "Feats", icon: Award, shouldShow: () => true },
  { key: "description", label: "Description", icon: User, shouldShow: () => true },
  { key: "personality", label: "Personality", icon: Heart, shouldShow: () => true },
  { key: "equipment", label: "Equipment", icon: Backpack, shouldShow: () => true },
  {
    key: "spells",
    label: "Spells",
    icon: Wand2,
    shouldShow: (s) => SPELLCASTER_CLASSES.has(classNameLower(s)),
  },
  { key: "review", label: "Review", icon: Eye, shouldShow: () => true },
];

export function visibleSteps(state: BuilderState): StepDef[] {
  return STEPS.filter((s) => s.shouldShow(state));
}
