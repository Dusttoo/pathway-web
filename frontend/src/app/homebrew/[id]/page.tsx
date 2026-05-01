"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  useHomebrewEntry,
  useDeleteHomebrew,
  type HomebrewEntry,
} from "@/lib/hooks/use-homebrew";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Sparkles,
  Swords,
  Package,
  AlertTriangle,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${className}`}>
      {children}
    </span>
  );
}

function StatBlock({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : null;
  const display = num !== null ? (num > 0 ? `+${num}` : String(num)) : String(value);
  return (
    <div className="text-center">
      <div className="text-lg font-bold font-heading">{display}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: unknown }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex gap-3 text-sm">
      <span className="font-medium text-muted-foreground shrink-0 w-28">{label}</span>
      <span>{String(value)}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}

// ── Type-specific detail renderers ────────────────────────────────────────────

function str(v: unknown): string { return v != null ? String(v) : ""; }
function num(v: unknown): number | null {
  const n = Number(v);
  return v != null && v !== "" && !isNaN(n) ? n : null;
}

function SpellDetail({ entry }: { entry: HomebrewEntry }) {
  const d = entry.data as Record<string, unknown>;
  const traits = str(d.traits).split(",").map((t) => t.trim()).filter(Boolean);
  const traditions = str(d.traditions).split(",").map((t) => t.trim()).filter(Boolean);
  const spellType = str(d.type);
  const level = str(d.level);
  const rarity = str(d.rarity);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {spellType && <Badge className="bg-primary/10 text-primary border border-primary/20">{spellType}</Badge>}
        {level && <Badge className="bg-muted/60 text-muted-foreground border border-border">Rank {level}</Badge>}
        {rarity && <Badge className={rarityColor(rarity)}>{rarity}</Badge>}
        {traditions.map((t) => (
          <Badge key={t} className="bg-muted/60 text-muted-foreground border border-border capitalize">{t}</Badge>
        ))}
        {traits.map((t) => (
          <Badge key={t} className="bg-muted/40 text-muted-foreground border border-border/50">{t}</Badge>
        ))}
      </div>

      <SectionCard title="Casting">
        <div className="space-y-2">
          <Row label="Cast" value={str(d.cast)} />
          <Row label="Trigger" value={str(d.trigger)} />
          <Row label="Requirements" value={str(d.requirements)} />
          <Row label="Range" value={str(d.range)} />
          <Row label="Area" value={str(d.area)} />
          <Row label="Target" value={str(d.target)} />
          <Row label="Duration" value={str(d.duration)} />
          <Row label="Defense" value={str(d.defense)} />
          <Row label="Source" value={str(d.source)} />
        </div>
      </SectionCard>

      {d.description ? (
        <SectionCard title="Description">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{str(d.description)}</p>
        </SectionCard>
      ) : null}

      {d.heightened ? (
        <SectionCard title="Heightened">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{str(d.heightened)}</p>
        </SectionCard>
      ) : null}
    </div>
  );
}

function MonsterDetail({ entry }: { entry: HomebrewEntry }) {
  const d = entry.data as Record<string, unknown>;
  const core = (d.core ?? {}) as Record<string, unknown>;
  const rich = (d.rich ?? {}) as Record<string, unknown>;
  const saves = (core.saves ?? {}) as Record<string, unknown>;
  const mods = (rich.ability_modifiers ?? {}) as Record<string, unknown>;
  const speed = (rich.speed ?? {}) as Record<string, unknown>;
  const skills = (rich.skills ?? {}) as Record<string, number>;
  const traits = (Array.isArray(core.traits) ? core.traits as string[] : []);
  const senses = (Array.isArray(rich.senses) ? rich.senses as string[] : []);
  const languages = (Array.isArray(rich.languages) ? rich.languages as string[] : []);
  const skillEntries = Object.entries(skills);
  const coreRarity = str(core.rarity);
  const coreSize = str(core.size);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {core.level != null && (
          <Badge className="bg-muted/60 text-muted-foreground border border-border">Level {str(core.level)}</Badge>
        )}
        {coreSize && <Badge className="bg-muted/60 text-muted-foreground border border-border">{coreSize}</Badge>}
        {coreRarity && <Badge className={rarityColor(coreRarity)}>{coreRarity}</Badge>}
        {traits.map((t) => (
          <Badge key={t} className="bg-muted/40 text-muted-foreground border border-border/50">{t}</Badge>
        ))}
      </div>

      <SectionCard title="Statistics">
        <div className="grid grid-cols-3 gap-4 py-2 border-b border-border">
          <StatBlock label="HP" value={num(core.hp)} />
          <StatBlock label="AC" value={num(core.ac)} />
          <StatBlock label="Perception" value={num(core.perception)} />
        </div>
        <div className="grid grid-cols-3 gap-4 py-2">
          <StatBlock label="Fortitude" value={num(saves.fort)} />
          <StatBlock label="Reflex" value={num(saves.ref)} />
          <StatBlock label="Will" value={num(saves.will)} />
        </div>
      </SectionCard>

      {Object.values(mods).some((v) => v !== null && v !== undefined) ? (
        <SectionCard title="Ability Modifiers">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {(["str","dex","con","int","wis","cha"] as const).map((ab) => (
              <StatBlock key={ab} label={ab.toUpperCase()} value={num(mods[ab])} />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {skillEntries.length > 0 ? (
        <SectionCard title="Skills">
          <div className="flex flex-wrap gap-3">
            {skillEntries.map(([skill, bonus]) => (
              <div key={skill} className="flex items-baseline gap-1 text-sm">
                <span className="font-medium capitalize">{skill}</span>
                <span className="text-muted-foreground">{bonus >= 0 ? `+${bonus}` : bonus}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Movement, Senses & Languages">
        <div className="space-y-2">
          {speed.land != null ? <Row label="Speed" value={`${str(speed.land)} feet`} /> : null}
          {senses.length > 0 ? <Row label="Senses" value={senses.join(", ")} /> : null}
          {languages.length > 0 ? <Row label="Languages" value={languages.join(", ")} /> : null}
        </div>
      </SectionCard>

      {rich.description ? (
        <SectionCard title="Description">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{str(rich.description)}</p>
        </SectionCard>
      ) : null}
    </div>
  );
}

function ItemDetail({ entry }: { entry: HomebrewEntry }) {
  const d = entry.data as Record<string, unknown>;
  const src = (d.source ?? {}) as Record<string, unknown>;
  const traits = (Array.isArray(d.traits) ? d.traits as string[] : []);
  const category = str(d.category);
  const level = str(d.level);
  const rarity = str(d.rarity);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {category && <Badge className="bg-primary/10 text-primary border border-primary/20">{category}</Badge>}
        {level && <Badge className="bg-muted/60 text-muted-foreground border border-border">Level {level}</Badge>}
        {rarity && <Badge className={rarityColor(rarity)}>{rarity}</Badge>}
        {traits.map((t) => (
          <Badge key={t} className="bg-muted/40 text-muted-foreground border border-border/50">{t}</Badge>
        ))}
      </div>

      <SectionCard title="Properties">
        <div className="space-y-2">
          <Row label="Subcategory" value={str(d.subcategory)} />
          <Row label="Price" value={str(d.price_raw)} />
          <Row label="Bulk" value={str(d.bulk_raw)} />
          <Row label="Usage" value={str(d.usage)} />
          {src.book ? (
            <Row
              label="Source"
              value={[str(src.book), src.page ? `p. ${str(src.page)}` : ""].filter(Boolean).join(" ")}
            />
          ) : null}
        </div>
      </SectionCard>

      {d.notes ? (
        <SectionCard title="Description">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{str(d.notes)}</p>
        </SectionCard>
      ) : null}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TYPE_META = {
  spell:   { label: "Spell",   icon: Sparkles, tab: "spell"   },
  monster: { label: "Monster", icon: Swords,   tab: "monster" },
  item:    { label: "Item",    icon: Package,  tab: "item"    },
} as const;

export default function HomebrewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading, error } = useHomebrewEntry(id);
  const deleteEntry = useDeleteHomebrew();

  async function handleDelete() {
    if (!confirm("Delete this homebrew entry? This cannot be undone.")) return;
    await deleteEntry.mutateAsync(id);
    const tab = data?.data?.type ?? "spell";
    router.push(`/homebrew?tab=${tab}`);
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-16">
          <div className="spinner" />
        </div>
      </MainLayout>
    );
  }

  if (error || !data?.data) {
    return (
      <MainLayout>
        <div className="space-y-4 max-w-2xl">
          <Link href="/homebrew" className="inline-flex items-center gap-2 text-primary text-sm">
            <ArrowLeft size={14} /> Back to Homebrew
          </Link>
          <div className="card p-6 bg-destructive/10 border-destructive flex items-start gap-3">
            <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Entry not found</p>
              <p className="text-sm text-muted-foreground mt-1">{error?.message}</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const entry = data.data;
  const meta = TYPE_META[entry.type as keyof typeof TYPE_META] ?? TYPE_META.spell;
  const Icon = meta.icon;
  const canWrite = entry.added_by === user?.id;
  const imageUrl = (entry.data as Record<string, unknown>).image_url as string | undefined;

  return (
    <MainLayout>
      <div className="max-w-2xl space-y-6">
        {/* Back */}
        <Link
          href={`/homebrew?tab=${meta.tab}`}
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm"
        >
          <ArrowLeft size={14} />
          Back to Homebrew
        </Link>

        {/* Header card */}
        <div className="card p-6">
          <div className="flex items-start gap-5">
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={entry.name}
                className="w-24 h-24 object-cover rounded-lg shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={20} className="text-primary shrink-0" />
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">
                    {meta.label}
                  </span>
                </div>
                {canWrite && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/homebrew/${entry.id}/edit`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Pencil size={14} />
                      Edit
                    </Link>
                    <button
                      onClick={handleDelete}
                      disabled={deleteEntry.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      {deleteEntry.isPending ? (
                        <div className="spinner w-4 h-4" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <h1 className="font-heading text-2xl font-bold">{entry.name}</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Added {new Date(entry.created_at).toLocaleDateString(undefined, {
                  month: "long", day: "numeric", year: "numeric",
                })}
                {entry.updated_at && entry.updated_at !== entry.created_at && (
                  <> · Updated {new Date(entry.updated_at).toLocaleDateString(undefined, {
                    month: "long", day: "numeric", year: "numeric",
                  })}</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Type-specific content */}
        {entry.type === "spell"   && <SpellDetail   entry={entry} />}
        {entry.type === "monster" && <MonsterDetail entry={entry} />}
        {entry.type === "item"    && <ItemDetail    entry={entry} />}
      </div>
    </MainLayout>
  );
}
