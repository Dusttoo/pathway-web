/**
 * ConditionBadge Component
 *
 * Displays PF2e conditions with appropriate styling and icons
 * Supports all standard conditions plus custom effects
 */

"use client";

import {
  Eye,
  EyeOff,
  Heart,
  Ear,
  Ghost,
  Hand,
  Zap,
  Skull,
  AlertTriangle,
  Shield,
  Sparkles,
  X,
  TrendingDown,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

/**
 * Standard PF2e conditions
 */
export type ConditionType =
  | "blinded"
  | "charmed"
  | "deafened"
  | "frightened"
  | "grappled"
  | "incapacitated"
  | "invisible"
  | "paralyzed"
  | "petrified"
  | "poisoned"
  | "prone"
  | "restrained"
  | "stunned"
  | "unconscious"
  | "exhaustion"
  | "custom";

interface ConditionConfig {
  label: string;
  icon: LucideIcon;
  color: string; // Tailwind color classes
  description: string;
}

/**
 * Condition configurations with icons and colors
 */
const CONDITION_CONFIGS: Record<ConditionType, ConditionConfig> = {
  blinded: {
    label: "Blinded",
    icon: EyeOff,
    color: "bg-slate-500/20 text-slate-500 border-slate-500/30",
    description: "Can't see, auto-fail sight checks, attacks have disadvantage",
  },
  charmed: {
    label: "Charmed",
    icon: Heart,
    color: "bg-pink-500/20 text-pink-500 border-pink-500/30",
    description: "Can't attack charmer, charmer has advantage on social checks",
  },
  deafened: {
    label: "Deafened",
    icon: Ear,
    color: "bg-slate-500/20 text-slate-500 border-slate-500/30",
    description: "Can't hear, auto-fail hearing checks",
  },
  frightened: {
    label: "Frightened",
    icon: Ghost,
    color: "bg-purple-500/20 text-purple-500 border-purple-500/30",
    description: "Disadvantage while source is in sight, can't move closer",
  },
  grappled: {
    label: "Grappled",
    icon: Hand,
    color: "bg-orange-500/20 text-orange-500 border-orange-500/30",
    description: "Speed is 0, can't benefit from bonuses to speed",
  },
  incapacitated: {
    label: "Incapacitated",
    icon: Zap,
    color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    description: "Can't take actions or reactions",
  },
  invisible: {
    label: "Invisible",
    icon: Eye,
    color: "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
    description:
      "Impossible to see, attacks have advantage, attacks against have disadvantage",
  },
  paralyzed: {
    label: "Paralyzed",
    icon: Zap,
    color: "bg-red-500/20 text-red-500 border-red-500/30",
    description:
      "Incapacitated, can't move or speak, auto-fail STR & DEX saves",
  },
  petrified: {
    label: "Petrified",
    icon: Shield,
    color: "bg-stone-500/20 text-stone-500 border-stone-500/30",
    description:
      "Transformed to stone, incapacitated, resistance to all damage",
  },
  poisoned: {
    label: "Poisoned",
    icon: Skull,
    color: "bg-green-600/20 text-green-600 border-green-600/30",
    description: "Disadvantage on attack rolls and ability checks",
  },
  prone: {
    label: "Prone",
    icon: TrendingDown,
    color: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    description:
      "Disadvantage on attack rolls, attacks within 5ft have advantage",
  },
  restrained: {
    label: "Restrained",
    icon: Hand,
    color: "bg-red-600/20 text-red-600 border-red-600/30",
    description:
      "Speed is 0, attacks have disadvantage, attacks against have advantage",
  },
  stunned: {
    label: "Stunned",
    icon: AlertTriangle,
    color: "bg-yellow-600/20 text-yellow-600 border-yellow-600/30",
    description: "Incapacitated, can't move, can speak falteringly",
  },
  unconscious: {
    label: "Unconscious",
    icon: Skull,
    color: "bg-red-700/20 text-red-700 border-red-700/30",
    description: "Incapacitated, can't move or speak, unaware of surroundings",
  },
  exhaustion: {
    label: "Exhaustion",
    icon: TrendingDown,
    color: "bg-slate-600/20 text-slate-600 border-slate-600/30",
    description: "Stacking penalties from fatigue (6 levels)",
  },
  custom: {
    label: "Custom",
    icon: Sparkles,
    color: "bg-primary/20 text-primary border-primary/30",
    description: "Custom condition or effect",
  },
};

interface ConditionBadgeProps {
  condition: ConditionType;
  customLabel?: string;
  duration?: string;
  level?: number; // For exhaustion levels (1-6)
  onRemove?: () => void;
  showDescription?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ConditionBadge({
  condition,
  customLabel,
  duration,
  level,
  onRemove,
  showDescription = false,
  size = "md",
  className = "",
}: ConditionBadgeProps) {
  const config = CONDITION_CONFIGS[condition];
  const Icon = config.icon;

  // Size variants
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  // Display label
  const displayLabel = customLabel || config.label;
  const fullLabel = level ? `${displayLabel} ${level}` : displayLabel;

  return (
    <div
      className={`
        inline-flex items-center
        font-medium rounded-md border
        ${config.color}
        ${sizeClasses[size]}
        ${className}
      `}
      title={showDescription ? undefined : config.description}
    >
      <Icon className={iconSizes[size]} />
      <span>{fullLabel}</span>

      {duration && <span className="opacity-70 text-xs">({duration})</span>}

      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:opacity-70 transition-opacity"
          aria-label="Remove condition"
        >
          <X className={iconSizes[size]} />
        </button>
      )}
    </div>
  );
}

/**
 * ConditionsList Component
 *
 * Displays multiple conditions in a flex-wrap layout
 */
interface Condition {
  id: string;
  type: ConditionType;
  customLabel?: string;
  duration?: string;
  level?: number;
}

interface ConditionsListProps {
  conditions: Condition[];
  onRemove?: (conditionId: string) => void;
  size?: "sm" | "md" | "lg";
  emptyMessage?: string;
  className?: string;
}

export function ConditionsList({
  conditions,
  onRemove,
  size = "md",
  emptyMessage = "No active conditions",
  className = "",
}: ConditionsListProps) {
  if (conditions.length === 0) {
    return (
      <div
        className={`text-sm text-muted-foreground text-center py-2 ${className}`}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {conditions.map((condition) => (
        <ConditionBadge
          key={condition.id}
          condition={condition.type}
          customLabel={condition.customLabel}
          duration={condition.duration}
          level={condition.level}
          onRemove={onRemove ? () => onRemove(condition.id) : undefined}
          size={size}
        />
      ))}
    </div>
  );
}

/**
 * ConditionDescriptionCard Component
 *
 * Displays a condition with full description (for reference)
 */
interface ConditionDescriptionCardProps {
  condition: ConditionType;
  className?: string;
}

export function ConditionDescriptionCard({
  condition,
  className = "",
}: ConditionDescriptionCardProps) {
  const config = CONDITION_CONFIGS[condition];
  const Icon = config.icon;

  return (
    <div className={`card p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-heading font-semibold mb-1">{config.label}</h4>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Exhaustion level descriptions
 */
export const EXHAUSTION_LEVELS = [
  { level: 1, effect: "Disadvantage on ability checks" },
  { level: 2, effect: "Speed halved" },
  { level: 3, effect: "Disadvantage on attack rolls and saving throws" },
  { level: 4, effect: "Hit point maximum halved" },
  { level: 5, effect: "Speed reduced to 0" },
  { level: 6, effect: "Death" },
];

/**
 * ExhaustionTracker Component
 *
 * Special component for tracking exhaustion levels
 */
interface ExhaustionTrackerProps {
  level: number;
  onLevelChange?: (newLevel: number) => void;
  className?: string;
}

export function ExhaustionTracker({
  level,
  onLevelChange,
  className = "",
}: ExhaustionTrackerProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="font-heading font-semibold text-sm">Exhaustion</h4>
        <span className="text-xs text-muted-foreground">Level {level} / 6</span>
      </div>

      {/* Level indicators */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6].map((lvl) => (
          <button
            key={lvl}
            onClick={() => onLevelChange?.(lvl === level ? 0 : lvl)}
            disabled={!onLevelChange}
            className={`
              flex-1 h-2 rounded transition-colors
              ${lvl <= level ? "bg-slate-600" : "bg-muted"}
              ${onLevelChange ? "cursor-pointer hover:opacity-80" : "cursor-default"}
              ${lvl === 6 && lvl <= level ? "bg-red-600" : ""}
            `}
            title={`Level ${lvl}: ${EXHAUSTION_LEVELS[lvl - 1].effect}`}
          />
        ))}
      </div>

      {/* Current effect */}
      {level > 0 && level <= 6 && (
        <p className="text-xs text-muted-foreground">
          {EXHAUSTION_LEVELS[level - 1].effect}
        </p>
      )}
    </div>
  );
}
