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
import type { GlobalSearchResult } from "@/modules/search/service";

type Row = Record<string, unknown>;
type LegacyTab = "ancestries" | "classes" | "spells" | "feats" | "backgrounds";
type DirectTab = LegacyTab | "monsters" | "items";
type Tab = "all" | DirectTab | GamedataCategory;

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

const GLOBAL_TAB = {
  id: "all" as const,
  label: "All",
  description: "Search every rules, character option, creature, item, and reference category",
};

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

const ALL_TABS = [GLOBAL_TAB, ...DIRECT_TABS, ...GAMEDATA_TABS] as const;
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
  if (typeof data === "string" && data.trim().startsWith("{")) {
    try {
      return dataObject(JSON.parse(data));
    } catch {
      return {};
    }
  }
  return data && typeof data === "object" && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : {};
}

function cleanContentText(value: unknown): string {
  if (value == null) return "";
  if (typeof value !== "string") {
    const obj = dataObject(value);
    return cleanContentText(
      obj.summary ?? obj.summary_markdown ?? obj.description ?? obj.text ?? obj.markdown
    );
  }

  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("{")) {
    try {
      return cleanContentText(JSON.parse(trimmed));
    } catch {
      // Clean as plain text below.
    }
  }

  return trimmed
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, " ")
    .replace(/<traits>[\s\S]*?<\/traits>/gi, " ")
    .replace(/<additional-info>[\s\S]*?<\/additional-info>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\/[A-Za-z]+\.aspx\?[^)\s]+/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function contentDescription(data: unknown): string {
  const obj = dataObject(data);
  const candidates = [
    obj.description,
    obj.text,
    obj.summary,
    obj.summary_markdown,
    obj.effect,
    obj.details,
    obj.flavor,
    obj.markdown,
  ];
  for (const candidate of candidates) {
    const cleaned = cleanContentText(candidate);
    if (cleaned) return cleaned;
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

function useGlobalSearch(q: string, enabled = true) {
  return useQuery({
    queryKey: ["library", "global-search", q],
    queryFn: async () => {
      const qs = new URLSearchParams({ q, limit: "36" });
      const res = await fetch(`/api/search?${qs}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<{
        results: GlobalSearchResult[];
        total: number;
        query: string;
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

      <p className="line-clamp-2 text-sm text-muted-foreground">
        {cleanContentText(item.description) || "—"}
      </p>
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
      <p className="line-clamp-2 text-sm text-muted-foreground">
        {cleanContentText(item.description) || "—"}
      </p>
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

function SearchResultCard({ result }: { result: GlobalSearchResult }) {
  return (
    <div className="card border-l-4 border-l-primary/40 p-5 transition-all hover:shadow-md">
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href={result.href} className="text-lg font-semibold hover:text-primary">
            {result.title}
          </Link>
          {result.subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{result.subtitle}</p>
          )}
        </div>
        <span className="w-fit shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">
          {result.category}
        </span>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        {result.description || "No summary saved yet."}
      </p>
      <AonLink
        name={result.title}
        url={result.aonUrl}
        isOfficial={result.isOfficial}
        className="mt-3"
      />
    </div>
  );
}

function CategoryNav({
  tab,
  onTab,
}: {
  tab: Tab;
  onTab: (tab: Tab) => void;
}) {
  return (
    <aside className="space-y-5 lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
      <div>
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Search
        </p>
        <CategoryButton item={GLOBAL_TAB} active={tab === "all"} onTab={onTab} />
      </div>

      <div>
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Core Library
        </p>
        <div className="space-y-1">
          {DIRECT_TABS.map((item) => (
            <CategoryButton key={item.id} item={item} active={tab === item.id} onTab={onTab} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Reference
        </p>
        <div className="space-y-1">
          {GAMEDATA_TABS.map((item) => (
            <CategoryButton key={item.id} item={item} active={tab === item.id} onTab={onTab} />
          ))}
        </div>
      </div>
    </aside>
  );
}

function CategoryButton({
  item,
  active,
  onTab,
}: {
  item: (typeof ALL_TABS)[number];
  active: boolean;
  onTab: (tab: Tab) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onTab(item.id)}
      className={`w-full rounded-md border px-3 py-2 text-left transition ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
      }`}
    >
      <span className="block text-sm font-medium">{item.label}</span>
    </button>
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
  const isGlobal = tab === "all";
  const isGamedata = !isDirect && !isGlobal;

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
  const globalResult = useGlobalSearch(search, isGlobal && search.trim().length >= 2);
  const monstersResult = useMonsters(
    { q: search, creature_type: creatureType || undefined, is_companion: false, page, limit: 24 },
    { enabled: tab === "monsters" }
  );
  const itemsResult = useItems(
    { q: search, item_type: itemType || undefined, page, limit: 24 },
    { enabled: tab === "items" }
  );
  const gamedataResult = useGamedataContent(tab as GamedataCategory, search, page, isGamedata);

  const isLoading = isGlobal
    ? globalResult.isLoading || (q.trim().length >= 2 && search !== q.trim())
    : isLegacy
    ? legacyResult.isLoading
    : tab === "monsters"
      ? monstersResult.isLoading
      : tab === "items"
        ? itemsResult.isLoading
        : gamedataResult.isLoading;

  const total = isGlobal
    ? (globalResult.data?.total ?? 0)
    : isLegacy
    ? (legacyResult.data?.total ?? 0)
    : tab === "monsters"
      ? (monstersResult.data?.total ?? 0)
      : tab === "items"
        ? (itemsResult.data?.total ?? 0)
        : (gamedataResult.data?.total ?? 0);

  const totalPages = isGlobal ? 1 : Math.max(1, Math.ceil(total / 24));

  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="mb-1 font-heading text-4xl font-bold">Rules Library</h1>
            <p className="text-muted-foreground">
              Browse Pathfinder 2e rules, character options, creatures, equipment, and references.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <CategoryNav tab={tab} onTab={setTab} />

        <section className="min-w-0 space-y-5">
          <div className="rounded-lg border border-border bg-muted/20 p-5">
            <p className="text-sm font-semibold text-primary">{selectedTab?.label}</p>
            <h2 className="mt-1 text-2xl font-semibold">{selectedTab?.label} Reference</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {selectedTab?.description}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder={
                  isGlobal
                    ? "Search all rules, spells, feats, items, monsters..."
                    : `Search ${selectedTab?.label ?? "library"}...`
                }
                className="input flex-1 border-0 bg-transparent p-0 focus:ring-0"
              />
            </div>
          </div>

          {(tab === "monsters" || tab === "items") && (
            <div className="flex flex-wrap gap-3">
              {tab === "monsters" && (
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
              )}

              {tab === "items" && (
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
              )}
            </div>
          )}

          <div className="flex items-center justify-between border-b border-border pb-3">
            <p className="text-sm text-muted-foreground">
              {search ? `Results for "${search}"` : "Browse entries"}
            </p>
            {!isLoading && total > 0 && (
              <p className="text-xs text-muted-foreground">{total} entries</p>
            )}
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
                    <div className="space-y-3">
                      {items.map((item) => (
                        <LegacyCard key={str(item.id)} item={item} tab={tab as LegacyTab} />
                      ))}
                    </div>
                  );
                })()}

              {isGlobal &&
                (() => {
                  if (search.trim().length < 2) {
                    return (
                      <div className="rounded-lg border border-dashed border-border py-12 text-center">
                        <p className="font-medium">Search the whole library</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Type at least two characters to search every rules category at once.
                        </p>
                      </div>
                    );
                  }
                  if (globalResult.error) {
                    return <ErrorState label="global search" error={globalResult.error} />;
                  }
                  const results = globalResult.data?.results ?? [];
                  return results.length === 0 ? (
                    <EmptyState tab="library entries" search={search} />
                  ) : (
                    <div className="space-y-3">
                      {results.map((result) => (
                        <SearchResultCard
                          key={`${result.kind}-${result.id}-${result.href}`}
                          result={result}
                        />
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
                    <div className="space-y-3">
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
                    <div className="space-y-3">
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
                    <div className="space-y-3">
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
        </section>
      </div>
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
