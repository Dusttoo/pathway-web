"use client";

import { useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  useHomebrew,
  useDeleteHomebrew,
  type HomebrewType,
  type HomebrewEntry,
} from "@/lib/hooks/use-homebrew";
import {
  Wand2,
  Plus,
  Trash2,
  Pencil,
  Search,
  Swords,
  Sparkles,
  Package,
  BadgeCheck,
  Gem,
  Info,
  AlertTriangle,
  Users,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { AncestryPanel } from "./_components/AncestryPanel";
import { ClassPanel } from "./_components/ClassPanel";
import { BackgroundPanel } from "./_components/BackgroundPanel";

// ── Tab definitions ───────────────────────────────────────────────────────────

type ContentTab = "ancestry" | "class" | "background";
type AnyTab = HomebrewType | ContentTab;

// Tabs that use homebrew_entries (bot content, detail pages, JSONB)
const HOMEBREW_TABS: { id: HomebrewType; label: string; icon: typeof Sparkles }[] = [
  { id: "spell",    label: "Spells",    icon: Sparkles },
  { id: "monster",  label: "Monsters",  icon: Swords },
  { id: "item",     label: "Items",     icon: Package },
  { id: "feat",     label: "Feats",     icon: BadgeCheck },
  { id: "heritage", label: "Heritages", icon: Gem },
];

// Tabs that use structured reference tables (character builder content)
const CONTENT_TABS: { id: ContentTab; label: string; icon: typeof Sparkles }[] = [
  { id: "ancestry",   label: "Ancestries",  icon: Users },
  { id: "class",      label: "Classes",     icon: GraduationCap },
  { id: "background", label: "Backgrounds", icon: BookOpen },
];

const ALL_TAB_IDS = new Set<string>([
  ...HOMEBREW_TABS.map((t) => t.id),
  ...CONTENT_TABS.map((t) => t.id),
]);

// Only the first 5 go through HomebrewTabPanel (homebrew_entries table)
const HOMEBREW_ENTRY_IDS = new Set<string>(HOMEBREW_TABS.map((t) => t.id));

function homebrewNewPath(type: HomebrewType) {
  return `/homebrew/${type === "heritage" ? "heritages" : `${type}s`}/new`;
}

// ── Rarity / meta helpers ─────────────────────────────────────────────────────

function rarityColor(rarity?: string) {
  switch (rarity?.toLowerCase()) {
    case "uncommon":
      return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
    case "rare":
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    case "unique":
      return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
    default:
      return "bg-muted/60 text-muted-foreground border border-border";
  }
}

function spellMetaBadge(data: Record<string, unknown>) {
  const parts: string[] = [];
  if (data.type) parts.push(String(data.type));
  if (data.level !== undefined && data.level !== "") parts.push(`Rank ${data.level}`);
  if (data.traditions) parts.push(String(data.traditions));
  return parts.join(" · ");
}

function monsterMetaBadge(data: Record<string, unknown>) {
  const parts: string[] = [];
  const core = data.core as Record<string, unknown> | undefined;
  if (core?.level !== undefined) parts.push(`Level ${core.level}`);
  if (core?.size) parts.push(String(core.size));
  return parts.join(" · ");
}

function itemMetaBadge(data: Record<string, unknown>) {
  const parts: string[] = [];
  if (data.category) parts.push(String(data.category));
  if (data.level !== undefined && data.level !== "") parts.push(`Level ${data.level}`);
  if (data.price_raw) parts.push(String(data.price_raw));
  return parts.join(" · ");
}

function featMetaBadge(data: Record<string, unknown>) {
  const parts: string[] = [];
  if (data.feat_type) parts.push(String(data.feat_type));
  if (data.level !== undefined && data.level !== "") parts.push(`Level ${data.level}`);
  if (data.action_cost) parts.push(String(data.action_cost));
  return parts.join(" · ");
}

function heritageMetaBadge(data: Record<string, unknown>) {
  const parts: string[] = [];
  if (data.ancestry) parts.push(String(data.ancestry));
  if (data.heritage_type) parts.push(String(data.heritage_type));
  if (data.level !== undefined && data.level !== "") parts.push(`Level ${data.level}`);
  return parts.join(" · ");
}

function metaBadge(entry: HomebrewEntry) {
  const d = entry.data as Record<string, unknown>;
  if (entry.type === "spell")    return spellMetaBadge(d);
  if (entry.type === "monster")  return monsterMetaBadge(d);
  if (entry.type === "item")     return itemMetaBadge(d);
  if (entry.type === "feat")     return featMetaBadge(d);
  if (entry.type === "heritage") return heritageMetaBadge(d);
  return "";
}

function getRarity(entry: HomebrewEntry): string | undefined {
  const d = entry.data as Record<string, unknown>;
  return (
    (d.rarity as string | undefined) ??
    ((d.core as Record<string, unknown> | undefined)?.rarity as string | undefined)
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Homebrew entry card ───────────────────────────────────────────────────────

function HomebrewCard({
  entry,
  currentUserId,
  fallbackUserId,
  onDelete,
  deleting,
}: {
  entry: HomebrewEntry;
  currentUserId?: string;
  fallbackUserId?: string;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  // added_by is discord_id for new entries, Supabase UUID for legacy entries.
  const canWrite =
    entry.added_by === currentUserId ||
    (!!fallbackUserId && entry.added_by === fallbackUserId);
  const rarity = getRarity(entry);
  const meta = metaBadge(entry);
  const imageUrl = (entry.data as Record<string, unknown>).image_url as string | undefined;

  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow relative group">
      <Link
        href={`/homebrew/${entry.id}`}
        className="absolute inset-0 z-0 rounded-[inherit]"
        aria-label={`View ${entry.name}`}
      />
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={entry.name} className="w-full h-32 object-cover rounded-lg" />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-lg font-bold truncate group-hover:text-primary transition-colors">
            {entry.name}
          </h3>
          {meta && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{meta}</p>
          )}
        </div>
        {canWrite && (
          <div className="flex items-center gap-1 shrink-0 relative z-10">
            <Link
              href={`/homebrew/${entry.id}/edit`}
              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Edit homebrew entry"
            >
              <Pencil size={14} />
            </Link>
            <button
              onClick={(e) => { e.preventDefault(); onDelete(entry.id); }}
              disabled={deleting}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              title="Delete homebrew entry"
            >
              {deleting ? <div className="spinner w-4 h-4" /> : <Trash2 size={15} />}
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {rarity && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rarityColor(rarity)}`}>
            {rarity}
          </span>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          Added {formatDate(entry.created_at)}
        </span>
      </div>
    </div>
  );
}

// ── homebrew_entries tab panel (spell / monster / item / feat / heritage) ─────

function HomebrewTabPanel({
  type,
  currentUserId,
  fallbackUserId,
}: {
  type: HomebrewType;
  currentUserId?: string;
  fallbackUserId?: string;
}) {
  const [q, setQ] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteEntry = useDeleteHomebrew();
  const { data, isLoading, error } = useHomebrew({ type, q: q || undefined });

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Delete this homebrew entry? This cannot be undone.")) return;
      setDeletingId(id);
      try {
        await deleteEntry.mutateAsync(id);
      } finally {
        setDeletingId(null);
      }
    },
    [deleteEntry]
  );

  const label = HOMEBREW_TABS.find((t) => t.id === type)?.label ?? type;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="search"
            placeholder={`Search ${label.toLowerCase()}…`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input pl-9"
          />
        </div>
        <Link
          href={homebrewNewPath(type)}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          Add {label.slice(0, -1)}
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="spinner" />
        </div>
      )}

      {error && (
        <div className="card p-5 bg-destructive/10 border-destructive flex items-start gap-3">
          <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive text-sm">Failed to load</p>
            <p className="text-sm text-muted-foreground mt-0.5">{error.message}</p>
          </div>
        </div>
      )}

      {!isLoading && !error && data?.data.length === 0 && (
        <div className="card p-12 text-center">
          <Wand2 size={40} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="font-heading text-xl font-bold mb-1">
            No homebrew {label.toLowerCase()} yet
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            {q
              ? `No results for "${q}". Try a different search.`
              : `Create custom ${label.toLowerCase()} that the Pathway bot will recognise in any server.`}
          </p>
          {!q && (
            <Link
              href={homebrewNewPath(type)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Add your first homebrew {label.slice(0, -1).toLowerCase()}
            </Link>
          )}
        </div>
      )}

      {!isLoading && !error && data && data.data.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            {data.total ?? data.data.length} {label.toLowerCase()}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.data.map((entry) => (
              <HomebrewCard
                key={entry.id}
                entry={entry}
                currentUserId={currentUserId}
                fallbackUserId={fallbackUserId}
                onDelete={handleDelete}
                deleting={deletingId === entry.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Inner content ─────────────────────────────────────────────────────────────

function HomebrewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const rawTab = searchParams.get("tab");
  const activeTab: AnyTab = ALL_TAB_IDS.has(rawTab ?? "")
    ? (rawTab as AnyTab)
    : "spell";

  // added_by stores the Discord snowflake (new entries) or Supabase UUID (legacy).
  // The users table row has discord_id directly — no identity extraction needed.
  const discordId = user?.discord_id ?? undefined;

  function setTab(id: AnyTab) {
    router.replace(`/homebrew?tab=${id}`);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-heading text-4xl font-bold mb-2 flex items-center gap-3">
          <Wand2 className="text-primary" size={36} />
          Homebrew
        </h1>
        <p className="text-muted-foreground">
          Custom spells, monsters, items, feats, heritages, ancestries, classes, and
          backgrounds — all in one place.
        </p>
      </div>

      {/* Info banners */}
      <div className="space-y-2">
        <div className="card p-4 bg-primary/5 border-primary/30 flex items-start gap-3">
          <Info size={16} className="text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">
              Spells, Monsters, Items, Feats &amp; Heritages
            </span>{" "}
            are global — they apply to every Discord server using the Pathway bot and take
            effect on the next bot restart.
          </p>
        </div>
        <div className="card p-4 bg-primary/5 border-primary/30 flex items-start gap-3">
          <Info size={16} className="text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">
              Ancestries, Classes &amp; Backgrounds
            </span>{" "}
            appear in the character builder immediately after saving — no restart needed.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b-2 border-border overflow-x-auto">
        <nav className="flex gap-0 -mb-0.5 min-w-max">
          <span className="px-3 flex items-end pb-3.5 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide select-none">
            Bot
          </span>
          {HOMEBREW_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-0.5 whitespace-nowrap ${
                activeTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}

          <span className="px-3 flex items-end pb-3.5 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide select-none border-l border-border ml-2 pl-4">
            Builder
          </span>
          {CONTENT_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-0.5 whitespace-nowrap ${
                activeTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {HOMEBREW_ENTRY_IDS.has(activeTab) ? (
        <HomebrewTabPanel
          type={activeTab as HomebrewType}
          currentUserId={discordId ?? user?.id}
          fallbackUserId={discordId ? user?.id : undefined}
        />
      ) : activeTab === "ancestry" ? (
        <AncestryPanel />
      ) : activeTab === "class" ? (
        <ClassPanel />
      ) : (
        <BackgroundPanel />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomebrewPage() {
  return (
    <MainLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16">
            <div className="spinner" />
          </div>
        }
      >
        <HomebrewContent />
      </Suspense>
    </MainLayout>
  );
}
