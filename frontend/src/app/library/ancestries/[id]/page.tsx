"use client";

import { MainLayout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/lib/types/database.types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Ancestry = Tables<"ancestries">;
type Heritage = Tables<"heritages">;

interface AncestryDetail extends Ancestry {
  heritages?: Heritage[];
}

export default function AncestryDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<AncestryDetail, Error>({
    queryKey: ["ancestries", "detail", id],
    queryFn: async () => {
      const res = await fetch(`/api/content/ancestries/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) return <MainLayout><div className="flex justify-center py-12"><div className="spinner" /></div></MainLayout>;
  if (error || !data) return (
    <MainLayout>
      <div className="card p-6 bg-destructive/10 border-destructive mb-4">
        <p className="text-destructive">Ancestry not found.</p>
      </div>
      <Link href="/library" className="inline-flex items-center gap-2 text-primary text-sm">
        <ArrowLeft size={14} /> Back to Library
      </Link>
    </MainLayout>
  );

  const boosts = Array.isArray(data.attribute_boosts) ? (data.attribute_boosts as string[]) : [];
  const flaws = Array.isArray(data.attribute_flaws) ? (data.attribute_flaws as string[]) : [];
  const languages = Array.isArray(data.languages) ? (data.languages as string[]) : [];
  const traits = Array.isArray(data.traits) ? (data.traits as string[]) : [];
  const specials = Array.isArray(data.special_abilities) ? (data.special_abilities as Array<{ name?: string; description?: string } | string>) : [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Link href="/library" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm mb-4">
            <ArrowLeft size={14} /> Back to Library
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-4xl font-bold mb-1">{data.name}</h1>
              <p className="text-muted-foreground">
                {data.size} · {data.speed} ft. · {data.ancestry_hp} HP
              </p>
            </div>
            {data.rarity !== "Common" && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{data.rarity}</span>
            )}
          </div>
        </div>

        {/* Traits */}
        {traits.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {traits.map((t) => (
              <span key={t} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{t}</span>
            ))}
          </div>
        )}

        {/* Stats card */}
        <div className="card p-5">
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {boosts.length > 0 && (
              <>
                <dt className="text-muted-foreground">Attribute Boosts</dt>
                <dd className="md:col-span-2">{boosts.join(", ")}</dd>
              </>
            )}
            {flaws.length > 0 && (
              <>
                <dt className="text-muted-foreground">Attribute Flaw</dt>
                <dd className="md:col-span-2">{flaws.join(", ")}</dd>
              </>
            )}
            {languages.length > 0 && (
              <>
                <dt className="text-muted-foreground">Languages</dt>
                <dd className="md:col-span-2">{languages.join(", ")}</dd>
              </>
            )}
          </dl>
        </div>

        {data.description && (
          <div className="card p-6">
            <h2 className="font-semibold text-xl mb-3">Description</h2>
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">{data.description}</p>
          </div>
        )}

        {/* Special Abilities */}
        {specials.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-xl mb-3">Special Abilities</h2>
            <ul className="space-y-3">
              {specials.map((s, i) => {
                if (typeof s === "string") return <li key={i} className="text-sm">• {s}</li>;
                return (
                  <li key={i} className="text-sm">
                    {s.name && <span className="font-medium">{s.name}: </span>}
                    {s.description}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Heritages */}
        {data.heritages && data.heritages.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-xl mb-3">Heritages</h2>
            <div className="space-y-4">
              {data.heritages.map((h) => (
                <div key={h.id} className="border-l-2 border-primary/30 pl-4">
                  <p className="font-medium text-sm">{h.name}</p>
                  {h.description && <p className="text-sm text-muted-foreground mt-1">{h.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.source && (
          <p className="text-xs text-muted-foreground">Source: {data.source}</p>
        )}
      </div>
    </MainLayout>
  );
}
