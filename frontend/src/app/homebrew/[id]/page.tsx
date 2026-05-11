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
  BadgeCheck,
  Gem,
  Users,
  GraduationCap,
  BookOpen,
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
  const core  = (d.core ?? {}) as Record<string, unknown>;
  const rich  = (d.rich ?? {}) as Record<string, unknown>;
  const saves = (core.saves ?? {}) as Record<string, unknown>;
  const mods  = (rich.ability_modifiers ?? {}) as Record<string, unknown>;
  const speed = (rich.speed ?? {}) as Record<string, unknown>;
  const defs  = (rich.defenses ?? {}) as Record<string, unknown>;
  const skills = (rich.skills ?? {}) as Record<string, number>;
  const traits    = (Array.isArray(core.traits)    ? core.traits    as string[] : []);
  const senses    = (Array.isArray(rich.senses)    ? rich.senses    as string[] : []);
  const languages = (Array.isArray(rich.languages) ? rich.languages as string[] : []);
  const immunities  = (Array.isArray(defs.immunities)  ? defs.immunities  as string[] : []);
  const weaknesses  = (Array.isArray(defs.weaknesses)  ? defs.weaknesses  as {type:string;value:number}[] : []);
  const resistances = (Array.isArray(defs.resistances) ? defs.resistances as {type:string;value:number}[] : []);
  const hpNotes = (Array.isArray(defs.hp_notes) ? defs.hp_notes as string[] : []);
  const items      = (Array.isArray(rich.items) ? rich.items as string[] : []);
  const attacks    = (Array.isArray(rich.attacks) ? rich.attacks as Record<string,unknown>[] : []);
  const abils = (rich.abilities ?? {}) as { mid?: unknown };
  const abilities  = (Array.isArray(abils.mid) ? abils.mid as Record<string,unknown>[] : []);
  const skillEntries = Object.entries(skills);
  const coreRarity = str(core.rarity);
  const coreSize   = str(core.size);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {core.level != null && (
          <Badge className="bg-muted/60 text-muted-foreground border border-border">Level {str(core.level)}</Badge>
        )}
        {coreSize   && <Badge className="bg-muted/60 text-muted-foreground border border-border">{coreSize}</Badge>}
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
          <StatBlock label="Reflex"    value={num(saves.ref)}  />
          <StatBlock label="Will"      value={num(saves.will)} />
        </div>
        {(immunities.length > 0 || weaknesses.length > 0 || resistances.length > 0 || hpNotes.length > 0) && (
          <div className="space-y-1.5 pt-2 border-t border-border">
            {hpNotes.length > 0 && (
              <p className="text-sm"><span className="font-medium text-muted-foreground">HP Notes</span>{" "}{hpNotes.join("; ")}</p>
            )}
            {immunities.length > 0 && (
              <p className="text-sm"><span className="font-medium text-muted-foreground">Immunities</span>{" "}{immunities.join(", ")}</p>
            )}
            {weaknesses.length > 0 && (
              <p className="text-sm">
                <span className="font-medium text-muted-foreground">Weaknesses</span>{" "}
                {weaknesses.map((w) => `${w.type} ${w.value}`).join(", ")}
              </p>
            )}
            {resistances.length > 0 && (
              <p className="text-sm">
                <span className="font-medium text-muted-foreground">Resistances</span>{" "}
                {resistances.map((r) => `${r.type} ${r.value}`).join(", ")}
              </p>
            )}
          </div>
        )}
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
          {speed.land   != null && <Row label="Speed"  value={`${str(speed.land)} feet`}   />}
          {speed.fly    != null && <Row label="Fly"    value={`${str(speed.fly)} feet`}     />}
          {speed.burrow != null && <Row label="Burrow" value={`${str(speed.burrow)} feet`}  />}
          {speed.swim   != null && <Row label="Swim"   value={`${str(speed.swim)} feet`}    />}
          {speed.climb  != null && <Row label="Climb"  value={`${str(speed.climb)} feet`}   />}
          {senses.length > 0    && <Row label="Senses"    value={senses.join(", ")}    />}
          {languages.length > 0 && <Row label="Languages" value={languages.join(", ")} />}
        </div>
      </SectionCard>

      {items.length > 0 ? (
        <SectionCard title="Items">
          <p className="text-sm">{items.join(", ")}</p>
        </SectionCard>
      ) : null}

      {attacks.length > 0 ? (
        <SectionCard title="Attacks">
          <div className="space-y-2">
            {attacks.map((a, i) => {
              const atTraits = Array.isArray(a.traits) ? (a.traits as string[]).join(", ") : str(a.traits);
              return (
                <div key={i} className="text-sm">
                  <span className="font-medium">{str(a.type)} </span>
                  <span className="font-semibold">{str(a.name)}</span>
                  {a.bonus != null && (
                    <span className="text-muted-foreground"> {Number(a.bonus) >= 0 ? `+${a.bonus}` : str(a.bonus)}</span>
                  )}
                  {atTraits && <span className="text-muted-foreground"> ({atTraits})</span>}
                  {!!a.damage && <span>, <span className="font-medium">Damage</span> {str(a.damage)}</span>}
                </div>
              );
            })}
          </div>
        </SectionCard>
      ) : null}

      {abilities.length > 0 ? (
        <SectionCard title="Special Abilities">
          <div className="space-y-4">
            {abilities.map((a, i) => {
              const abTraits = Array.isArray(a.traits) ? (a.traits as string[]).join(", ") : str(a.traits);
              return (
                <div key={i}>
                  <p className="text-sm font-semibold">
                    {str(a.name)}
                    {!!a.cost && a.cost !== "Passive" && (
                      <span className="font-normal text-muted-foreground ml-1">({str(a.cost)})</span>
                    )}
                    {abTraits && (
                      <span className="font-normal text-muted-foreground ml-1 text-xs">[{abTraits}]</span>
                    )}
                  </p>
                  {!!a.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed whitespace-pre-wrap">
                      {str(a.description)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      ) : null}

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

function FeatDetail({ entry }: { entry: HomebrewEntry }) {
  const d = entry.data as Record<string, unknown>;
  const src = (d.source ?? {}) as Record<string, unknown>;
  const traits = Array.isArray(d.traits) ? d.traits as string[] : [];
  const featType = str(d.feat_type);
  const level = str(d.level);
  const rarity = str(d.rarity);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {featType && <Badge className="bg-primary/10 text-primary border border-primary/20">{featType}</Badge>}
        {level && <Badge className="bg-muted/60 text-muted-foreground border border-border">Level {level}</Badge>}
        {rarity && <Badge className={rarityColor(rarity)}>{rarity}</Badge>}
        {traits.map((t) => (
          <Badge key={t} className="bg-muted/40 text-muted-foreground border border-border/50">{t}</Badge>
        ))}
      </div>

      <SectionCard title="Rules">
        <div className="space-y-2">
          <Row label="Action" value={str(d.action_cost)} />
          <Row label="Prerequisites" value={str(d.prerequisites)} />
          <Row label="Frequency" value={str(d.frequency)} />
          <Row label="Trigger" value={str(d.trigger)} />
          <Row label="Requirements" value={str(d.requirements)} />
          {src.book ? (
            <Row
              label="Source"
              value={[str(src.book), src.page ? `p. ${str(src.page)}` : ""].filter(Boolean).join(" ")}
            />
          ) : null}
        </div>
      </SectionCard>

      {d.description ? (
        <SectionCard title="Benefit">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{str(d.description)}</p>
        </SectionCard>
      ) : null}

      {d.special ? (
        <SectionCard title="Special">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{str(d.special)}</p>
        </SectionCard>
      ) : null}
    </div>
  );
}

function HeritageDetail({ entry }: { entry: HomebrewEntry }) {
  const d = entry.data as Record<string, unknown>;
  const src = (d.source ?? {}) as Record<string, unknown>;
  const traits = Array.isArray(d.traits) ? d.traits as string[] : [];
  const heritageType = str(d.heritage_type);
  const ancestry = str(d.ancestry);
  const level = str(d.level);
  const rarity = str(d.rarity);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {heritageType && <Badge className="bg-primary/10 text-primary border border-primary/20">{heritageType}</Badge>}
        {ancestry && <Badge className="bg-muted/60 text-muted-foreground border border-border">{ancestry}</Badge>}
        {level && <Badge className="bg-muted/60 text-muted-foreground border border-border">Level {level}</Badge>}
        {rarity && <Badge className={rarityColor(rarity)}>{rarity}</Badge>}
        {traits.map((t) => (
          <Badge key={t} className="bg-muted/40 text-muted-foreground border border-border/50">{t}</Badge>
        ))}
      </div>

      <SectionCard title="Rules">
        <div className="space-y-2">
          <Row label="Prerequisites" value={str(d.prerequisites)} />
          {src.book ? (
            <Row
              label="Source"
              value={[str(src.book), src.page ? `p. ${str(src.page)}` : ""].filter(Boolean).join(" ")}
            />
          ) : null}
        </div>
      </SectionCard>

      {d.description ? (
        <SectionCard title="Benefit">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{str(d.description)}</p>
        </SectionCard>
      ) : null}

      {d.special ? (
        <SectionCard title="Special">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{str(d.special)}</p>
        </SectionCard>
      ) : null}
    </div>
  );
}

function SourceRow({ source }: { source: unknown }) {
  const src = (source ?? {}) as Record<string, unknown>;
  if (!src.book) return null;
  return (
    <Row
      label="Source"
      value={[str(src.book), src.page ? `p. ${str(src.page)}` : ""].filter(Boolean).join(" ")}
    />
  );
}

function AncestryDetail({ entry }: { entry: HomebrewEntry }) {
  const d = entry.data as Record<string, unknown>;
  const traits = Array.isArray(d.traits) ? d.traits as string[] : [];
  const languages = Array.isArray(d.languages) ? d.languages as string[] : [];
  const boosts = Array.isArray(d.ability_boosts) ? d.ability_boosts as string[] : [];
  const rarity = str(d.rarity);
  const ancestrySize = str(d.size);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {rarity && <Badge className={rarityColor(rarity)}>{rarity}</Badge>}
        {ancestrySize && <Badge className="bg-muted/60 text-muted-foreground border border-border">{ancestrySize}</Badge>}
        {traits.map((t) => (
          <Badge key={t} className="bg-muted/40 text-muted-foreground border border-border/50">{t}</Badge>
        ))}
      </div>

      <SectionCard title="Core Statistics">
        <div className="grid grid-cols-3 gap-4 py-2 border-b border-border">
          <StatBlock label="HP" value={num(d.hp)} />
          <StatBlock label="Speed" value={num(d.speed)} />
          <StatBlock label="Size" value={ancestrySize} />
        </div>
        <div className="space-y-2 pt-2">
          <Row label="Ability Boosts" value={boosts.length ? boosts.join(", ") : str(d.ability_boost_mode)} />
          <Row label="Ability Flaw" value={str(d.ability_flaw)} />
          <Row label="Languages" value={languages.join(", ")} />
          <Row label="Additional" value={str(d.additional_languages)} />
          <Row label="Senses" value={str(d.senses)} />
          <SourceRow source={d.source} />
        </div>
      </SectionCard>

      {d.features ? (
        <SectionCard title="Features">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{str(d.features)}</p>
        </SectionCard>
      ) : null}

      {d.description ? (
        <SectionCard title="Description">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{str(d.description)}</p>
        </SectionCard>
      ) : null}
    </div>
  );
}

function ClassDetail({ entry }: { entry: HomebrewEntry }) {
  const d = entry.data as Record<string, unknown>;
  const keyAbility = Array.isArray(d.key_ability) ? (d.key_ability as string[]).join(", ") : str(d.key_ability);
  const rarity = str(d.rarity);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {rarity && <Badge className={rarityColor(rarity)}>{rarity}</Badge>}
        {keyAbility && <Badge className="bg-primary/10 text-primary border border-primary/20">{keyAbility}</Badge>}
        {d.hp_per_level != null && <Badge className="bg-muted/60 text-muted-foreground border border-border">{str(d.hp_per_level)} HP</Badge>}
      </div>

      <SectionCard title="Initial Proficiencies">
        <div className="space-y-2">
          <Row label="Key Ability" value={keyAbility} />
          <Row label="HP / Level" value={str(d.hp_per_level)} />
          <Row label="Perception" value={str(d.perception)} />
          <Row label="Saving Throws" value={str(d.saving_throws)} />
          <Row label="Skills" value={str(d.skills)} />
          <Row label="Attacks" value={str(d.attacks)} />
          <Row label="Defenses" value={str(d.defenses)} />
          <Row label="Class DC" value={str(d.class_dc)} />
          <Row label="Spellcasting" value={str(d.spellcasting_tradition)} />
          <SourceRow source={d.source} />
        </div>
      </SectionCard>

      {d.features ? (
        <SectionCard title="Class Features">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{str(d.features)}</p>
        </SectionCard>
      ) : null}

      {d.description ? (
        <SectionCard title="Description">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{str(d.description)}</p>
        </SectionCard>
      ) : null}
    </div>
  );
}

function BackgroundDetail({ entry }: { entry: HomebrewEntry }) {
  const d = entry.data as Record<string, unknown>;
  const traits = Array.isArray(d.traits) ? d.traits as string[] : [];
  const boosts = Array.isArray(d.ability_boosts) ? d.ability_boosts as string[] : [];
  const rarity = str(d.rarity);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {rarity && <Badge className={rarityColor(rarity)}>{rarity}</Badge>}
        {traits.map((t) => (
          <Badge key={t} className="bg-muted/40 text-muted-foreground border border-border/50">{t}</Badge>
        ))}
      </div>

      <SectionCard title="Character Options">
        <div className="space-y-2">
          <Row label="Boosts" value={boosts.join(", ")} />
          <Row label="Trained Skill" value={str(d.trained_skill)} />
          <Row label="Lore Skill" value={str(d.lore_skill)} />
          <Row label="Skill Feat" value={str(d.skill_feat)} />
          <SourceRow source={d.source} />
        </div>
      </SectionCard>

      {d.description ? (
        <SectionCard title="Description">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{str(d.description)}</p>
        </SectionCard>
      ) : null}

      {d.special ? (
        <SectionCard title="Special">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{str(d.special)}</p>
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
  feat:    { label: "Feat",    icon: BadgeCheck, tab: "feat" },
  heritage:{ label: "Heritage", icon: Gem, tab: "heritage" },
  ancestry:{ label: "Ancestry", icon: Users, tab: "ancestry" },
  class:   { label: "Class", icon: GraduationCap, tab: "class" },
  background:{ label: "Background", icon: BookOpen, tab: "background" },
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
        {entry.type === "feat"    && <FeatDetail    entry={entry} />}
        {entry.type === "heritage" && <HeritageDetail entry={entry} />}
        {entry.type === "ancestry" && <AncestryDetail entry={entry} />}
        {entry.type === "class" && <ClassDetail entry={entry} />}
        {entry.type === "background" && <BackgroundDetail entry={entry} />}
      </div>
    </MainLayout>
  );
}
