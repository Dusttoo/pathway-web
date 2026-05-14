"use client";

import { useState, useRef, useEffect } from "react";
import { Minus, Plus, Loader2 } from "lucide-react";

interface NumberStepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  /** Called with the new value when user changes it via +/- or direct input. */
  onCommit: (next: number) => void;
  isPending?: boolean;
  label?: string;
  /** Extra classes on the wrapper */
  className?: string;
}

/**
 * NumberStepper — inline −/value/+ widget.
 *
 * Clicking −/+ fires onCommit immediately.
 * Clicking the number value opens a small input for direct entry;
 * saves on Enter or blur, cancels on Escape.
 */
export function NumberStepper({
  value,
  min = 0,
  max,
  step: stepSize = 1,
  onCommit,
  isPending = false,
  label,
  className = "",
}: NumberStepperProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep draft in sync when value changes externally (e.g. Realtime update)
  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function clamp(n: number): number {
    if (isNaN(n)) return value;
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return Math.round(v);
  }

  function step(delta: number) {
    onCommit(clamp(value + delta));
  }

  function commitEdit() {
    const parsed = parseInt(draft, 10);
    const next = clamp(isNaN(parsed) ? value : parsed);
    setEditing(false);
    setDraft(String(next));
    if (next !== value) onCommit(next);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(String(value));
  }

  return (
    <div
      className={`inline-flex min-h-11 items-stretch overflow-hidden rounded-md border border-border bg-background ${className}`}
    >
      {label && <span className="text-xs text-muted-foreground mr-1 select-none">{label}</span>}

      <button
        type="button"
        onClick={() => step(-stepSize)}
        disabled={isPending || (min !== undefined && value <= min)}
        className="flex min-h-11 min-w-11 touch-manipulation items-center justify-center border-r border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        aria-label={`Decrease ${label ?? "value"}`}
      >
        <Minus size={16} />
      </button>

      {editing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9+-]*"
          value={draft}
          min={min}
          max={max}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") cancelEdit();
          }}
          className="min-h-11 w-16 border-0 bg-background px-2 text-center font-mono text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(String(value));
            setEditing(true);
          }}
          disabled={isPending}
          className="min-h-11 min-w-16 touch-manipulation px-3 text-center font-mono text-sm font-bold transition-colors hover:bg-muted disabled:cursor-not-allowed"
          aria-label={`Edit ${label ?? "value"} (currently ${value})`}
          title="Click to type a value"
        >
          {isPending ? <Loader2 size={12} className="animate-spin mx-auto" /> : value}
        </button>
      )}

      <button
        type="button"
        onClick={() => step(stepSize)}
        disabled={isPending || (max !== undefined && value >= max)}
        className="flex min-h-11 min-w-11 touch-manipulation items-center justify-center border-l border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        aria-label={`Increase ${label ?? "value"}`}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
