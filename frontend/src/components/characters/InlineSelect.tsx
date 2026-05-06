"use client";

import { Loader2 } from "lucide-react";

interface InlineSelectOption {
  value: string;
  label: string;
}

interface InlineSelectProps {
  value: string;
  options: InlineSelectOption[];
  onCommit: (next: string) => void;
  isPending?: boolean;
  /** Extra classes on the wrapper span */
  className?: string;
  "aria-label"?: string;
}

/**
 * InlineSelect — displays as a native <select> that commits on change.
 * Styled to blend in with the card layout.
 */
export function InlineSelect({
  value,
  options,
  onCommit,
  isPending = false,
  className = "",
  "aria-label": ariaLabel,
}: InlineSelectProps) {
  if (isPending) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
        <Loader2 size={10} className="animate-spin" />
        {options.find((o) => o.value === value)?.label ?? value}
      </span>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onCommit(e.target.value)}
      disabled={isPending}
      aria-label={ariaLabel}
      className={`text-xs bg-muted border border-border rounded px-1.5 py-0.5 text-foreground cursor-pointer hover:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors capitalize ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
