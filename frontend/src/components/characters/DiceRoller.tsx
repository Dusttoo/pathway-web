/**
 * DiceRoller Component
 *
 * Interactive dice roller for PF2e with:
 * - Multiple dice types (d4, d6, d8, d10, d12, d20, d100)
 * - Modifiers and advantage/disadvantage
 * - Roll history
 * - Quick preset rolls
 */

"use client";

import { Dices, Plus, Minus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";

type DiceType = 4 | 6 | 8 | 10 | 12 | 20 | 100;

interface DiceRoll {
  id: string;
  timestamp: Date;
  dice: string; // e.g., "2d6+3"
  results: number[];
  modifier: number;
  total: number;
  type?: "normal" | "advantage" | "disadvantage";
  label?: string;
}

interface DiceRollerProps {
  onRoll?: (roll: DiceRoll) => void;
  className?: string;
}

export function DiceRoller({ onRoll, className = "" }: DiceRollerProps) {
  const [diceCount, setDiceCount] = useState(1);
  const [diceType, setDiceType] = useState<DiceType>(20);
  const [modifier, setModifier] = useState(0);
  const [rollType, setRollType] = useState<"normal" | "advantage" | "disadvantage">("normal");
  const [history, setHistory] = useState<DiceRoll[]>([]);
  const [isRolling, setIsRolling] = useState(false);

  const diceTypes: DiceType[] = [4, 6, 8, 10, 12, 20, 100];

  // Roll dice with animation
  const rollDice = (label?: string) => {
    setIsRolling(true);

    // Simulate rolling animation
    setTimeout(() => {
      const results: number[] = [];
      const rollCount = rollType !== "normal" ? 2 : diceCount;

      for (let i = 0; i < rollCount; i++) {
        results.push(Math.floor(Math.random() * diceType) + 1);
      }

      let finalResults = results;
      let total = 0;

      // Handle advantage/disadvantage
      if (rollType === "advantage") {
        const max = Math.max(...results);
        total = max + modifier;
        finalResults = results;
      } else if (rollType === "disadvantage") {
        const min = Math.min(...results);
        total = min + modifier;
        finalResults = results;
      } else {
        total = results.reduce((sum, val) => sum + val, 0) + modifier;
      }

      const roll: DiceRoll = {
        id: Date.now().toString(),
        timestamp: new Date(),
        dice: `${diceCount}d${diceType}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ""}`,
        results: finalResults,
        modifier,
        total,
        type: rollType,
        label,
      };

      setHistory([roll, ...history]);
      onRoll?.(roll);
      setIsRolling(false);
    }, 500);
  };

  // Quick preset rolls
  const presetRolls = [
    { label: "D20", count: 1, type: 20, mod: 0 },
    { label: "Initiative", count: 1, type: 20, mod: 0 },
    { label: "Attack", count: 1, type: 20, mod: 0 },
    { label: "Damage (1d8)", count: 1, type: 8, mod: 0 },
    { label: "Healing (1d4)", count: 1, type: 4, mod: 0 },
  ];

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Dices className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-heading font-bold text-foreground">Dice Roller</h3>
        </div>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Clear History
          </button>
        )}
      </div>

      {/* Dice Configuration */}
      <div className="card p-4 space-y-4">
        {/* Dice Type Selector */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Dice Type</label>
          <div className="flex gap-2 flex-wrap">
            {diceTypes.map((type) => (
              <button
                key={type}
                onClick={() => setDiceType(type)}
                className={`
                  px-3 py-2 rounded-md font-medium transition-colors
                  ${
                    diceType === type
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }
                `}
              >
                d{type}
              </button>
            ))}
          </div>
        </div>

        {/* Number of Dice */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Number of Dice
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDiceCount(Math.max(1, diceCount - 1))}
              className="btn-outline w-10 h-10 p-0"
              disabled={diceCount <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9+-]*"
              value={diceCount}
              onChange={(e) => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 text-center bg-background border border-border rounded-md px-3 py-2 font-medium"
              min="1"
              max="99"
            />
            <button
              onClick={() => setDiceCount(Math.min(99, diceCount + 1))}
              className="btn-outline w-10 h-10 p-0"
              disabled={diceCount >= 99}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modifier */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Modifier</label>
          <div className="flex items-center gap-2">
            <button onClick={() => setModifier(modifier - 1)} className="btn-outline w-10 h-10 p-0">
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9+-]*"
              value={modifier}
              onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
              className="w-20 text-center bg-background border border-border rounded-md px-3 py-2 font-medium"
            />
            <button onClick={() => setModifier(modifier + 1)} className="btn-outline w-10 h-10 p-0">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Roll Type (Advantage/Disadvantage) */}
        {diceCount === 1 && diceType === 20 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Roll Type
            </label>
            <div className="flex gap-2">
              {(["normal", "advantage", "disadvantage"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setRollType(type)}
                  className={`
                    flex-1 px-3 py-2 rounded-md font-medium text-sm capitalize transition-colors
                    ${
                      rollType === type
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Roll Display */}
        <div className="text-center py-4 border-t border-border">
          <div className="text-3xl font-heading font-bold text-primary mb-2">
            {diceCount}d{diceType}
            {modifier !== 0 && (
              <span className="text-xl">
                {modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`}
              </span>
            )}
          </div>
          {rollType !== "normal" && (
            <div className="text-sm text-muted-foreground capitalize">with {rollType}</div>
          )}
        </div>

        {/* Roll Button */}
        <button
          onClick={() => rollDice()}
          disabled={isRolling}
          className={`
            w-full btn-primary h-12 text-lg font-semibold
            ${isRolling ? "animate-pulse" : ""}
          `}
        >
          {isRolling ? (
            <>
              <RotateCcw className="w-5 h-5 animate-spin" />
              Rolling...
            </>
          ) : (
            <>
              <Dices className="w-5 h-5" />
              Roll Dice
            </>
          )}
        </button>
      </div>

      {/* Quick Presets */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Quick Rolls</h4>
        <div className="flex gap-2 flex-wrap">
          {presetRolls.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setDiceCount(preset.count);
                setDiceType(preset.type as DiceType);
                setModifier(preset.mod);
                setRollType("normal");
                setTimeout(() => rollDice(preset.label), 100);
              }}
              className="btn-outline text-xs px-3 py-1.5"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Roll History */}
      {history.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Roll History</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map((roll) => (
              <div key={roll.id} className="card p-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-heading font-semibold text-sm">
                      {roll.label || roll.dice}
                    </span>
                    {roll.type !== "normal" && (
                      <span className="text-xs badge badge-secondary capitalize">{roll.type}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {roll.results.join(", ")}
                    {roll.modifier !== 0 && ` ${roll.modifier > 0 ? "+" : ""}${roll.modifier}`}
                  </div>
                </div>
                <div className="text-2xl font-heading font-bold text-primary">{roll.total}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * CompactDiceRoller Component
 *
 * Simplified dice roller for embedding in character sheets
 */
interface CompactDiceRollerProps {
  preset?: {
    count: number;
    type: DiceType;
    modifier: number;
    label: string;
  };
  onRoll?: (roll: DiceRoll) => void;
  className?: string;
}

export function CompactDiceRoller({ preset, onRoll, className = "" }: CompactDiceRollerProps) {
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = () => {
    if (!preset) return;

    setIsRolling(true);

    setTimeout(() => {
      const results: number[] = [];
      for (let i = 0; i < preset.count; i++) {
        results.push(Math.floor(Math.random() * preset.type) + 1);
      }

      const total = results.reduce((sum, val) => sum + val, 0) + preset.modifier;

      const roll: DiceRoll = {
        id: Date.now().toString(),
        timestamp: new Date(),
        dice: `${preset.count}d${preset.type}${preset.modifier !== 0 ? (preset.modifier > 0 ? `+${preset.modifier}` : preset.modifier) : ""}`,
        results,
        modifier: preset.modifier,
        total,
        label: preset.label,
      };

      setLastRoll(total);
      onRoll?.(roll);
      setIsRolling(false);
    }, 300);
  };

  return (
    <button
      onClick={handleRoll}
      disabled={isRolling || !preset}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-md
        bg-muted hover:bg-muted/80 transition-colors
        ${isRolling ? "animate-pulse" : ""}
        ${className}
      `}
    >
      <Dices className={`w-4 h-4 ${isRolling ? "animate-spin" : ""}`} />
      <span className="text-sm font-medium">{preset ? preset.label : "Roll"}</span>
      {lastRoll !== null && (
        <span className="ml-auto text-lg font-heading font-bold text-primary">{lastRoll}</span>
      )}
    </button>
  );
}
