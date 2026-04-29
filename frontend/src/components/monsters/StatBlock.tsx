/**
 * StatBlock Component
 *
 * Displays a PF2e monster stat block
 * Includes all standard stat block elements: abilities, actions, traits, etc.
 */

"use client";

import {
  Shield,
  Heart,
  Zap,
  Eye,
  Languages,
  Swords,
  Sparkles,
} from "lucide-react";
import { getAbilityModifier, formatModifier } from "@/lib/types/character";

interface MonsterAbilities {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

interface MonsterAction {
  name: string;
  description: string;
  attack_bonus?: number;
  damage?: string;
  reach?: number;
  range?: number;
}

interface MonsterTrait {
  name: string;
  description: string;
}

interface Monster {
  id: string;
  name: string;
  size: string;
  type: string;
  subtype?: string;
  alignment: string;
  armor_class: number;
  hit_points: number;
  hit_dice?: string;
  speed: Record<string, number>; // { walk: 30, fly: 60, swim: 30 }
  abilities: MonsterAbilities;
  saving_throws?: Record<string, number>;
  skills?: Record<string, number>;
  damage_resistances?: string[];
  damage_immunities?: string[];
  damage_vulnerabilities?: string[];
  condition_immunities?: string[];
  senses?: Record<string, number>; // { darkvision: 60, passive_perception: 12 }
  languages?: string[];
  challenge_rating: number;
  experience_points: number;
  traits?: MonsterTrait[];
  actions?: MonsterAction[];
  legendary_actions?: MonsterAction[];
  lair_actions?: MonsterTrait[];
}

interface StatBlockProps {
  monster: Monster;
  compact?: boolean;
  showActions?: boolean;
  className?: string;
}

export function StatBlock({
  monster,
  compact = false,
  showActions = true,
  className = "",
}: StatBlockProps) {
  // Format speed display
  const formatSpeed = (speed: Record<string, number>): string => {
    const parts: string[] = [];
    Object.entries(speed).forEach(([type, value]) => {
      if (type === "walk") {
        parts.push(`${value} ft.`);
      } else {
        parts.push(`${type} ${value} ft.`);
      }
    });
    return parts.join(", ");
  };

  // Format senses display
  const formatSenses = (senses?: Record<string, number>): string => {
    if (!senses) return "—";
    const parts: string[] = [];
    Object.entries(senses).forEach(([sense, value]) => {
      if (sense === "passive_perception") {
        parts.push(`passive Perception ${value}`);
      } else {
        parts.push(`${sense} ${value} ft.`);
      }
    });
    return parts.join(", ");
  };

  return (
    <div className={`card p-6 bg-parchment ${className}`}>
      {/* Header */}
      <div className="border-b-2 border-primary pb-2 mb-3">
        <h2 className="text-2xl font-heading font-bold text-primary mb-1">
          {monster.name}
        </h2>
        <p className="text-sm italic text-muted-foreground">
          {monster.size} {monster.type}
          {monster.subtype && ` (${monster.subtype})`}, {monster.alignment}
        </p>
      </div>

      {/* Basic Stats */}
      <div className="space-y-2 text-sm mb-4">
        {/* Armor Class */}
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="font-semibold">Armor Class</span>
          <span>{monster.armor_class}</span>
        </div>

        {/* Hit Points */}
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-destructive" />
          <span className="font-semibold">Hit Points</span>
          <span>
            {monster.hit_points}
            {monster.hit_dice && ` (${monster.hit_dice})`}
          </span>
        </div>

        {/* Speed */}
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-chart-2" />
          <span className="font-semibold">Speed</span>
          <span>{formatSpeed(monster.speed)}</span>
        </div>
      </div>

      {/* Ability Scores */}
      <div className="border-y-2 border-border py-3 mb-4">
        <div className="grid grid-cols-6 gap-2 text-center text-xs">
          {Object.entries(monster.abilities).map(([ability, score]) => (
            <div key={ability} className="flex flex-col">
              <span className="font-heading font-bold text-primary uppercase">
                {ability.substring(0, 3)}
              </span>
              <span className="text-base font-semibold">{score}</span>
              <span className="text-muted-foreground">
                ({formatModifier(getAbilityModifier(score))})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Extended Stats */}
      <div className="space-y-2 text-sm mb-4">
        {/* Saving Throws */}
        {monster.saving_throws &&
          Object.keys(monster.saving_throws).length > 0 && (
            <div>
              <span className="font-semibold">Saving Throws </span>
              <span>
                {Object.entries(monster.saving_throws)
                  .map(
                    ([ability, bonus]) =>
                      `${ability.substring(0, 3).toUpperCase()} ${formatModifier(bonus)}`,
                  )
                  .join(", ")}
              </span>
            </div>
          )}

        {/* Skills */}
        {monster.skills && Object.keys(monster.skills).length > 0 && (
          <div>
            <span className="font-semibold">Skills </span>
            <span>
              {Object.entries(monster.skills)
                .map(([skill, bonus]) => `${skill} ${formatModifier(bonus)}`)
                .join(", ")}
            </span>
          </div>
        )}

        {/* Damage Vulnerabilities */}
        {monster.damage_vulnerabilities &&
          monster.damage_vulnerabilities.length > 0 && (
            <div>
              <span className="font-semibold">Damage Vulnerabilities </span>
              <span>{monster.damage_vulnerabilities.join(", ")}</span>
            </div>
          )}

        {/* Damage Resistances */}
        {monster.damage_resistances &&
          monster.damage_resistances.length > 0 && (
            <div>
              <span className="font-semibold">Damage Resistances </span>
              <span>{monster.damage_resistances.join(", ")}</span>
            </div>
          )}

        {/* Damage Immunities */}
        {monster.damage_immunities && monster.damage_immunities.length > 0 && (
          <div>
            <span className="font-semibold">Damage Immunities </span>
            <span>{monster.damage_immunities.join(", ")}</span>
          </div>
        )}

        {/* Condition Immunities */}
        {monster.condition_immunities &&
          monster.condition_immunities.length > 0 && (
            <div>
              <span className="font-semibold">Condition Immunities </span>
              <span>{monster.condition_immunities.join(", ")}</span>
            </div>
          )}

        {/* Senses */}
        <div className="flex items-start gap-2">
          <Eye className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold">Senses </span>
            <span>{formatSenses(monster.senses)}</span>
          </div>
        </div>

        {/* Languages */}
        <div className="flex items-start gap-2">
          <Languages className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold">Languages </span>
            <span>
              {monster.languages && monster.languages.length > 0
                ? monster.languages.join(", ")
                : "—"}
            </span>
          </div>
        </div>

        {/* Challenge Rating */}
        <div>
          <span className="font-semibold">Challenge </span>
          <span>
            {monster.challenge_rating} (
            {monster.experience_points.toLocaleString()} XP)
          </span>
        </div>
      </div>

      {/* Traits */}
      {monster.traits && monster.traits.length > 0 && (
        <div className="border-t-2 border-border pt-4 mb-4">
          <div className="space-y-3">
            {monster.traits.map((trait, index) => (
              <div key={index}>
                <h4 className="font-heading font-bold text-primary inline">
                  {trait.name}.{" "}
                </h4>
                <span className="text-sm">{trait.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && monster.actions && monster.actions.length > 0 && (
        <div className="border-t-2 border-border pt-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Swords className="w-5 h-5 text-destructive" />
            <h3 className="text-lg font-heading font-bold text-destructive">
              Actions
            </h3>
          </div>
          <div className="space-y-3">
            {monster.actions.map((action, index) => (
              <div key={index}>
                <h4 className="font-heading font-bold text-primary inline">
                  {action.name}.{" "}
                </h4>
                <span className="text-sm">
                  {action.attack_bonus && (
                    <span className="italic">
                      Melee or Ranged Weapon Attack:{" "}
                      {formatModifier(action.attack_bonus)} to hit,{" "}
                      {action.reach && `reach ${action.reach} ft.`}
                      {action.range && `range ${action.range} ft.`}.{" "}
                    </span>
                  )}
                  {action.damage && (
                    <span className="italic">Hit: {action.damage}. </span>
                  )}
                  {action.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legendary Actions */}
      {showActions &&
        monster.legendary_actions &&
        monster.legendary_actions.length > 0 && (
          <div className="border-t-2 border-border pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-chart-4" />
              <h3 className="text-lg font-heading font-bold text-chart-4">
                Legendary Actions
              </h3>
            </div>
            <p className="text-sm italic mb-3">
              {monster.name} can take 3 legendary actions, choosing from the
              options below. Only one legendary action can be used at a time and
              only at the end of another creature's turn. {monster.name} regains
              spent legendary actions at the start of its turn.
            </p>
            <div className="space-y-3">
              {monster.legendary_actions.map((action, index) => (
                <div key={index}>
                  <h4 className="font-heading font-bold text-primary inline">
                    {action.name}.{" "}
                  </h4>
                  <span className="text-sm">{action.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Lair Actions */}
      {showActions &&
        monster.lair_actions &&
        monster.lair_actions.length > 0 && (
          <div className="border-t-2 border-border pt-4 mt-4">
            <h3 className="text-lg font-heading font-bold text-chart-5 mb-3">
              Lair Actions
            </h3>
            <div className="space-y-3">
              {monster.lair_actions.map((action, index) => (
                <div key={index}>
                  <h4 className="font-heading font-bold text-primary inline">
                    {action.name}.{" "}
                  </h4>
                  <span className="text-sm">{action.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}

/**
 * CompactStatBlock Component
 *
 * Simplified stat block for lists or quick reference
 */
interface CompactStatBlockProps {
  monster: Monster;
  onClick?: () => void;
  className?: string;
}

export function CompactStatBlock({
  monster,
  onClick,
  className = "",
}: CompactStatBlockProps) {
  const getCRColor = (cr: number): string => {
    if (cr >= 20) return "text-chart-5";
    if (cr >= 10) return "text-destructive";
    if (cr >= 5) return "text-chart-4";
    return "text-chart-2";
  };

  return (
    <div
      onClick={onClick}
      className={`card p-4 ${
        onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-heading font-bold text-foreground mb-1 truncate">
            {monster.name}
          </h3>
          <p className="text-xs text-muted-foreground mb-2">
            {monster.size} {monster.type}, {monster.alignment}
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-primary" />
              <span className="text-muted-foreground">AC</span>
              <span className="font-medium">{monster.armor_class}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-destructive" />
              <span className="text-muted-foreground">HP</span>
              <span className="font-medium">{monster.hit_points}</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-chart-4" />
              <span className="text-muted-foreground">CR</span>
              <span
                className={`font-medium ${getCRColor(monster.challenge_rating)}`}
              >
                {monster.challenge_rating}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * StatBlockList Component
 *
 * Grid of compact stat blocks
 */
interface StatBlockListProps {
  monsters: Monster[];
  onMonsterClick?: (monster: Monster) => void;
  emptyMessage?: string;
  className?: string;
}

export function StatBlockList({
  monsters,
  onMonsterClick,
  emptyMessage = "No monsters to display",
  className = "",
}: StatBlockListProps) {
  if (monsters.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Swords className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
    >
      {monsters.map((monster) => (
        <CompactStatBlock
          key={monster.id}
          monster={monster}
          onClick={onMonsterClick ? () => onMonsterClick(monster) : undefined}
        />
      ))}
    </div>
  );
}
