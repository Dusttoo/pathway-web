"use client";

import { MainLayout } from "@/components/layout";
import { HealthBar } from "@/components/characters/HealthBar";
import { useCharacterLive, useSyncCharacter } from "@/lib/hooks/use-characters";
import { useCharacterDowntime, downtimeKeys, type DowntimeLogEntry } from "@/lib/hooks/use-downtime";
import { useCharacterNotes, NOTE_CATEGORIES, NOTE_CATEGORY_ORDER, notesKeys, type BotNote } from "@/lib/hooks/use-notes";
import { useBag, bagKeys, type BagCategories, type BagItem } from "@/lib/hooks/use-bag";
import { useAuth } from "@/lib/providers/auth-provider";
import type { CharacterOverlay, BotCompanion } from "@/lib/types/bot-integration";
import {
  ArrowLeft, Radio, Zap, Heart, Flame, PawPrint,
  CalendarDays, BookOpen, RefreshCw, Plus, Trash2, X,
  Package, Inbox,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// ── Pathbuilder shape ─────────────────────────────────────────────────────────

interface PBBuild {
  name?: string;
  class?: string;
  ancestry?: string;
  heritage?: string;
  background?: string;
  level?: number;
  deity?: string;
  languages?: string[];
  keyability?: string;
  abilities?: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  proficiencies?: Record<string, number>;
  feats?: Array<[string, string | null, string | null, string | null] | string[]>;
  specials?: string[];
  equipment?: Array<[string, number]> | Array<{ name: string; qty: number }>;
  attributes?: { ancestryhp: number; classhp: number; bonushp: number; bonushpPerLevel: number };
  spellCasters?: Array<{ name: string; perDay: number[] }>;
}

type TabKey = "stats" | "feats" | "gear" | "bag" | "notes" | "downtime" | "companions";

// ── Math helpers ──────────────────────────────────────────────────────────────

function abilityModNum(score: number): number {
  return Math.floor((score - 10) / 2);
}

function abilityModStr(score: number): string {
  const mod = abilityModNum(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/** PF2e proficiency bonus: Untrained = 0; Trained/Expert/Master/Legendary = rank×2 + level */
function profBonus(rank: number, level: number): number {
  return rank === 0 ? 0 : rank * 2 + level;
}

function signedTotal(total: number): string {
  return total >= 0 ? `+${total}` : `${total}`;
}

function deriveMaxHp(build: PBBuild, level: number): number | null {
  const attr = build.attributes;
  if (!attr) return null;
  const perLevel = (attr.classhp ?? 0) + (attr.bonushpPerLevel ?? 0);
  return (attr.ancestryhp ?? 0) + perLevel * level + (attr.bonushp ?? 0);
}

// ── PF2e static maps ──────────────────────────────────────────────────────────

const SKILL_ABILITY_MAP: Record<string, keyof NonNullable<PBBuild["abilities"]>> = {
  acrobatics:    "dex",
  arcana:        "int",
  athletics:     "str",
  crafting:      "int",
  deception:     "cha",
  diplomacy:     "cha",
  intimidation:  "cha",
  medicine:      "wis",
  nature:        "wis",
  occultism:     "int",
  performance:   "cha",
  religion:      "wis",
  society:       "int",
  stealth:       "dex",
  survival:      "wis",
  thievery:      "dex",
};

const SKILL_ORDER = [
  "acrobatics", "arcana", "athletics", "crafting", "deception",
  "diplomacy", "intimidation", "medicine", "nature", "occultism",
  "performance", "religion", "society", "stealth", "survival", "thievery",
];

const SAVE_LABELS: Record<string, string> = {
  fortitude: "Fort",
  reflex:    "Ref",
  will:      "Will",
};

const SAVE_ABILITY: Record<string, keyof NonNullable<PBBuild["abilities"]>> = {
  fortitude: "con",
  reflex:    "dex",
  will:      "wis",
};

const COMBAT_PROF_KEYS = new Set([
  "light_armor", "medium_armor", "heavy_armor", "unarmored",
  "simple_weapons", "martial_weapons", "advanced_weapons", "unarmed",
]);

// ── Shared presentational components ─────────────────────────────────────────

const PROF_STYLES: Record<number, string> = {
  0: "bg-muted text-muted-foreground",
  1: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  2: "bg-green-500/20 text-green-400 border border-green-500/30",
  3: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  4: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
};
const PROF_LETTERS = ["U", "T", "E", "M", "L"];
const PROF_NAMES   = ["Untrained", "Trained", "Expert", "Master", "Legendary"];

function ProfBadge({ rank }: { rank: number }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold shrink-0 ${PROF_STYLES[rank] ?? PROF_STYLES[0]}`}
      title={PROF_NAMES[rank] ?? "Untrained"}
    >
      {PROF_LETTERS[rank] ?? "U"}
    </span>
  );
}

function AbilityBlock({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex flex-col items-center py-3 px-1 bg-muted/60 rounded-lg border border-border/50">
      <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">{label}</span>
      <span className="text-xl font-bold font-mono mt-0.5">{abilityModStr(score)}</span>
      <span className="text-xs text-muted-foreground mt-0.5">{score}</span>
    </div>
  );
}

function PipRow({ count, max, color, label }: { count: number; max: number; color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-colors ${
              i < count ? `${color} border-transparent` : "border-muted-foreground/30 bg-transparent"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
      <Radio size={10} className="animate-pulse" />
      Live
    </span>
  );
}

function SaveBox({
  label,
  rank,
  abilityScore,
  level,
}: {
  label: string;
  rank: number;
  abilityScore: number;
  level: number;
}) {
  const total = profBonus(rank, level) + abilityModNum(abilityScore);
  return (
    <div className="flex flex-col items-center p-2 bg-muted/40 rounded-lg">
      <ProfBadge rank={rank} />
      <span className="text-xl font-bold font-mono mt-1">{signedTotal(total)}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</span>
    </div>
  );
}

// ── Companion card ────────────────────────────────────────────────────────────

function companionMaxHp(comp: BotCompanion, charLevel: number): number | null {
  if (comp.baseType !== "custom" || !comp.customStats) return null;
  const base = comp.customStats.hpPerLevel ?? 8;
  const con  = comp.customStats.abilities?.con ?? 0;
  if (comp.form === "young")   return base * charLevel;
  if (comp.form === "mature")  return (base + con) * charLevel;
  return (base + con + 1) * charLevel;
}

function CompanionCard({ comp, charLevel }: { comp: BotCompanion; charLevel: number }) {
  const maxHp     = companionMaxHp(comp, charLevel);
  const currentHp = comp.currentHp;
  const hpPct     = maxHp && currentHp !== null ? Math.max(0, Math.min(100, (currentHp / maxHp) * 100)) : null;
  return (
    <div className="p-3 bg-muted/40 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">{comp.displayName}</p>
          <p className="text-xs text-muted-foreground capitalize">{comp.baseType.replace(/-/g, " ")} · {comp.form}</p>
        </div>
        {currentHp !== null ? (
          maxHp ? (
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
              currentHp === 0 ? "text-destructive bg-destructive/10"
              : currentHp / maxHp < 0.3 ? "text-orange-400 bg-orange-500/10"
              : "text-green-400 bg-green-500/10"
            }`}>{currentHp}/{maxHp} HP</span>
          ) : (
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
              currentHp === 0 ? "text-destructive bg-destructive/10" : "text-green-400 bg-green-500/10"
            }`}>{currentHp} HP</span>
          )
        ) : (
          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">Not in combat</span>
        )}
      </div>
      {hpPct !== null && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${hpPct === 0 ? "bg-destructive" : hpPct < 30 ? "bg-orange-400" : "bg-green-400"}`}
            style={{ width: `${hpPct}%` }}
          />
        </div>
      )}
      {comp.notes && <p className="text-xs text-muted-foreground italic">{comp.notes}</p>}
    </div>
  );
}

// ── Mutation hooks ────────────────────────────────────────────────────────────

function useAddNote(characterId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { text: string; category: string; pinned?: boolean }>({
    mutationFn: (body) =>
      fetch(`/api/characters/${characterId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: notesKeys.all }),
  });
}

function useDeleteNote(characterId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { noteId: number }>({
    mutationFn: (body) =>
      fetch(`/api/characters/${characterId}/notes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: notesKeys.all }),
  });
}

function useSpendDowntime(characterId: string) {
  const qc = useQueryClient();
  return useMutation<{ actualDelta: number; clipped: boolean }, Error, { delta: number; reason: string }>({
    mutationFn: (body) =>
      fetch(`/api/characters/${characterId}/downtime`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: downtimeKeys.all }),
  });
}

function useAddItem() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { name: string; qty: number; category: string }>({
    mutationFn: (body) =>
      fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: bagKeys.mine() }),
  });
}

function useRemoveItem() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { category: string; itemName: string }>({
    mutationFn: (body) =>
      fetch("/api/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: bagKeys.mine() }),
  });
}

// ── Forms ─────────────────────────────────────────────────────────────────────

function AddNoteForm({ characterId, onClose }: { characterId: string; onClose: () => void }) {
  const addNote = useAddNote(characterId);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("npcs");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addNote.mutateAsync({ text: text.trim(), category });
    setText("");
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-border">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Category</label>
        <select className="input text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="npcs">🧑 NPCs</option>
          <option value="locations">🗺️ Locations</option>
          <option value="plot-threads">🎭 Plot Threads</option>
          <option value="influence">🤝 Influence</option>
          <option value="items">💎 Items</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Note</label>
        <textarea
          className="input text-sm resize-none"
          rows={3}
          placeholder="Write your session note here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          required
        />
      </div>
      {addNote.error && <p className="text-xs text-destructive">{addNote.error.message}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
        <button type="submit" disabled={addNote.isPending || !text.trim()} className="btn btn-primary btn-sm">
          {addNote.isPending ? "Saving…" : "Add Note"}
        </button>
      </div>
    </form>
  );
}

function SpendDowntimeForm({
  characterId,
  currentBank,
  onClose,
}: {
  characterId: string;
  currentBank: number;
  onClose: () => void;
}) {
  const spendMutation = useSpendDowntime(characterId);
  const [days, setDays] = useState("1");
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"spend" | "add">("spend");
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(days, 10);
    if (!n || n < 1) return;
    const delta  = mode === "spend" ? -n : n;
    const result = await spendMutation.mutateAsync({ delta, reason: reason.trim() });
    if (result.clipped) {
      setFeedback(`Only ${Math.abs(result.actualDelta)} day(s) deducted (not enough remaining).`);
    }
    setDays("1");
    setReason("");
    if (!result.clipped) onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-border">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode("spend")} className={`btn btn-sm flex-1 ${mode === "spend" ? "btn-primary" : "btn-ghost"}`}>Spend Days</button>
        <button type="button" onClick={() => setMode("add")}   className={`btn btn-sm flex-1 ${mode === "add"   ? "btn-primary" : "btn-ghost"}`}>Add Days</button>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">
          {mode === "spend" ? `Days to spend (have ${currentBank})` : "Days to add"}
        </label>
        <input
          className="input text-sm"
          type="number"
          min={1}
          max={mode === "spend" ? currentBank : undefined}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Reason (optional)</label>
        <input
          className="input text-sm"
          placeholder={mode === "spend" ? "e.g. Crafting, Studying…" : "e.g. Session reward"}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      {(spendMutation.error || feedback) && (
        <p className={`text-xs ${spendMutation.error ? "text-destructive" : "text-amber-400"}`}>
          {spendMutation.error?.message ?? feedback}
        </p>
      )}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
        <button type="submit" disabled={spendMutation.isPending || !days || parseInt(days) < 1} className="btn btn-primary btn-sm">
          {spendMutation.isPending ? "Saving…" : "Confirm"}
        </button>
      </div>
    </form>
  );
}

const DEFAULT_CATEGORIES = ["General", "Armor", "Weapons", "Potions", "Tools", "Valuables"];

function AddItemForm({
  existingCategories,
  onClose,
}: {
  existingCategories: string[];
  onClose: () => void;
}) {
  const addMutation = useAddItem();
  const [name, setName]           = useState("");
  const [qty, setQty]             = useState("1");
  const [category, setCategory]   = useState("");
  const [customCat, setCustomCat] = useState("");

  const allCats      = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories])).sort();
  const effectiveCat = category === "__custom__" ? customCat.trim() : category || "General";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const cat = category === "__custom__" ? customCat.trim() : category || "General";
    if (!cat) return;
    await addMutation.mutateAsync({ name: name.trim(), qty: parseInt(qty) || 1, category: cat });
    setName("");
    setQty("1");
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-border">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium">Add Item</p>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={15} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Item Name</label>
          <input className="input text-sm" placeholder="e.g. Healing Potion" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Quantity</label>
          <input className="input text-sm" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Category</label>
          <select className="input text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">General</option>
            {allCats.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value="__custom__">+ New category…</option>
          </select>
        </div>
        {category === "__custom__" && (
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">New Category Name</label>
            <input className="input text-sm" placeholder="e.g. Quest Items" value={customCat} onChange={(e) => setCustomCat(e.target.value)} required />
          </div>
        )}
      </div>
      {addMutation.error && <p className="text-xs text-destructive">{addMutation.error.message}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={addMutation.isPending || !name.trim() || (category === "__custom__" && !effectiveCat)}
        >
          {addMutation.isPending ? "Adding…" : "Add Item"}
        </button>
      </div>
    </form>
  );
}

// ── Tab panels ────────────────────────────────────────────────────────────────

function StatsTabPanel({ build, level }: { build: PBBuild; level: number }) {
  const abs   = build.abilities;
  const profs = build.proficiencies ?? {};

  return (
    <div className="space-y-5">
      {/* Perception */}
      {profs.perception !== undefined && abs && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Perception</h4>
          <div className="flex items-center gap-3 py-2 px-3 bg-muted/40 rounded-lg">
            <ProfBadge rank={profs.perception} />
            <span className="flex-1 text-sm font-medium">Perception</span>
            <span className="text-xs text-muted-foreground">WIS {abilityModStr(abs.wis)}</span>
            <span className="font-mono font-bold text-sm w-10 text-right">
              {signedTotal(profBonus(profs.perception, level) + abilityModNum(abs.wis))}
            </span>
          </div>
        </div>
      )}

      {/* Skills */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Skills</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
          {SKILL_ORDER.map((skill) => {
            const rank      = profs[skill] ?? 0;
            const abilKey   = SKILL_ABILITY_MAP[skill];
            const abilScore = abs ? (abs[abilKey] ?? 10) : 10;
            const total     = profBonus(rank, level) + abilityModNum(abilScore);
            return (
              <div key={skill} className="flex items-center gap-3 py-1.5 px-3 rounded-md hover:bg-muted/40 transition-colors">
                <ProfBadge rank={rank} />
                <span className="flex-1 text-sm capitalize">{skill}</span>
                <span className="text-xs text-muted-foreground uppercase w-7">{abilKey.slice(0, 3)}</span>
                <span className="font-mono font-bold text-sm w-10 text-right">{signedTotal(total)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weapon / Armor proficiencies */}
      {(() => {
        const combatProfs = Object.entries(profs).filter(([k]) => COMBAT_PROF_KEYS.has(k));
        if (combatProfs.length === 0) return null;
        return (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Armor & Weapons</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
              {combatProfs.map(([key, rank]) => (
                <div key={key} className="flex items-center gap-3 py-1.5 px-3 rounded-md hover:bg-muted/40 transition-colors">
                  <ProfBadge rank={rank} />
                  <span className="text-sm capitalize flex-1">{key.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function FeatsTabPanel({ build }: { build: PBBuild }) {
  const feats    = build.feats ?? [];
  const specials = build.specials ?? [];

  // Group feats by their type field (index 2 in the tuple)
  const grouped: Record<string, string[]> = {};
  feats.forEach((feat) => {
    const name = Array.isArray(feat) ? (feat[0] as string) : String(feat);
    const type = (Array.isArray(feat) ? (feat[2] as string | null) : null) ?? "Other";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(name);
  });

  const TYPE_ORDER = ["Class", "Ancestry", "Skill", "General", "Archetype", "Other"];

  return (
    <div className="space-y-5">
      {[...TYPE_ORDER, ...Object.keys(grouped).filter((t) => !TYPE_ORDER.includes(t))].map((type) => {
        const list = grouped[type];
        if (!list || list.length === 0) return null;
        return (
          <div key={type}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{type} Feats</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {list.map((name, i) => (
                <li key={i} className="text-sm py-1.5 px-3 bg-muted/40 rounded-md">{name}</li>
              ))}
            </ul>
          </div>
        );
      })}

      {specials.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Special Abilities</h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {specials.map((s, i) => (
              <li key={i} className="text-sm py-1.5 px-3 bg-muted/40 rounded-md">{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function GearTabPanel({ build }: { build: PBBuild }) {
  const equipment = build.equipment ?? [];

  return (
    <div className="space-y-5">
      {/* Character details */}
      {(build.deity || build.keyability || (build.languages && build.languages.length > 0)) && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Details</h4>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {build.deity && (
              <><dt className="text-muted-foreground">Deity</dt><dd>{build.deity}</dd></>
            )}
            {build.keyability && (
              <><dt className="text-muted-foreground">Key Ability</dt><dd className="capitalize">{build.keyability}</dd></>
            )}
            {build.languages && build.languages.length > 0 && (
              <><dt className="text-muted-foreground">Languages</dt><dd className="col-span-1">{build.languages.join(", ")}</dd></>
            )}
          </dl>
        </div>
      )}

      {/* Starting equipment from Pathbuilder */}
      {(equipment as unknown[]).length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Starting Equipment</h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {(equipment as unknown[]).map((item, i) => {
              const name = Array.isArray(item) ? item[0] : (item as { name: string }).name ?? String(item);
              const qty  = Array.isArray(item) ? item[1] : (item as { qty: number }).qty ?? 1;
              return (
                <li key={i} className="text-sm py-1.5 px-3 bg-muted/40 rounded-md flex items-center justify-between">
                  <span>{name}</span>
                  {qty > 1 && <span className="text-xs text-muted-foreground ml-2">×{qty}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Spell casters */}
      {build.spellCasters && build.spellCasters.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Spell Casters</h4>
          <div className="space-y-2">
            {build.spellCasters.map((sc, i) => (
              <div key={i} className="py-2 px-3 bg-muted/40 rounded-md">
                <p className="text-sm font-medium">{sc.name}</p>
                <p className="text-xs text-muted-foreground">Per day: {sc.perDay.join(" / ")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// BagTabPanel fetches its own data — only mounts when the Bag tab is active,
// so the query fires lazily on first visit rather than on page load.
function BagTabPanel() {
  const { data: bag, isLoading, error } = useBag();
  const removeMutation = useRemoveItem();
  const [showAddForm, setShowAddForm] = useState(false);

  const categories    = (bag?.categories ?? {}) as BagCategories;
  const categoryNames = Object.keys(categories).sort();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error.message}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {bag?.bag_name ?? (bag ? "Your bag" : "No bag yet")}
          {bag && categoryNames.length > 0 ? ` · ${categoryNames.length} categories` : ""}
        </p>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="btn btn-primary btn-sm flex items-center gap-1.5"
        >
          <Plus size={14} />
          Add Item
        </button>
      </div>

      {showAddForm && (
        <AddItemForm existingCategories={categoryNames} onClose={() => setShowAddForm(false)} />
      )}

      {!bag && !showAddForm && (
        <div className="text-center py-8">
          <Inbox size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No bag found. Add your first item above, or use{" "}
            <code className="bg-muted px-1 rounded">/bag add</code> in Discord.
          </p>
        </div>
      )}

      {bag && categoryNames.length === 0 && !showAddForm && (
        <div className="text-center py-8">
          <Package size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Bag is empty. Add items above or use{" "}
            <code className="bg-muted px-1 rounded">/bag add</code> in Discord.
          </p>
        </div>
      )}

      {categoryNames.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryNames.map((cat) => (
            <div key={cat} className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{cat}</h4>
              <ul className="space-y-1">
                {(categories[cat] ?? []).map((item: BagItem, i: number) => (
                  <li key={i} className="flex items-center justify-between text-sm group py-0.5">
                    <span>{item.name}</span>
                    <div className="flex items-center gap-2">
                      {item.qty !== 1 && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">×{item.qty}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeMutation.mutate({ category: cat, itemName: item.name })}
                        disabled={removeMutation.isPending}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity disabled:opacity-30"
                        title="Remove item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotesTabPanel({
  characterId,
  notesRecord,
}: {
  characterId: string;
  notesRecord: { notes: unknown } | null | undefined;
}) {
  const [showAddNote, setShowAddNote] = useState(false);
  const deleteNote = useDeleteNote(characterId);
  const notes      = notesRecord ? (notesRecord.notes as unknown as BotNote[]) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </p>
        {!showAddNote && (
          <button
            type="button"
            onClick={() => setShowAddNote(true)}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <Plus size={14} />
            Add Note
          </button>
        )}
      </div>

      {showAddNote && (
        <AddNoteForm characterId={characterId} onClose={() => setShowAddNote(false)} />
      )}

      {notes.length === 0 && !showAddNote && (
        <div className="text-center py-8">
          <BookOpen size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No session notes yet.</p>
        </div>
      )}

      {NOTE_CATEGORY_ORDER.map((catKey) => {
        const cat    = NOTE_CATEGORIES[catKey];
        const inCat  = notes
          .filter((n) => n.category === catKey)
          .sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return b.createdAt.localeCompare(a.createdAt);
          });
        if (inCat.length === 0) return null;
        return (
          <div key={catKey}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {cat.icon} {cat.label}
            </h4>
            <ul className="space-y-2">
              {inCat.map((note) => (
                <li key={note.id} className="text-sm bg-muted/40 rounded-lg p-3 space-y-1 group">
                  <div className="flex items-start justify-between gap-2">
                    <p className="leading-snug flex-1">{note.text}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {note.pinned && <span className="text-xs">📌</span>}
                      <button
                        type="button"
                        onClick={() => deleteNote.mutate({ noteId: note.id })}
                        disabled={deleteNote.isPending}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity disabled:opacity-30"
                        title="Delete note"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {note.authorName} · {new Date(note.createdAt).toLocaleDateString()}
                    {note.editedAt ? " (edited)" : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function DowntimeTabPanel({
  characterId,
  downtime,
}: {
  characterId: string;
  downtime: { bank: number; log: unknown } | null | undefined;
}) {
  const [showForm, setShowForm] = useState(false);

  if (!downtime) {
    return (
      <div className="text-center py-8">
        <CalendarDays size={32} className="mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          No downtime tracked yet. Use{" "}
          <code className="bg-muted px-1 rounded">/downtime</code> in Discord to start.
        </p>
      </div>
    );
  }

  const log = (downtime.log as unknown as DowntimeLogEntry[]).slice().reverse();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums">{downtime.bank}</span>
          <span className="text-sm text-muted-foreground">days available</span>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <Plus size={14} />
            Manage
          </button>
        )}
      </div>

      {showForm && (
        <SpendDowntimeForm
          characterId={characterId}
          currentBank={downtime.bank}
          onClose={() => setShowForm(false)}
        />
      )}

      {log.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Activity Log</h4>
          <ul className="space-y-0.5">
            {log.map((entry, i) => (
              <li key={i} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-md hover:bg-muted/40 transition-colors">
                <span className="text-muted-foreground">
                  {entry.date}{entry.reason ? ` · ${entry.reason}` : ""}
                </span>
                <span className={`font-mono font-semibold shrink-0 ml-3 ${entry.delta > 0 ? "text-green-400" : "text-orange-400"}`}>
                  {entry.delta > 0 ? "+" : ""}{entry.delta}d
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CharacterDetailPage() {
  const params      = useParams();
  const { user }    = useAuth();
  const characterId = params.id as string;

  const { data: character, isLoading, error } = useCharacterLive(characterId, {
    enabled: !!characterId && !!user,
  });
  const syncMutation                    = useSyncCharacter();
  const [syncError, setSyncError]       = useState<string | null>(null);
  const [tab, setTab]                   = useState<TabKey>("stats");

  const charKey = character ? (character as unknown as { char_key: string | null }).char_key : null;
  const { data: downtime }    = useCharacterDowntime(charKey);
  const { data: notesRecord } = useCharacterNotes(charKey);

  // ── Loading / error states ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      </MainLayout>
    );
  }

  if (error || !character) {
    return (
      <MainLayout>
        <div className="card p-6 bg-destructive/10 border-destructive">
          <p className="text-destructive font-semibold">Character not found</p>
          <p className="text-sm text-muted-foreground mt-1">{error?.message}</p>
          <Link href="/characters" className="mt-4 inline-flex items-center gap-2 text-sm text-primary">
            <ArrowLeft size={14} /> Back to characters
          </Link>
        </div>
      </MainLayout>
    );
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const pb    = character.pathbuilder_data as { build?: PBBuild } | PBBuild | null;
  const build = pb ? ((pb as { build?: PBBuild }).build ?? (pb as PBBuild)) : null;
  const abs   = build?.abilities;

  const currentHp  = (character as unknown as { current_hp: number | null }).current_hp;
  const overlay    = (character as unknown as { overlay: CharacterOverlay }).overlay ?? {};
  const daily      = overlay.daily;
  const hasLiveHp  = currentHp !== null && currentHp !== undefined;

  const level   = character.level ?? build?.level ?? 1;
  const maxHp   = build ? deriveMaxHp(build, level) : null;
  const dying   = character.dying ?? 0;
  const wounded = character.wounded ?? 0;

  const heroPoints = daily?.hero_points ?? character.hero_points ?? 1;
  const focusSpent = daily?.focus_spent ?? 0;
  const focusMax   = (build?.spellCasters ?? []).reduce(
    (sum, c) => sum + ((c as unknown as { focusPoints?: number }).focusPoints ?? 0), 0
  );

  const profs         = build?.proficiencies ?? {};
  const hasCompanions = overlay.companions && Object.keys(overlay.companions).length > 0;

  // ── Tab definitions ───────────────────────────────────────────────────────

  type TabDef = { key: TabKey; label: string };
  const tabs: TabDef[] = [
    { key: "stats",     label: "Stats"     },
    { key: "feats",     label: "Feats"     },
    { key: "gear",      label: "Gear"      },
    { key: "bag",       label: "Bag"       },
    { key: "notes",     label: "Notes"     },
    { key: "downtime",  label: "Downtime"  },
    ...(hasCompanions ? [{ key: "companions" as TabKey, label: "Companions" }] : []),
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <MainLayout>
      {/* Back link */}
      <div className="mb-4">
        <Link href="/characters" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
          Back to Characters
        </Link>
      </div>

      <div className="space-y-4">

        {/* ── Header Card ────────────────────────────────────────────────── */}
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl font-bold leading-tight">{character.name}</h1>
              <p className="text-muted-foreground mt-0.5">
                Level {level}
                {" · "}
                {[character.ancestry_name, character.heritage_name, character.class_name].filter(Boolean).join(" ")}
              </p>
              {character.background_name && (
                <p className="text-sm text-muted-foreground mt-0.5">{character.background_name} background</p>
              )}
              {build?.languages && build.languages.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1 opacity-70">{build.languages.join(" · ")}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              {(character as unknown as { pathbuilder_id: number | null }).pathbuilder_id && (
                <button
                  onClick={async () => {
                    setSyncError(null);
                    try { await syncMutation.mutateAsync(characterId); }
                    catch (err) { setSyncError(err instanceof Error ? err.message : "Sync failed"); }
                  }}
                  disabled={syncMutation.isPending}
                  className="btn-outline flex items-center gap-2 text-sm"
                  title="Re-fetch latest data from Pathbuilder"
                >
                  <RefreshCw size={14} className={syncMutation.isPending ? "animate-spin" : ""} />
                  {syncMutation.isPending ? "Syncing…" : "Sync"}
                </button>
              )}
              <span className={`text-sm px-3 py-1 rounded-full ${
                character.status === "active"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-muted text-muted-foreground"
              }`}>
                {character.status}
              </span>
            </div>
          </div>
          {syncMutation.isSuccess && <p className="text-xs text-green-400 mt-2">Sheet refreshed from Pathbuilder.</p>}
          {syncError && <p className="text-xs text-destructive mt-2">{syncError}</p>}
        </div>

        {/* ── Vitals Card ────────────────────────────────────────────────── */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vitals</h2>
            {hasLiveHp && <LiveBadge />}
          </div>

          {/* HP bar */}
          {hasLiveHp && maxHp ? (
            <HealthBar currentHp={currentHp!} maxHp={maxHp} size="lg" />
          ) : maxHp ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-muted-foreground/20 rounded-full w-full" />
              </div>
              <span className="text-xs text-muted-foreground shrink-0">Max {maxHp} HP</span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic flex items-center gap-1.5">
              <Zap size={12} className="opacity-40" />
              HP will appear once the bot syncs this character.
            </div>
          )}

          {/* Dying / Wounded */}
          {(dying > 0 || wounded > 0) && (
            <div className="flex gap-3 flex-wrap">
              {dying > 0 && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-destructive bg-destructive/10 px-3 py-1 rounded-full">
                  <Heart size={14} /> Dying {dying}
                </span>
              )}
              {wounded > 0 && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full">
                  <Flame size={14} /> Wounded {wounded}
                </span>
              )}
            </div>
          )}

          {/* Perception + Saves row */}
          {abs && (
            <div className="grid grid-cols-4 gap-2">
              <SaveBox
                label="Perception"
                rank={profs.perception ?? 0}
                abilityScore={abs.wis}
                level={level}
              />
              {(["fortitude", "reflex", "will"] as const).map((save) => (
                <SaveBox
                  key={save}
                  label={SAVE_LABELS[save]}
                  rank={profs[save] ?? 0}
                  abilityScore={abs[SAVE_ABILITY[save]] ?? 10}
                  level={level}
                />
              ))}
            </div>
          )}

          {/* Hero / Focus pips */}
          <div className="space-y-2">
            <PipRow count={heroPoints} max={3} color="bg-yellow-400" label="Hero Points" />
            {focusMax > 0 && (
              <PipRow count={Math.max(0, focusMax - focusSpent)} max={focusMax} color="bg-blue-400" label="Focus Pool" />
            )}
          </div>

          {/* Spell slots used today */}
          {daily?.slots_used && Object.keys(daily.slots_used).length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Spell Slots — Today</p>
              {Object.entries(daily.slots_used).map(([caster, ranks]) => (
                <div key={caster}>
                  <p className="text-xs text-muted-foreground mb-1">{caster}</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ranks).map(([rank, used]) =>
                      used > 0 ? (
                        <span key={rank} className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                          Rank {rank}: {used} used
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Ability Scores ──────────────────────────────────────────────── */}
        {abs && (
          <div className="grid grid-cols-6 gap-2">
            <AbilityBlock label="STR" score={abs.str} />
            <AbilityBlock label="DEX" score={abs.dex} />
            <AbilityBlock label="CON" score={abs.con} />
            <AbilityBlock label="INT" score={abs.int} />
            <AbilityBlock label="WIS" score={abs.wis} />
            <AbilityBlock label="CHA" score={abs.cha} />
          </div>
        )}

        {/* ── Tabbed section ───────────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-border overflow-x-auto">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {label}
                {/* Subtle count badges for notes/downtime */}
                {key === "notes" && notesRecord && (
                  <span className="ml-1.5 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-normal">
                    {(notesRecord.notes as unknown as BotNote[]).length}
                  </span>
                )}
                {key === "downtime" && downtime && (
                  <span className="ml-1.5 text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-normal">
                    {downtime.bank}d
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5">
            {tab === "stats" && (
              build
                ? <StatsTabPanel build={build} level={level} />
                : <p className="text-sm text-muted-foreground italic">No Pathbuilder data available.</p>
            )}
            {tab === "feats" && (
              build
                ? <FeatsTabPanel build={build} />
                : <p className="text-sm text-muted-foreground italic">No Pathbuilder data available.</p>
            )}
            {tab === "gear" && (
              build
                ? <GearTabPanel build={build} />
                : <p className="text-sm text-muted-foreground italic">No Pathbuilder data available.</p>
            )}
            {tab === "bag" && <BagTabPanel />}
            {tab === "notes" && (
              <NotesTabPanel characterId={characterId} notesRecord={notesRecord} />
            )}
            {tab === "downtime" && (
              <DowntimeTabPanel characterId={characterId} downtime={downtime} />
            )}
            {tab === "companions" && hasCompanions && (
              <div className="space-y-2">
                {Object.entries(overlay.companions!).map(([key, comp]) => (
                  <CompanionCard key={key} comp={comp} charLevel={level} />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
