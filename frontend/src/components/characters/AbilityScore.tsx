/**
 * AbilityScore Component
 *
 * Displays a PF2e ability score with modifier
 * Classic RPG styling with score in a hexagon/box and modifier prominently displayed
 */

"use client";

import { getAbilityModifier, formatModifier } from "@/lib/types/character";

interface AbilityScoreProps {
  name: string;
  abbreviation: string;
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AbilityScore({
  name,
  abbreviation,
  score,
  size = "md",
  className = "",
}: AbilityScoreProps) {
  const modifier = getAbilityModifier(score);
  const formattedModifier = formatModifier(modifier);

  // Size variants
  const sizeClasses = {
    sm: {
      container: "w-16",
      abbreviation: "text-xs",
      score: "text-lg",
      modifier: "text-base",
    },
    md: {
      container: "w-20",
      abbreviation: "text-sm",
      score: "text-2xl",
      modifier: "text-xl",
    },
    lg: {
      container: "w-24",
      abbreviation: "text-base",
      score: "text-3xl",
      modifier: "text-2xl",
    },
  };

  const styles = sizeClasses[size];

  // Determine modifier color (positive = green, negative = red, neutral = default)
  const getModifierColor = (mod: number): string => {
    if (mod > 0) return "text-chart-2"; // Green
    if (mod < 0) return "text-destructive"; // Red
    return "text-muted-foreground";
  };

  return (
    <div
      className={`flex flex-col items-center ${styles.container} ${className}`}
      title={`${name}: ${score} (${formattedModifier})`}
    >
      {/* Ability Name (abbreviated) */}
      <div
        className={`${styles.abbreviation} font-heading font-bold text-primary uppercase tracking-wide mb-1`}
      >
        {abbreviation}
      </div>

      {/* Score Container (hexagon-like box) */}
      <div className="relative w-full aspect-square flex items-center justify-center">
        {/* Background shape */}
        <div className="absolute inset-0 bg-card border-2 border-primary rounded-lg shadow-sm" />

        {/* Score value */}
        <span
          className={`${styles.score} font-heading font-bold text-foreground relative z-10`}
        >
          {score}
        </span>
      </div>

      {/* Modifier */}
      <div
        className={`
        ${styles.modifier}
        font-heading
        font-bold
        ${getModifierColor(modifier)}
        mt-1
      `}
      >
        {formattedModifier}
      </div>
    </div>
  );
}

/**
 * AbilityScoresGrid Component
 *
 * Displays all 6 ability scores in a grid layout
 */
interface AbilityScoresGridProps {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AbilityScoresGrid({
  strength,
  dexterity,
  constitution,
  intelligence,
  wisdom,
  charisma,
  size = "md",
  className = "",
}: AbilityScoresGridProps) {
  const abilities = [
    { name: "Strength", abbr: "STR", score: strength },
    { name: "Dexterity", abbr: "DEX", score: dexterity },
    { name: "Constitution", abbr: "CON", score: constitution },
    { name: "Intelligence", abbr: "INT", score: intelligence },
    { name: "Wisdom", abbr: "WIS", score: wisdom },
    { name: "Charisma", abbr: "CHA", score: charisma },
  ];

  return (
    <div className={`grid grid-cols-3 md:grid-cols-6 gap-4 ${className}`}>
      {abilities.map((ability) => (
        <AbilityScore
          key={ability.abbr}
          name={ability.name}
          abbreviation={ability.abbr}
          score={ability.score}
          size={size}
        />
      ))}
    </div>
  );
}
