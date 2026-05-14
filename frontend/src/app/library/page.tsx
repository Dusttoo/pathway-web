"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Search } from "lucide-react";
import { MainLayout } from "@/components/layout";
import { AonLink, aonUrlFromMetadata } from "@/components/library/AonLink";
import { useItems } from "@/lib/hooks/use-items";
import { useMonsters } from "@/lib/hooks/use-monsters";
import type { GamedataCategory } from "@/lib/hooks/use-gamedata";
import type { Tables } from "@/lib/types/database.types";

type Row = Record<string, unknown>;
type LegacyTab = "ancestries" | "classes" | "spells" | "feats" | "backgrounds";
type DirectTab = LegacyTab | "monsters" | "items";
type Tab = DirectTab | GamedataCategory;

type GamedataRow = Tables<"gamedata">;
type MonsterRow = Tables<"monsters">;
type ItemRow = Tables<"items">;

const DIRECT_TABS: { id: DirectTab; label: string; description: string }[] = [
  { id: "ancestries", label: "Ancestries", description: "Ancestries and core ancestry stats" },
  { id: "classes", label: "Classes", description: "Classes and class chassis" },
  { id: "spells", label: "Spells", description: "Spells, focus spells, and rituals where stored" },
  {
    id: "feats",
    label: "Feats",
    description: "Class, skill, ancestry, general, and archetype feats",
  },
  {
    id: "backgrounds",
    label: "Backgrounds",
    description: "Backgrounds and trained skill packages",
  },
  {
    id: "monsters",
    label: "Monsters",
    description: "Bestiary creatures, companions, and stat blocks",
  },
  {
    id: "items",
    label: "Items",
    description: "Equipment, treasure, weapons, armor, and consumables",
  },
];

const GAMEDATA_TABS: { id: GamedataCategory; label: string; description: string }[] = [
  { id: "actions", label: "Actions", description: "General actions, activities, and reactions" },
  {
    id: "afflictions",
    label: "Afflictions",
    description: "Diseases, curses, poisons, and other afflictions",
  },
  {
    id: "class_features",
    label: "Class Features",
    description: "Named class features and class options",
  },
  {
    id: "companions",
    label: "Companions",
    description: "Animal companions, familiars, eidolons, and pet options",
  },
  { id: "conditions", label: "Conditions", description: "PF2e conditions and rules text" },
  {
    id: "creature_extras",
    label: "Creature Extras",
    description: "Creature abilities and related references",
  },
  { id: "deities", label: "Deities", description: "Gods, faiths, domains, edicts, and anathema" },
  { id: "domains", label: "Domains", description: "Cleric domains and focus references" },
  { id: "familiars", label: "Familiars", description: "Familiar abilities and familiar options" },
  {
    id: "hazards",
    label: "Hazards",
    description: "Hazards, traps, and complex encounter obstacles",
  },
  {
    id: "heritages",
    label: "Heritages",
    description: "Ancestry heritages and versatile heritages",
  },
  {
    id: "kingdom",
    label: "Kingdom",
    description: "Kingdom building and campaign rules references",
  },
  { id: "languages", label: "Languages", description: "Languages and language traits" },
  { id: "planes", label: "Planes", description: "Planes and planar reference entries" },
  { id: "relics", label: "Relics", description: "Relic gifts and relic-related content" },
  { id: "rituals", label: "Rituals", description: "Rituals and ritual casting references" },
  { id: "rules", label: "Rules", description: "Rules pages and general reference entries" },
  {
    id: "siege_weapons",
    label: "Siege Weapons",
    description: "Siege engines and large-scale weapons",
  },
  { id: "skills", label: "Skills", description: "Skills, skill uses, and skill action references" },
  { id: "sources", label: "Sources", description: "Book and source references" },
  { id: "traits", label: "Traits", description: "Trait glossary and trait rules" },
  { id: "vehicles", label: "Vehicles", description: "Vehicles and vehicle rules" },
];

const ALL_TABS = [...DIRECT_TABS, ...GAMEDATA_TABS] as const;
const DIRECT_TAB_IDS = new Set<string>(DIRECT_TABS.map((tab) => tab.id));
const LEGACY_TABS = new Set<string>(["ancestries", "classes", "spells", "feats", "backgrounds"]);

const CREATURE_TYPES = [
  "Aberration",
  "Animal",
  "Astral",
  "Beast",
  "Celestial",
  "Construct",
  "Dragon",
  "Dream",
  "Elemental",
  "Fey",
  "Fiend",
  "Fungus",
  "Giant",
  "Humanoid",
  "Monitor",
  "Ooze",
  "Plant",
  "Undead",
];

const ITEM_TYPES = [
  "armor",
  "weapon",
  "shield",
  "consumable",
  "equipment",
  "held_item",
  "rune",
  "snare",
  "staff",
  "wand",
  "worn_item",
];

function str(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function num(value: unknown): number {
  return typeof value === "number" ? value : Number(value) || 0;
}

function bool(value: unknown): boolean {
  return Boolean(value);
}

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function dataObject(data: unknown): Record<string, unknown> {
  return data && typeof data === "object" && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : {};
}

function contentDescription(data: unknown): string {
  const obj = dataObject(data);
  const candidates = [obj.description, obj.text, obj.summary, obj.effect, obj.details, obj.flavor];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return "";
}

function contentMeta(data: unknown): string {
  const obj = dataObject(data);
  const parts = [obj.level != null ? `Level ${obj.level}` : "", str(obj.rarity), str(obj.source)]
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.join(" · ");
}

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

function useGamedataContent(category: GamedataCategory, q: string, page: number, enabled = true) {
  return useQuery({
    queryKey: ["library", "gamedata", category, q, page],
    queryFn: async () => {
      const qs = new URLSearchParams({ category, limit: "24", page: String(page) });
      if (q) qs.set("q", q);
      const res = await fetch(`/api/content/gamedata?${qs}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<{
        data: GamedataRow[];
        total: number;
        page: number;
        limit: number;
        category: string;
      }>;
    },
    enabled,
  });
}

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
    <div className="mt-8 flex items-center justify-center gap-3">
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

function LegacyCard({ item, tab }: { item: Row; tab: LegacyTab }) {
  const rarity = str(item.rarity);
  const traditions = list(item.traditions);
  const href = `/library/${tab}/${str(item.id)}`;
  const metadata =
    item.spell_metadata ?? item.feat_metadata ?? item.background_metadata ?? item.class_metadata;

  return (
    <div className="card block p-5 transition-all hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-3">
        <Link href={href} className="font-semibold hover:text-primary">
          {str(item.name)}
        </Link>
        {rarity && rarity !== "Common" && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">{rarity}</span>
        )}
      </div>

      {tab === "spells" && (
        <p className="mb-2 text-xs text-muted-foreground">
          Level {num(item.level)}
          {bool(item.is_focus_spell) ? " · Focus" : ""}
          {bool(item.is_ritual) ? " · Ritual" : ""}
          {traditions.length > 0 ? ` · ${traditions.join(", ")}` : ""}
        </p>
      )}
      {tab === "feats" && (
        <p className="mb-2 text-xs text-muted-foreground">
          Level {num(item.level)}
          {item.feat_type ? ` · ${str(item.feat_type).replace(/_/g, " ")}` : ""}
        </p>
      )}
      {tab === "classes" && (
        <p className="mb-2 text-xs text-muted-foreground">
          {num(item.class_hp)} HP · {bool(item.is_spellcaster) ? "Spellcaster" : "Martial"}
        </p>
      )}

      <p className="line-clamp-2 text-sm text-muted-foreground">{str(item.description) || "—"}</p>
      <AonLink
        name={str(item.name)}
        url={aonUrlFromMetadata(metadata)}
        isOfficial={item.is_official as boolean | null}
        className="mt-3"
      />
    </div>
  );
}

function MonsterCard({ monster }: { monster: MonsterRow }) {
  const rarity = str(monster.rarity);
  const creatureType = str(monster.creature_type);
  const metadata = (monster as MonsterRow & { monster_metadata?: unknown }).monster_metadata;

  return (
    <div className="card p-5">
      <div className="mb-2 flex items-start justify-between gap-3">
        <Link href={`/library/monsters/${monster.id}`} className="font-semibold hover:text-primary">
          {monster.name}
        </Link>
        {rarity && rarity !== "Common" && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">{rarity}</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Level {monster.level ?? "?"}
        {creatureType ? ` · ${creatureType}` : ""}
        {monster.is_companion ? " · Companion" : ""}
      </p>
      <AonLink
        name={monster.name}
        url={aonUrlFromMetadata(metadata)}
        isOfficial={monster.is_official}
        className="mt-3"
      />
    </div>
  );
}

function ItemCard({ item }: { item: ItemRow }) {
  const rarity = str(item.rarity);
  const metadata = (item as ItemRow & { item_metadata?: unknown }).item_metadata;

  return (
    <div className="card p-5 transition-all hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-3">
        <Link href={`/library/items/${item.id}`} className="font-semibold hover:text-primary">
          {item.name}
        </Link>
        {rarity && rarity !== "Common" && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">{rarity}</span>
        )}
      </div>
      <p className="mb-2 text-xs text-muted-foreground">
        Level {item.level ?? 0}
        {item.item_type ? ` · ${str(item.item_type).replace(/_/g, " ")}` : ""}
        {item.bulk ? ` · ${item.bulk} bulk` : ""}
      </p>
      <p className="line-clamp-2 text-sm text-muted-foreground">{str(item.description) || "—"}</p>
      <AonLink
        name={item.name}
        url={aonUrlFromMetadata(metadata)}
        isOfficial={item.is_official}
        className="mt-3"
      />
    </div>
  );
}

function GamedataCard({ row, category }: { row: GamedataRow; category: GamedataCategory }) {
  const description = contentDescription(row.data);
  const meta = contentMeta(row.data);
  const data = dataObject(row.data);
  const name = row.name ?? row.slug;

  return (
    <div className="card p-5 transition-all hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-3">
        <Link
          href={`/library/reference/${category}/${row.slug}`}
          className="font-semibold hover:text-primary"
        >
          {name}
        </Link>
        {str(data.rarity) && str(data.rarity) !== "Common" && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">
            {str(data.rarity)}
          </span>
        )}
      </div>
      {meta && <p className="mb-2 text-xs text-muted-foreground">{meta}</p>}
      <p className="line-clamp-2 text-sm text-muted-foreground">{description || "—"}</p>
      <AonLink name={name} url={aonUrlFromMetadata(row.data)} className="mt-3" />
    </div>
  );
}

function LibraryContent() {
  const searchParams = useSearchParams();
  const initialTabParam = searchParams.get("tab") as Tab | null;
  const initialTab = ALL_TABS.some((item) => item.id === initialTabParam)
    ? initialTabParam!
    : "ancestries";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [creatureType, setCreatureType] = useState("");
  const [itemType, setItemType] = useState("");

  const selectedTab = useMemo(() => ALL_TABS.find((item) => item.id === tab), [tab]);
  const isLegacy = LEGACY_TABS.has(tab);
  const isDirect = DIRECT_TAB_IDS.has(tab);
  const isGamedata = !isDirect;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [q]);

  useEffect(() => {
    setPage(1);
    setCreatureType("");
    setItemType("");
  }, [tab]);

  const legacyResult = useContent(tab as LegacyTab, search, page, isLegacy);
  const monstersResult = useMonsters(
    { q: search, creature_type: creatureType || undefined, is_companion: false, page, limit: 24 },
    { enabled: tab === "monsters" }
  );
  const itemsResult = useItems(
    { q: search, item_type: itemType || undefined, page, limit: 24 },
    { enabled: tab === "items" }
  );
  const gamedataResult = useGamedataContent(tab as GamedataCategory, search, page, isGamedata);

  const isLoading = isLegacy
    ? legacyResult.isLoading
    : tab === "monsters"
      ? monstersResult.isLoading
      : tab === "items"
        ? itemsResult.isLoading
        : gamedataResult.isLoading;

  const total = isLegacy
    ? (legacyResult.data?.total ?? 0)
    : tab === "monsters"
      ? (monstersResult.data?.total ?? 0)
      : tab === "items"
        ? (itemsResult.data?.total ?? 0)
        : (gamedataResult.data?.total ?? 0);

  const totalPages = Math.max(1, Math.ceil(total / 24));

  return (
    <MainLayout>
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-lg bg-primary/10 p-3">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="mb-1 font-heading text-4xl font-bold">Content Library</h1>
          <p className="text-muted-foreground">
            Pathfinder 2e content for characters, rules, creatures, equipment, and campaign play.
          </p>
        </div>
      </div>

      <div className="card mb-4 flex items-center gap-3 p-4">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder={`Search ${selectedTab?.label ?? "library"}...`}
          className="input flex-1 border-0 bg-transparent p-0 focus:ring-0"
        />
      </div>

      <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm font-medium text-foreground">{selectedTab?.label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{selectedTab?.description}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Official entries include Archives of Nethys links. When a precise AoN URL is not stored,
          Pathway links to the matching AoN search result.
        </p>
      </div>

      {tab === "monsters" && (
        <div className="mb-4 flex gap-3">
          <select
            value={creatureType}
            onChange={(event) => {
              setCreatureType(event.target.value);
              setPage(1);
            }}
            className="input text-sm"
          >
            <option value="">All creature types</option>
            {CREATURE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      )}

      {tab === "items" && (
        <div className="mb-4 flex gap-3">
          <select
            value={itemType}
            onChange={(event) => {
              setItemType(event.target.value);
              setPage(1);
            }}
            className="input text-sm"
          >
            <option value="">All item types</option>
            {ITEM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-6 border-b border-border">
        <nav className="flex gap-1 overflow-x-auto">
          {ALL_TABS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                tab === item.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="spinner mx-auto" />
        </div>
      ) : (
        <>
          {isLegacy &&
            (() => {
              const items = legacyResult.data?.data ?? [];
              return items.length === 0 ? (
                <EmptyState tab={selectedTab?.label ?? String(tab)} search={search} />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <LegacyCard key={str(item.id)} item={item} tab={tab as LegacyTab} />
                  ))}
                </div>
              );
            })()}

          {tab === "monsters" &&
            (() => {
              if (monstersResult.error)
                return <ErrorState label="monsters" error={monstersResult.error} />;
              const monsters = monstersResult.data?.data ?? [];
              return monsters.length === 0 ? (
                <EmptyState tab="monsters" search={search} />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {monsters.map((monster) => (
                    <MonsterCard key={monster.id} monster={monster} />
                  ))}
                </div>
              );
            })()}

          {tab === "items" &&
            (() => {
              if (itemsResult.error) return <ErrorState label="items" error={itemsResult.error} />;
              const items = itemsResult.data?.data ?? [];
              return items.length === 0 ? (
                <EmptyState tab="items" search={search} />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              );
            })()}

          {isGamedata &&
            (() => {
              if (gamedataResult.error) {
                return (
                  <ErrorState
                    label={selectedTab?.label ?? String(tab)}
                    error={gamedataResult.error}
                  />
                );
              }
              const rows = gamedataResult.data?.data ?? [];
              return rows.length === 0 ? (
                <EmptyState tab={selectedTab?.label ?? String(tab)} search={search} />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {rows.map((row) => (
                    <GamedataCard
                      key={`${row.category}-${row.slug}`}
                      row={row}
                      category={tab as GamedataCategory}
                    />
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

function EmptyState({ tab, search }: { tab: string; search: string }) {
  return (
    <div className="card py-12 text-center">
      <p className="text-muted-foreground">
        No {tab} found{search ? ` matching "${search}"` : ""}.
      </p>
    </div>
  );
}

function ErrorState({ label, error }: { label: string; error: Error }) {
  return (
    <div className="card py-12 text-center">
      <p className="mb-1 text-sm font-medium text-destructive">Failed to load {label}</p>
      <p className="text-xs text-muted-foreground">{error.message}</p>
    </div>
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
