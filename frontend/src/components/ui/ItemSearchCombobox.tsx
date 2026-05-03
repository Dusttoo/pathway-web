"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Package, Sparkles, Plus } from "lucide-react";
import type { ItemSearchResult } from "@/app/api/items/search/route";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ItemSearchComboboxProps {
  /** Controlled value — the item name string stored in the parent form state. */
  value:       string;
  /** Called on every keystroke with the current input string. */
  onChange:    (value: string) => void;
  /**
   * Called when the user *confirms* a selection (clicks a result, presses Enter,
   * or chooses the custom-item fallback). Use this in multi-item tag inputs to
   * push the confirmed name into a list and clear the input.
   * If omitted, `onChange` alone handles all updates.
   */
  onSelect?:   (name: string) => void;
  placeholder?: string;
  className?:  string;
  autoFocus?:  boolean;
  disabled?:   boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ItemSearchCombobox({
  value,
  onChange,
  onSelect,
  placeholder = "Search items…",
  className,
  autoFocus,
  disabled,
}: ItemSearchComboboxProps) {
  const [inputVal,    setInputVal]    = useState(value);
  const [results,     setResults]     = useState<ItemSearchResult[]>([]);
  const [open,        setOpen]        = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading,     setLoading]     = useState(false);

  const containerRef  = useRef<HTMLDivElement>(null);
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync controlled value into local state (e.g. parent resets after submit)
  useEffect(() => { setInputVal(value); }, [value]);

  // Debounced search whenever inputVal changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = inputVal.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/items/search?q=${encodeURIComponent(trimmed)}`);
        const json = await res.json() as { results: ItemSearchResult[] };
        setResults(json.results ?? []);
        setOpen(true);
        setActiveIndex(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [inputVal]);

  // Close on click outside
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function select(name: string) {
    if (onSelect) {
      // Multi-item mode: parent handles the value; clear our internal input
      onSelect(name);
      setInputVal("");
      onChange("");
    } else {
      // Single-item mode: fill input with the selected name
      setInputVal(name);
      onChange(name);
    }
    setOpen(false);
    setActiveIndex(-1);
  }

  // +1 slot for the custom-item row at the bottom
  const totalOptions = results.length + 1;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown" && results.length > 0) {
        setOpen(true);
        setActiveIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, totalOptions - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          select(results[activeIndex].name);
        } else {
          // activeIndex === results.length (custom row) OR nothing focused → use typed text
          const trimmed = inputVal.trim();
          if (trimmed) select(trimmed);
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      {/* Input */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          className="input pl-9"
          placeholder={placeholder}
          value={inputVal}
          autoFocus={autoFocus}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `item-opt-${activeIndex}` : undefined}
          onChange={(e) => {
            setInputVal(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="block w-3.5 h-3.5 border-2 border-muted-foreground/40 border-t-primary rounded-full animate-spin" />
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border-2 border-border rounded-md shadow-lg overflow-hidden">
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">

            {/* Catalog results */}
            {results.map((item, i) => (
              <li
                key={item.id}
                id={`item-opt-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                className={`flex items-center justify-between gap-2 px-3 py-2 cursor-pointer text-sm transition-colors select-none ${
                  i === activeIndex
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent text-foreground"
                }`}
                // onMouseDown prevents input blur before selection registers
                onMouseDown={(e) => { e.preventDefault(); select(item.name); }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {/* Name + icon */}
                <div className="flex items-center gap-2 min-w-0">
                  {item.source === "homebrew" ? (
                    <Sparkles size={12} className="text-amber-500 shrink-0" />
                  ) : (
                    <Package size={12} className="text-muted-foreground shrink-0" />
                  )}
                  <span className="truncate">{item.name}</span>
                </div>

                {/* Metadata badges */}
                <div className="flex items-center gap-1.5 shrink-0 text-xs">
                  {item.level !== undefined && item.level > 0 && (
                    <span className="text-muted-foreground">Lv {item.level}</span>
                  )}
                  {item.item_type && (
                    <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded capitalize">
                      {item.item_type}
                    </span>
                  )}
                  {item.source === "homebrew" && (
                    <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">
                      homebrew
                    </span>
                  )}
                </div>
              </li>
            ))}

            {/* Separator */}
            {results.length > 0 && (
              <li role="presentation" className="h-px bg-border mx-2 my-1" />
            )}

            {/* Custom item row — always shown while dropdown is open */}
            {inputVal.trim() && (
              <li
                id={`item-opt-${results.length}`}
                role="option"
                aria-selected={activeIndex === results.length}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors select-none ${
                  activeIndex === results.length
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
                onMouseDown={(e) => { e.preventDefault(); select(inputVal.trim()); }}
                onMouseEnter={() => setActiveIndex(results.length)}
              >
                <Plus size={12} className="shrink-0" />
                <span>
                  Use{" "}
                  <span className="font-medium text-foreground">
                    &ldquo;{inputVal.trim()}&rdquo;
                  </span>{" "}
                  as custom item
                </span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
