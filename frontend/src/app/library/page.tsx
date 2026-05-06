"use client";

import { MainLayout } from "@/components/layout";
import { BookOpen, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMonsters } from "@/lib/hooks/use-monsters";
import { useItems } from "@/lib/hooks/use-items";
import type { Tables } from "@/lib/types/database.types";

// ── Types ─────────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;
type LegacyTab = "ancestries" | "classes" | "spells" | "feats" | "backgrounds";
type Tab = LegacyTab | "monsters" | "items";

const TABS: { id: Tab; label: string }[] = [
  { id: "ancestries",  label: "Ancestries"  },
  { id: "classes",     label: "Classes"     },
  { id: "spells",      label: "Spells"      },
  { id: "feats",       label: "Feats"       },
  { id: "backgrounds", label: "Backgrounds" },
  { id: "monsters",    label: "Monsters"    },
  { id: "items",       label: "Items"       },
];

const LEGACY_TABS = new Set<Tab>(["ancestries", "classes", "spells", "feats", "backgrounds"]);

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Fetch legacy content tabs (ancestries, classes, spells, feats, backgrounds) */
function useContent(tab: LegacyTab, q: string, page: number, enabled = true) {
  return useQuery({
    queryKey: ["library", tab, q, page],
    queryFn: async () => {
      const qs = new URLSearchParams({ limit: "24", page: String(page) });
      if (q) qs.set("q", q);
      const res = await fetch(`/api/content/${tab}?${qs}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<{ data: Row[]; total: number; page: number; limit: number }>;
    },
    enabled,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function str(v: unknown): string { return (v as string) ?? ""; }
function num(v: unknown): number { return (v as number) ?? 0; }
function bool(v: unknown): boolean { return Boolean(v); }

// ── Card components ───────────────────────────────────────────────────────────

function LegacyCard({ item, tab }: { item: Row; tab: LegacyTab }) {
  const href = `/library/${tab}/${str(item.id)}`;
  const rarity = str(item.rarity);
  const traditions = Array.isArray(item.traditions) ? (item.traditions as string[]) : [];
  return (
    <Link href={href} className="card p-5 hover:shadow-md transition-all block">
      <div className="flex items-start justify-between mb-2">
        <p className="font-semibold">{str(item.name)}</p>
        {rarity && rarity !== "Common" && (
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full ml-2 shrink-0">{rarity}</span>
        )}
      </div>
      {tab === "spells" && (
        <p className="text-xs text-muted-foreground mb-2">
          Level {num(item.level)}
          {bool(item.is_focus_spell) ? " · Focus" : ""}
          {bool(item.is_ritual) ? " · Ritual" : ""}
          {traditions.length > 0 ? ` · ${traditions.join(", ")}` : ""}
        </p>
      )}
      {tab === "feats" && (
        <p className="text-xs text-muted-foreground mb-2">
          Level {num(item.level)}
          {item.feat_type ? ` · ${str(item.feat_type).replace(/_/g, " ")}` : ""}
        </p>
      )}
      {tab === "classes" && (
        <p className="text-xs text-muted-foreground mb-2">
          {num(item.class_hp)} HP · {bool(item.is_spellcaster) ? "Spellcaster" : "Martial"}
        </p>
      )}
      <p className="text-sm text-muted-foreground line-clamp-2">
        {str(item.description) || "—"}
      </p>
    </Link>
  );
}

type MonsterRow = Tables<"monsters">;

function MonsterCard({ monster }: { monster: MonsterRow }) {
  // NOTE: the API select() does NOT include monster_metadata — read from columns directly
  const rarity       = str(monster.rarity ?? "");
  const creatureType = str(monster.creature_type ?? "");
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-2">
        <p className="font-semibold">{monster.name}</p>
        {rarity && rarity !== "Common" && (
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full ml-2 shrink-0">{rarity}</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Level {monster.level ?? "?"}
        {creatureType ? ` · ${creatureType}` : ""}
        {monster.is_companion ? " · Companion" : ""}
      </p>
    </div>
  );
}

type ItemRow = Tables<"items">;

function ItemCard({ item }: { item: ItemRow }) {
  const rarity = str(item.rarity);
  return (
    <Link href={`/library/items/${item.id}`} className="card p-5 hover:shadow-md transition-all block">
      <div className="flex items-start justify-between mb-2">
        <p className="font-semibold">{item.name}</p>
        {rarity && rarity !== "Common" && (
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full ml-2 shrink-0">{rarity}</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        Level {item.level ?? 0}
        {item.item_type ? ` · ${str(item.item_type).replace(/_/g, " ")}` : ""}
        {item.bulk ? ` · ${item.bulk} bulk` : ""}
      </p>
      <p className="text-sm text-muted-foreground line-clamp-2">
        {str(item.description) || "—"}
      </p>
    </Link>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pager({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="btn-outline px-4 py-2 text-sm disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages} ({total} total)
      </span>
      <button
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="btn-outline px-4 py-2 text-sm disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

// ── Tab-specific filter UI ────────────────────────────────────────────────────

const CREATURE_TYPES = [
  "Aberration", "Animal", "Astral", "Beast", "Celestial", "Construct",
  "Dragon", "Dream", "Elemental", "Fey", "Fiend", "Fungus", "Giant",
  "Humanoid", "Monitor", "Ooze", "Plant", "Undead",
];

const ITEM_TYPES = [
  "armor", "weapon", "shield", "consumable", "equipment", "held_item",
  "rune", "snare", "staff", "wand", "worn_item",
];

// ── Main page ─────────────────────────────────────────────────────────────────

function LibraryContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab | null) ?? "ancestries";

  const [tab, setTab]                 = useState<Tab>(initialTab);
  const [q, setQ]                     = useState("");
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(1);
  const [creatureType, setCreatureType] = useState("");
  const [itemType, setItemType]       = useState("");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => { setSearch(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  // Reset page + filters when tab changes
  useEffect(() => {
    setPage(1);
    setCreatureType("");
    setItemType("");
  }, [tab]);

  // ── Data fetching ───────────────────────────────────────────────────────────

  const isLegacy = LEGACY_TABS.has(tab);

  const legacyResult = useContent(
    tab as LegacyTab,
    search,
    page,
    isLegacy, // don't fire for monsters/items tabs
  );

  const monstersResult = useMonsters(
    { q: search, creature_type: creatureType || undefined, is_companion: false, page, limit: 24 },
    { enabled: tab === "monsters" },
  );

  const itemsResult = useItems(
    { q: search, item_type: itemType || undefined, page, limit: 24 },
    { enabled: tab === "items" },
  );

  // Unify loading / data across tabs
  const isLoading = isLegacy
    ? legacyResult.isLoading
    : tab === "monsters"
    ? monstersResult.isLoading
    : itemsResult.isLoading;

  const total = isLegacy
    ? (legacyResult.data?.total ?? 0)
    : tab === "monsters"
    ? (monstersResult.data?.total ?? 0)
    : (itemsResult.data?.total ?? 0);

  const totalPages = Math.max(1, Math.ceil(total / 24));

  return (
    <MainLayout>
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-lg bg-primary/10">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-4xl font-bold mb-1">Content Library</h1>
          <p className="text-muted-foreground">
            Pathfinder 2e rules — ancestries, classes, spells, feats, backgrounds, monsters, items
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4 mb-4 flex items-center gap-3">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${tab}…`}
          className="input flex-1 border-0 bg-transparent p-0 focus:ring-0"
        />
      </div>

      {/* Tab-specific filters */}
      {tab === "monsters" && (
        <div className="flex gap-3 mb-4">
          <select
            value={creatureType}
            onChange={(e) => { setCreatureType(e.target.value); setPage(1); }}
            className="input text-sm"
          >
            <option value="">All creature types</option>
            {CREATURE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}
      {tab === "items" && (
        <div className="flex gap-3 mb-4">
          <select
            value={itemType}
            onChange={(e) => { setItemType(e.target.value); setPage(1); }}
            className="input text-sm"
          >
            <option value="">All item types</option>
            {ITEM_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex space-x-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-3 px-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12"><div className="spinner mx-auto" /></div>
      ) : (
        <>
          {/* Legacy tabs */}
          {isLegacy && (() => {
            const items = legacyResult.data?.data ?? [];
            return items.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-muted-foreground">
                  No {tab} found{search ? ` matching "${search}"` : ""}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <LegacyCard key={str(item.id)} item={item} tab={tab as LegacyTab} />
                ))}
              </div>
            );
          })()}

          {/* Monsters tab */}
          {tab === "monsters" && (() => {
            if (monstersResult.error) return (
              <div className="card text-center py-12">
                <p className="text-destructive text-sm font-medium mb-1">Failed to load monsters</p>
                <p className="text-muted-foreground text-xs">{monstersResult.error.message}</p>
              </div>
            );
            const monsters = monstersResult.data?.data ?? [];
            return monsters.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-muted-foreground">
                  No monsters found{search ? ` matching "${search}"` : ""}
                  {creatureType ? ` of type "${creatureType}"` : ""}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monsters.map((m) => (
                  <MonsterCard key={m.id} monster={m} />
                ))}
              </div>
            );
          })()}

          {/* Items tab */}
          {tab === "items" && (() => {
            if (itemsResult.error) return (
              <div className="card text-center py-12">
                <p className="text-destructive text-sm font-medium mb-1">Failed to load items</p>
                <p className="text-muted-foreground text-xs">{itemsResult.error.message}</p>
              </div>
            );
            const items = itemsResult.data?.data ?? [];
            return items.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-muted-foreground">
                  No items found{search ? ` matching "${search}"` : ""}
                  {itemType ? ` of type "${itemType}"` : ""}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            );
          })()}

          <Pager page={page} totalPages={totalPages} total={total} onPage={setPage} />
        </>
      )}
    </MainLayout>
  );
}

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        </MainLayout>
      }
    >
      <LibraryContent />
    </Suspense>
  );
}
