"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";

interface InlineTextareaProps {
  value: string;
  placeholder?: string;
  onCommit: (next: string) => void;
  isPending?: boolean;
  /** Max characters — enforced in the textarea. */
  maxLength?: number;
  /** Extra classes on the wrapper */
  className?: string;
  emptyText?: string;
}

/**
 * InlineTextarea — shows text with a pencil icon on hover.
 * Click to edit; Ctrl+Enter or the ✓ button to save; Escape or ✕ to cancel.
 */
export function InlineTextarea({
  value,
  placeholder = "Add a note…",
  onCommit,
  isPending = false,
  maxLength = 2000,
  className = "",
  emptyText = "No notes yet.",
}: InlineTextareaProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const textareaRef           = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
      // Place cursor at end
      const len = textareaRef.current?.value.length ?? 0;
      textareaRef.current?.setSelectionRange(len, len);
    }
  }, [editing]);

  function save() {
    setEditing(false);
    if (draft !== value) onCommit(draft);
  }

  function cancel() {
    setEditing(false);
    setDraft(value);
  }

  if (isPending) {
    return (
      <div className={`flex items-start gap-2 ${className}`}>
        <Loader2 size={12} className="animate-spin mt-0.5 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground italic">{draft || emptyText}</p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, maxLength))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) save();
            if (e.key === "Escape") cancel();
          }}
          placeholder={placeholder}
          rows={3}
          className="w-full text-xs bg-background border border-primary rounded px-2 py-1.5 resize-y focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={save}
            className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
          >
            <Check size={12} /> Save
          </button>
          <button
            onClick={cancel}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={12} /> Cancel
          </button>
          <span className="text-[10px] text-muted-foreground/50 ml-auto">
            Ctrl+Enter to save · Esc to cancel
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative cursor-pointer ${className}`}
      onClick={() => setEditing(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setEditing(true); }}
      title="Click to edit"
    >
      {value ? (
        <p className="text-xs text-muted-foreground italic pr-5">{value}</p>
      ) : (
        <p className="text-xs text-muted-foreground/40 italic pr-5">{emptyText}</p>
      )}
      <Pencil
        size={11}
        className="absolute top-0 right-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors"
      />
    </div>
  );
}
