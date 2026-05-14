"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { MainLayout } from "@/components/layout";
import { AonLink, aonUrlFromMetadata } from "@/components/library/AonLink";
import type { Tables } from "@/lib/types/database.types";

type Ancestry = Tables<"ancestries">;
type Heritage = Tables<"heritages">;

interface AncestryDetail extends Ancestry {
  heritages?: Heritage[];
  versatileHeritages?: Heritage[];
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function asAbilities(value: unknown): Array<{ name: string; description?: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === "string") return { name: entry };
      if (entry && typeof entry === "object") {
        const obj = entry as Record<string, unknown>;
        const name = typeof obj.name === "string" ? obj.name : "";
        const description = typeof obj.description === "string" ? obj.description : undefined;
        return name ? { name, description } : null;
      }
      return null;
    })
    .filter((entry): entry is { name: string; description?: string } => !!entry);
}

function HeritageList({ title, heritages }: { title: string; heritages?: Heritage[] }) {
  if (!heritages?.length) return null;

  return (
    <div className="card p-6">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {heritages.map((heritage) => (
          <div key={heritage.id} className="rounded-lg border border-border bg-card/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-semibold">{heritage.name}</h3>
              <AonLink
                name={heritage.name}
                url={aonUrlFromMetadata(heritage.benefits)}
                isOfficial={heritage.is_official}
              />
            </div>
            {heritage.benefits && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {typeof heritage.benefits === "string"
                  ? heritage.benefits
                  : JSON.stringify(heritage.benefits)}
              </p>
            )}
            {heritage.source && (
              <p className="mt-3 text-xs text-muted-foreground">{heritage.source}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AncestryDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<AncestryDetail>({
    queryKey: ["ancestry", id],
    queryFn: async () => {
      const response = await fetch(`/api/content/ancestries/${id}`);
      if (!response.ok) throw new Error("Failed to load ancestry");
      return response.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="card mb-4 border-destructive bg-destructive/10 p-6">
          <p className="text-destructive">Ancestry not found.</p>
        </div>
        <Link
          href="/library?tab=ancestries"
          className="inline-flex items-center gap-2 text-sm text-primary"
        >
          <ArrowLeft size={14} /> Back to Ancestries
        </Link>
      </MainLayout>
    );
  }

  const boosts = asList(data.attribute_boosts);
  const flaws = asList(data.attribute_flaws);
  const languages = asList(data.languages);
  const traits = asList(data.traits);
  const abilities = asAbilities(data.special_abilities);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/library?tab=ancestries"
            className="mb-4 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80"
          >
            <ArrowLeft size={14} /> Back to Ancestries
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="mb-1 font-heading text-4xl font-bold">{data.name}</h1>
              <p className="text-muted-foreground">
                {data.size} size - {data.speed} ft. speed - {data.ancestry_hp} HP
              </p>
            </div>
            <AonLink name={data.name} isOfficial={data.is_official} />
          </div>
        </div>

        <div className="card p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Rarity</p>
              <p className="font-medium capitalize">{data.rarity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hit Points</p>
              <p className="font-medium">{data.ancestry_hp}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Size</p>
              <p className="font-medium">{data.size}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Speed</p>
              <p className="font-medium">{data.speed} ft.</p>
            </div>
          </div>
        </div>

        {traits.length > 0 && (
          <div className="card p-6">
            <h2 className="mb-3 text-xl font-semibold">Traits</h2>
            <div className="flex flex-wrap gap-2">
              {traits.map((trait) => (
                <span key={trait} className="badge badge-primary">
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="mb-4 text-xl font-semibold">Ability Boosts and Flaws</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Boosts</dt>
                <dd>{boosts.length ? boosts.join(", ") : "None listed"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Flaws</dt>
                <dd>{flaws.length ? flaws.join(", ") : "None listed"}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 text-xl font-semibold">Languages</h2>
            <p>{languages.length ? languages.join(", ") : "None listed"}</p>
          </div>
        </div>

        {data.description && (
          <div className="card p-6">
            <h2 className="mb-3 text-xl font-semibold">Description</h2>
            <p className="whitespace-pre-wrap leading-relaxed text-foreground">
              {data.description}
            </p>
          </div>
        )}

        {abilities.length > 0 && (
          <div className="card p-6">
            <h2 className="mb-4 text-xl font-semibold">Special Abilities</h2>
            <div className="space-y-4">
              {abilities.map((ability) => (
                <div key={ability.name}>
                  <h3 className="font-semibold">{ability.name}</h3>
                  {ability.description && (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {ability.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <HeritageList title="Heritages" heritages={data.heritages} />
        <HeritageList title="Versatile Heritages" heritages={data.versatileHeritages} />

        {data.source && <p className="text-sm text-muted-foreground">Source: {data.source}</p>}
      </div>
    </MainLayout>
  );
}
