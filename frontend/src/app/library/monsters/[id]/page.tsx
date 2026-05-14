"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MainLayout } from "@/components/layout";
import { AonLink, aonUrlFromMetadata } from "@/components/library/AonLink";
import { useMonster } from "@/lib/hooks/use-monsters";

function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function formatJson(value: unknown): string {
  if (value == null) return "—";
  if (Array.isArray(value)) return value.map(String).join(", ") || "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export default function MonsterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: monster, isLoading, error } = useMonster(id);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      </MainLayout>
    );
  }

  if (error || !monster) {
    return (
      <MainLayout>
        <div className="card mb-4 border-destructive bg-destructive/10 p-6">
          <p className="text-destructive">Monster not found.</p>
        </div>
        <Link
          href="/library?tab=monsters"
          className="inline-flex items-center gap-2 text-sm text-primary"
        >
          <ArrowLeft size={14} /> Back to Monsters
        </Link>
      </MainLayout>
    );
  }

  const traits = asList(monster.traits);
  const languages = asList(monster.languages);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/library?tab=monsters"
            className="mb-4 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80"
          >
            <ArrowLeft size={14} /> Back to Monsters
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="mb-1 font-heading text-4xl font-bold">{monster.name}</h1>
              <p className="text-muted-foreground">
                Creature {monster.level}
                {monster.size ? ` · ${monster.size}` : ""}
                {monster.creature_type ? ` · ${monster.creature_type}` : ""}
                {monster.alignment ? ` · ${monster.alignment}` : ""}
              </p>
              <AonLink
                name={monster.name}
                url={aonUrlFromMetadata(monster.monster_metadata)}
                isOfficial={monster.is_official}
                className="mt-2"
              />
            </div>
            {monster.rarity && monster.rarity !== "Common" && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{monster.rarity}</span>
            )}
          </div>
        </div>

        {traits.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {traits.map((trait) => (
              <span
                key={trait}
                className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
              >
                {trait}
              </span>
            ))}
          </div>
        )}

        <div className="card p-5">
          <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">AC</dt>
              <dd className="font-medium">{monster.ac}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">HP</dt>
              <dd className="font-medium">{monster.hp}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Perception</dt>
              <dd className="font-medium">
                {monster.perception >= 0 ? `+${monster.perception}` : monster.perception}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Speed</dt>
              <dd className="font-medium">{formatJson(monster.speed)}</dd>
            </div>
          </dl>
        </div>

        {monster.description && (
          <div className="card p-6">
            <h2 className="mb-3 text-xl font-semibold">Description</h2>
            <p className="whitespace-pre-wrap leading-relaxed text-foreground">
              {monster.description}
            </p>
          </div>
        )}

        {languages.length > 0 && (
          <div className="card p-6">
            <h2 className="mb-3 text-xl font-semibold">Languages</h2>
            <p className="text-sm text-muted-foreground">{languages.join(", ")}</p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <JsonPanel title="Saves" value={monster.saving_throws} />
          <JsonPanel title="Attacks" value={monster.attacks} />
          <JsonPanel title="Abilities" value={monster.abilities} />
          <JsonPanel title="Spellcasting" value={monster.spellcasting} />
          <JsonPanel title="Resistances" value={monster.resistances} />
          <JsonPanel title="Weaknesses" value={monster.weaknesses} />
          <JsonPanel title="Immunities" value={monster.immunities} />
          <JsonPanel title="Ability Modifiers" value={monster.ability_modifiers} />
        </div>

        {monster.source && (
          <p className="text-xs text-muted-foreground">Source: {monster.source}</p>
        )}
      </div>
    </MainLayout>
  );
}

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  const text = formatJson(value);
  if (!text || text === "—" || text === "{}" || text === "[]") return null;

  return (
    <div className="card p-6">
      <h2 className="mb-3 text-xl font-semibold">{title}</h2>
      <pre className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{text}</pre>
    </div>
  );
}
