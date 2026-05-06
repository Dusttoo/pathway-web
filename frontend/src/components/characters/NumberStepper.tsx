"use client";

import { useState, useRef, useEffect } from "react";
import { Minus, Plus, Loader2 } from "lucide-react";

interface NumberStepperProps {
  value: number;
  min?: number;
  max?: number;
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
  onCommit,
  isPending = false,
  label,
  className = "",
}: NumberStepperProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(String(value));
  const inputRef              = useRef<HTMLInputElement>(null);

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
    const next   = clamp(isNaN(parsed) ? value : parsed);
    setEditing(false);
    setDraft(String(next));
    if (next !== value) onCommit(next);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(String(value));
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {label && <span className="text-xs text-muted-foreground mr-1 select-none">{label}</span>}

      <button
        onClick={() => step(-1)}
        disabled={isPending || (min !== undefined && value <= min)}
        className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label={`Decrease ${label ?? "value"}`}
      >
        <Minus size={12} />
      </button>

      {editing ? (
        <input
          ref={inputRef}
          type="number"
          value={draft}
          min={min}
          max={max}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter")  commitEdit();
            if (e.key === "Escape") cancelEdit();
          }}
          className="w-14 text-center text-sm font-mono font-bold bg-background border border-primary rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      ) : (
        <button
          onClick={() => { setDraft(String(value)); setEditing(true); }}
          disabled={isPending}
          className="min-w-[2.5rem] px-1 py-0.5 text-sm font-mono font-bold text-center rounded hover:bg-muted transition-colors disabled:cursor-not-allowed"
          aria-label={`Edit ${label ?? "value"} (currently ${value})`}
          title="Click to type a value"
        >
          {isPending ? <Loader2 size={12} className="animate-spin mx-auto" /> : value}
        </button>
      )}

      <button
        onClick={() => step(1)}
        disabled={isPending || (max !== undefined && value >= max)}
        className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label={`Increase ${label ?? "value"}`}
      >
        <Plus size={12} />
      </button>
    </div>
  );
}
