import type { StepKey } from "./steps";
import type { TermKey } from "./glossary";

// Friendly, plain-English orientation shown at the top of each builder step
// when Beginner Mode is on. Written for someone who has never played
// Pathfinder 2e: say what the step is, why it matters, and reassure them that
// nothing here is permanent. `terms` lists the jargon that first appears on
// this step so it can be defined inline.
export type StepGuide = {
  // One friendly sentence framing the step.
  headline: string;
  // 2–3 short, scannable points. Keep each to a single idea.
  points: string[];
  // Reassurance — every step can be revisited and changed freely.
  reassure?: string;
  // Jargon introduced on this step, surfaced as hover-to-define chips.
  terms?: TermKey[];
};

export const STEP_GUIDES: Partial<Record<StepKey, StepGuide>> = {
  start: {
    headline: "Let's give your character a name and decide how experienced they are.",
    points: [
      "Only the name is required — everything else on this screen is optional.",
      "New players almost always start at level 1. If your Game Master hasn't said otherwise, leave it there.",
    ],
    reassure: "You can rename or re-level your character at any time, even after you finish.",
    terms: ["level"],
  },
  ancestry: {
    headline: "Pick your character's people — this is the 'what are you' question.",
    points: [
      "Your ancestry sets your starting health, size, speed, and the languages you know.",
      "Look for the ⭐ Great for beginners tag if you're not sure — Human, Dwarf, and Elf are all easy first picks.",
    ],
    reassure: "Nothing here locks you in. Try one, see the numbers update, and switch if you like.",
    terms: ["ancestry", "hp"],
  },
  heritage: {
    headline: "Now narrow your ancestry down with a heritage.",
    points: [
      "A heritage is a small twist on your ancestry that grants one extra ability (like darkvision or a resistance).",
      "If you're overwhelmed, any heritage is a fine choice — pick whatever sounds cool.",
    ],
    terms: ["heritage"],
  },
  languages: {
    headline: "Choose the languages your character can speak.",
    points: [
      "You already know a few from your ancestry. Smart characters (high Intelligence) can pick a few more.",
      "Common is the everyday trade language — most parties share it.",
    ],
  },
  class: {
    headline: "This is the big one: your class decides how your character adventures.",
    points: [
      "Fighter (tough melee), Cleric (heal + fight), Rogue (sneaky skills), and Wizard (spells) are the friendliest starting classes.",
      "Each class has a key ability — the score it leans on most. We'll make sure it's your highest later.",
    ],
    reassure: "Your class shapes the steps that follow, but you can come back and change it.",
    terms: ["class", "keyAbility"],
  },
  classOptions: {
    headline: "Some classes ask one or two extra questions — like a subclass.",
    points: [
      "These choices flavor your class (a Cleric's deity, a Sorcerer's bloodline, and so on).",
      "There's no wrong answer for a first character — pick what sounds fun.",
    ],
  },
  companion: {
    headline: "Your class can bring along a companion!",
    points: [
      "This is an animal ally or magical helper that fights alongside you.",
      "Give it a name and type now — you can flesh it out later.",
    ],
  },
  background: {
    headline: "What did your character do before adventuring?",
    points: [
      "Your background gives you a couple of trained skills and an ability boost — a free head start.",
      "Pick something that fits your story; the mechanical differences are small.",
    ],
    terms: ["background", "skill", "boost"],
  },
  abilities: {
    headline: "Set your six ability scores — the heart of your character's talents.",
    points: [
      "Instead of typing numbers, you choose boosts (+2 each). We do the math for you.",
      "Your class's key ability should be one of your picks — it's highlighted for you.",
    ],
    reassure: "Don't overthink it: boost your key ability, your Constitution for health, and whatever else fits your character.",
    terms: ["abilityScore", "modifier", "boost", "flaw", "keyAbility"],
  },
  skills: {
    headline: "Choose what your character is trained in.",
    points: [
      "Trained skills are the things your character is reliably good at, like Athletics or Diplomacy.",
      "Smarter characters get more picks. Spend them on skills that match your class and concept.",
    ],
    terms: ["skill", "proficiency"],
  },
  feats: {
    headline: "Feats are the special tricks that make your character unique.",
    points: [
      "At level 1 you'll usually pick one ancestry feat and one class feat.",
      "Each feat shows what it does — skim a few and grab one that sounds exciting.",
    ],
    reassure: "You earn many more feats as you level up, so you don't have to fit everything in now.",
    terms: ["feat"],
  },
  progression: {
    headline: "A preview of what your character gains at every level from 1 to 20.",
    points: [
      "This is just a roadmap — you don't have to fill it all in now.",
      "It's handy later for planning, but feel free to skip ahead for your first character.",
    ],
  },
  description: {
    headline: "The fun part — describe who your character actually is.",
    points: [
      "Appearance, personality, backstory… all optional, all flavor.",
      "Even a sentence or two helps your character come alive at the table.",
    ],
  },
  equipment: {
    headline: "Gear up! Choose your starting weapons, armor, and supplies.",
    points: [
      "You start with a small budget of gold. Buy armor and a weapon first, then adventuring basics.",
      "Not sure? A weapon, some armor, and a healing item will get any character through their first adventure.",
    ],
  },
  spells: {
    headline: "Your class casts magic — let's choose your spells.",
    points: [
      "Cantrips are spells you can cast endlessly; higher-rank spells are your limited, powerful options.",
      "Grab a damage cantrip, a utility cantrip, and a couple of 1st-rank spells to start.",
    ],
    terms: ["spell", "cantrip", "tradition"],
  },
  review: {
    headline: "Last look! Check everything over, then bring your character to life.",
    points: [
      "Anything missing is flagged here — click to jump back and fix it.",
      "When you're happy, hit create. You can still edit your character afterward.",
    ],
  },
};
