"use client";

import { HelpCircle } from "lucide-react";

// Plain-language definitions for the Pathfinder 2e jargon a first-time player
// runs into while building a character. Keep each definition to one or two
// sentences, no rules-citations, no nested jargon. These power the <Term>
// hover tooltip and the "words explained" chips on each builder step.
export type TermKey =
  | "ancestry"
  | "heritage"
  | "background"
  | "class"
  | "keyAbility"
  | "abilityScore"
  | "modifier"
  | "boost"
  | "flaw"
  | "proficiency"
  | "skill"
  | "feat"
  | "ac"
  | "hp"
  | "classDc"
  | "save"
  | "perception"
  | "spell"
  | "cantrip"
  | "tradition"
  | "level"
  | "action"
  | "variantRules";

export const GLOSSARY: Record<TermKey, { label: string; def: string }> = {
  ancestry: {
    label: "Ancestry",
    def: "Your character's people — like Human, Elf, or Dwarf. It sets your starting hit points, size, speed, and languages.",
  },
  heritage: {
    label: "Heritage",
    def: "A more specific version of your ancestry that gives a small extra ability — picked right after your ancestry.",
  },
  background: {
    label: "Background",
    def: "What your character did before adventuring (farmer, scholar, criminal…). It grants a couple of trained skills and an ability boost.",
  },
  class: {
    label: "Class",
    def: "Your character's adventuring profession — Fighter, Wizard, Cleric, and so on. It's the biggest choice: it decides how you fight, cast, and grow.",
  },
  keyAbility: {
    label: "Key ability",
    def: "The one ability score your class cares about most. It powers your best attacks and abilities, so it's usually your highest score.",
  },
  abilityScore: {
    label: "Ability score",
    def: "Six numbers (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma) that describe your raw talents. Higher is better.",
  },
  modifier: {
    label: "Modifier",
    def: "The bonus you actually add to dice rolls, worked out from an ability score. A score of 10–11 gives +0, and every 2 points above that adds +1.",
  },
  boost: {
    label: "Boost",
    def: "A +2 increase to an ability score (or +1 if it's already 18+). You get several at character creation instead of typing numbers in directly.",
  },
  flaw: {
    label: "Flaw",
    def: "A −2 decrease to one ability score that some ancestries have. It's normal and balanced out by your boosts.",
  },
  proficiency: {
    label: "Proficiency",
    def: "How good you are at something, in five ranks: Untrained, Trained, Expert, Master, Legendary. Higher ranks add a bigger bonus to those rolls.",
  },
  skill: {
    label: "Skill",
    def: "A thing you can attempt — like Athletics, Stealth, or Medicine. Being 'trained' in a skill means you're good enough to do the cool stuff with it.",
  },
  feat: {
    label: "Feat",
    def: "A special ability or trick you pick to customize your character. You'll earn many over your career from your ancestry, class, skills, and general options.",
  },
  ac: {
    label: "AC (Armor Class)",
    def: "How hard you are to hit. An enemy's attack roll has to meet or beat your AC to land a hit.",
  },
  hp: {
    label: "HP (Hit Points)",
    def: "Your health. When it hits 0 you're in serious trouble — so more is better, especially for front-line fighters.",
  },
  classDc: {
    label: "Class DC",
    def: "The difficulty number enemies must beat to resist some of your class's abilities. It grows as you level up.",
  },
  save: {
    label: "Saving throw",
    def: "A roll to resist danger: Fortitude (toughness), Reflex (dodging), and Will (mental grit). You make these to shrug off spells, traps, and poisons.",
  },
  perception: {
    label: "Perception",
    def: "How alert you are. It's used to notice hidden things and, most of the time, to roll for initiative at the start of a fight.",
  },
  spell: {
    label: "Spell",
    def: "A magical effect a spellcaster can produce. Some classes get spells; many don't — and that's fine.",
  },
  cantrip: {
    label: "Cantrip",
    def: "A spell you can cast as often as you like without using it up. They scale up in power as you level.",
  },
  tradition: {
    label: "Magic tradition",
    def: "The 'flavor' of a caster's magic — Arcane, Divine, Occult, or Primal. Your class decides which one you use.",
  },
  level: {
    label: "Level",
    def: "How experienced and powerful your character is, from 1 to 20. New players almost always start at level 1.",
  },
  action: {
    label: "Action",
    def: "On your turn in combat you get 3 actions to spend. Moving, attacking, and most things each cost one action.",
  },
  variantRules: {
    label: "Variant rules",
    def: "Optional rule tweaks a Game Master can switch on for their table. Leave them off unless your GM specifically told you to turn one on.",
  },
};

/**
 * Inline, hover-to-define jargon term. Use `<Term k="boost" />` to print the
 * glossary label, or `<Term k="boost">boosts</Term>` to wrap custom text.
 * Shows a dotted underline; the definition appears on hover or keyboard focus.
 */
export function Term({
  k,
  children,
  className = "",
}: {
  k: TermKey;
  children?: React.ReactNode;
  className?: string;
}) {
  const entry = GLOSSARY[k];
  return (
    <span className={`group/term relative inline-flex items-center ${className}`}>
      <button
        type="button"
        // Prevent a parent button/label from swallowing the interaction.
        onClick={(e) => e.stopPropagation()}
        className="cursor-help border-b border-dotted border-[#d8a646]/70 text-inherit underline-offset-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#d8a646]"
        aria-label={`${entry.label}: ${entry.def}`}
      >
        {children ?? entry.label}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-md border border-[#d8a646]/50 bg-[#0b1726] p-3 text-left text-xs font-normal leading-relaxed text-[#f3e5c1] opacity-0 shadow-xl transition-opacity duration-150 group-hover/term:opacity-100 group-focus-within/term:opacity-100"
      >
        <span className="mb-0.5 block font-semibold text-[#f2d269]">{entry.label}</span>
        {entry.def}
      </span>
    </span>
  );
}

/**
 * A compact "words explained here" legend. Renders each term as a small chip
 * that defines itself on hover, so the jargon on a step is demystified in one
 * glance without cluttering the controls themselves.
 */
export function TermChips({ terms }: { terms: TermKey[] }) {
  if (terms.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-[#b99762]">
        <HelpCircle size={12} /> New words
      </span>
      {terms.map((term) => (
        <span
          key={term}
          className="rounded-full border border-[#d8a646]/40 bg-[#0b1726] px-2 py-0.5 text-[11px] text-[#f3e5c1]"
        >
          <Term k={term} />
        </span>
      ))}
    </div>
  );
}
