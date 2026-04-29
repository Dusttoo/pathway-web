/**
 * HealthBar Component
 *
 * Displays character hit points with a visual progress bar
 * Shows current HP, max HP, temporary HP, and health percentage
 */

"use client";

import { Heart, Shield } from "lucide-react";

interface HealthBarProps {
  currentHp: number;
  maxHp: number;
  temporaryHp?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function HealthBar({
  currentHp,
  maxHp,
  temporaryHp = 0,
  showLabel = true,
  size = "md",
  className = "",
}: HealthBarProps) {
  // Calculate percentages
  const healthPercentage = Math.min(
    100,
    Math.max(0, (currentHp / maxHp) * 100),
  );
  const tempPercentage =
    maxHp > 0
      ? Math.min(100 - healthPercentage, (temporaryHp / maxHp) * 100)
      : 0;

  // Determine health status color
  const getHealthColor = (percentage: number): string => {
    if (percentage > 66) return "bg-chart-2"; // Green - healthy
    if (percentage > 33) return "bg-chart-5"; // Yellow - wounded
    if (percentage > 0) return "bg-destructive"; // Red - critical
    return "bg-muted"; // Gray - unconscious
  };

  // Size variants
  const sizeClasses = {
    sm: {
      height: "h-2",
      text: "text-xs",
      icon: 14,
      padding: "p-2",
    },
    md: {
      height: "h-4",
      text: "text-sm",
      icon: 18,
      padding: "p-3",
    },
    lg: {
      height: "h-6",
      text: "text-base",
      icon: 22,
      padding: "p-4",
    },
  };

  const styles = sizeClasses[size];

  // Health status message
  const getHealthStatus = (): string => {
    if (currentHp === 0) return "Unconscious";
    if (healthPercentage > 75) return "Healthy";
    if (healthPercentage > 50) return "Injured";
    if (healthPercentage > 25) return "Wounded";
    return "Critical";
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and HP Numbers */}
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart size={styles.icon} className="text-destructive" />
            <span className={`font-heading font-bold ${styles.text}`}>
              Hit Points
            </span>
          </div>
          <div className={`font-heading font-bold ${styles.text}`}>
            <span
              className={
                currentHp === 0 ? "text-destructive" : "text-foreground"
              }
            >
              {currentHp}
            </span>
            <span className="text-muted-foreground"> / </span>
            <span className="text-foreground">{maxHp}</span>
            {temporaryHp > 0 && (
              <span className="text-chart-4 ml-2">+{temporaryHp} temp</span>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div
        className={`w-full ${styles.height} bg-muted rounded-full overflow-hidden border-2 border-border shadow-inner`}
      >
        <div className="flex h-full">
          {/* Main HP Bar */}
          <div
            className={`${getHealthColor(healthPercentage)} transition-all duration-300 ease-in-out`}
            style={{ width: `${healthPercentage}%` }}
          />
          {/* Temporary HP Bar */}
          {temporaryHp > 0 && (
            <div
              className="bg-chart-4 transition-all duration-300 ease-in-out opacity-70"
              style={{ width: `${tempPercentage}%` }}
            />
          )}
        </div>
      </div>

      {/* Health Status (optional for larger sizes) */}
      {size !== "sm" && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{getHealthStatus()}</span>
          <span>{Math.round(healthPercentage)}%</span>
        </div>
      )}

      {/* Temporary HP Info (if present) */}
      {temporaryHp > 0 && size !== "sm" && (
        <div
          className={`${styles.padding} bg-chart-4 bg-opacity-10 border-2 border-chart-4 rounded-lg`}
        >
          <div className="flex items-center gap-2">
            <Shield size={styles.icon} className="text-chart-4" />
            <div className="flex-1">
              <p
                className={`font-heading font-bold text-chart-4 ${styles.text}`}
              >
                Temporary Hit Points
              </p>
              <p className="text-xs text-muted-foreground">
                Absorb {temporaryHp} damage before losing real HP
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * CompactHealthDisplay Component
 *
 * Minimal HP display for cards and lists
 */
interface CompactHealthDisplayProps {
  currentHp: number;
  maxHp: number;
  temporaryHp?: number;
  className?: string;
}

export function CompactHealthDisplay({
  currentHp,
  maxHp,
  temporaryHp = 0,
  className = "",
}: CompactHealthDisplayProps) {
  const healthPercentage = Math.min(
    100,
    Math.max(0, (currentHp / maxHp) * 100),
  );

  // Determine color based on health
  const getColor = (percentage: number): string => {
    if (percentage > 66) return "text-chart-2";
    if (percentage > 33) return "text-chart-5";
    if (percentage > 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Heart size={16} className={getColor(healthPercentage)} />
      <span
        className={`font-mono text-sm font-bold ${getColor(healthPercentage)}`}
      >
        {currentHp}/{maxHp}
      </span>
      {temporaryHp > 0 && (
        <span className="font-mono text-xs text-chart-4">+{temporaryHp}</span>
      )}
    </div>
  );
}
