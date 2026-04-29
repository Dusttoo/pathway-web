/**
 * SpellSlot Component
 *
 * Displays spell slots for a specific spell level with visual indicators
 * Allows tracking of used vs. available slots with click-to-toggle functionality
 */

"use client";

import { Circle, CircleDot, Sparkles } from "lucide-react";
import { useState } from "react";

interface SpellSlotProps {
  level: number;
  total: number;
  used: number;
  onSlotClick?: (slotIndex: number) => void;
  className?: string;
}

/**
 * Single spell level with multiple slots
 */
export function SpellSlot({
  level,
  total,
  used,
  onSlotClick,
  className = "",
}: SpellSlotProps) {
  // Convert 0 to "Cantrip", otherwise show level
  const levelDisplay = level === 0 ? "Cantrips" : `Level ${level}`;

  // Generate slot circles
  const slots = Array.from({ length: total }, (_, i) => i);
  const usedSlots = used;
  const availableSlots = total - used;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-heading font-semibold text-foreground">
            {levelDisplay}
          </span>
        </div>
        {level > 0 && (
          <span className="text-xs text-muted-foreground">
            {availableSlots} / {total} available
          </span>
        )}
      </div>

      {/* Spell slots visualization */}
      {level > 0 ? (
        <div className="flex items-center gap-2 flex-wrap">
          {slots.map((slotIndex) => {
            const isUsed = slotIndex < usedSlots;

            return (
              <button
                key={slotIndex}
                onClick={() => onSlotClick?.(slotIndex)}
                disabled={!onSlotClick}
                className={`
                  transition-all duration-200
                  ${onSlotClick ? "cursor-pointer hover:scale-110" : "cursor-default"}
                  ${isUsed ? "text-muted-foreground" : "text-primary"}
                `}
                title={isUsed ? "Click to recover slot" : "Click to use slot"}
                aria-label={`Spell slot ${slotIndex + 1}: ${isUsed ? "used" : "available"}`}
              >
                {isUsed ? (
                  <Circle className="w-6 h-6" />
                ) : (
                  <CircleDot className="w-6 h-6" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">Unlimited uses</div>
      )}
    </div>
  );
}

/**
 * SpellSlotTracker Component
 *
 * Displays all spell slots for a character organized by level
 * Tracks used/available slots with interactive toggles
 */
interface SpellSlotData {
  level: number;
  total: number;
  used: number;
}

interface SpellSlotTrackerProps {
  slots: SpellSlotData[];
  onSlotToggle?: (level: number, slotIndex: number) => void;
  onLongRest?: () => void;
  onShortRest?: () => void;
  className?: string;
}

export function SpellSlotTracker({
  slots,
  onSlotToggle,
  onLongRest,
  onShortRest,
  className = "",
}: SpellSlotTrackerProps) {
  // Filter out cantrips (level 0) for the main display
  const spellLevels = slots.filter((slot) => slot.level > 0);
  const hasCantrips = slots.some((slot) => slot.level === 0);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with rest buttons */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h3 className="text-lg font-heading font-bold text-foreground">
          Spell Slots
        </h3>
        <div className="flex gap-2">
          {onShortRest && (
            <button
              onClick={onShortRest}
              className="px-3 py-1 text-xs font-medium text-primary border border-primary rounded-md hover:bg-primary/10 transition-colors"
            >
              Short Rest
            </button>
          )}
          {onLongRest && (
            <button
              onClick={onLongRest}
              className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Long Rest
            </button>
          )}
        </div>
      </div>

      {/* Cantrips (if any) */}
      {hasCantrips && <SpellSlot level={0} total={0} used={0} />}

      {/* Spell levels 1-9 */}
      {spellLevels.length > 0 ? (
        <div className="space-y-3">
          {spellLevels.map((slot) => (
            <SpellSlot
              key={slot.level}
              level={slot.level}
              total={slot.total}
              used={slot.used}
              onSlotClick={(slotIndex) => onSlotToggle?.(slot.level, slotIndex)}
            />
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-center py-4">
          No spell slots available
        </div>
      )}
    </div>
  );
}

/**
 * CompactSpellSlots Component
 *
 * Compact view of spell slots for character cards or summaries
 */
interface CompactSpellSlotsProps {
  slots: SpellSlotData[];
  className?: string;
}

export function CompactSpellSlots({
  slots,
  className = "",
}: CompactSpellSlotsProps) {
  const spellLevels = slots.filter((slot) => slot.level > 0);

  if (spellLevels.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Sparkles className="w-4 h-4 text-primary" />
      <div className="flex items-center gap-3 text-xs">
        {spellLevels.map((slot) => (
          <div key={slot.level} className="flex items-center gap-1">
            <span className="text-muted-foreground">L{slot.level}:</span>
            <span className="font-medium text-foreground">
              {slot.total - slot.used}/{slot.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
