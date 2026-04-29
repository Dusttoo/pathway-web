"use client";

import { MainLayout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/lib/types/database.types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Feat = Tables<"feats">;

export default function FeatDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: feat, isLoading, error } = useQuery<Feat, Error>({
    queryKey: ["feats", "detail", id],
    queryFn: async () => {
      const res = await fetch(`/api/content/feats/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) return <MainLayout><div className="flex justify-center py-12"><div className="spinner" /></div></MainLayout>;
  if (error || !feat) return (
    <MainLayout>
      <div className="card p-6 bg-destructive/10 border-destructive mb-4">
        <p className="text-destructive">Feat not found.</p>
      </div>
      <Link href="/library" className="inline-flex items-center gap-2 text-primary text-sm">
        <ArrowLeft size={14} /> Back to Library
      </Link>
    </MainLayout>
  );

  const traits = Array.isArray(feat.traits) ? (feat.traits as string[]) : [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Link href="/library" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm mb-4">
            <ArrowLeft size={14} /> Back to Library
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-4xl font-bold mb-1">{feat.name}</h1>
              <p className="text-muted-foreground">
                Level {feat.level} feat
                {feat.feat_type ? ` · ${feat.feat_type.replace(/_/g, " ")}` : ""}
              </p>
            </div>
            {feat.rarity !== "Common" && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{feat.rarity}</span>
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

        {/* Stat line */}
        {(feat.action_cost || feat.trigger || feat.prerequisites) && (
          <div className="card p-5">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {feat.action_cost && (
                <><dt className="text-muted-foreground">Actions</dt><dd>{feat.action_cost}</dd></>
              )}
              {feat.trigger && (
                <><dt className="text-muted-foreground">Trigger</dt><dd>{feat.trigger}</dd></>
              )}
              {feat.prerequisites && (
                <>
                  <dt className="text-muted-foreground">Prerequisites</dt>
                  <dd className="md:col-span-1">{feat.prerequisites}</dd>
                </>
              )}
            </dl>
          </div>
        )}

        <div className="card p-6">
          <h2 className="font-semibold text-xl mb-3">Description</h2>
          <p className="text-foreground whitespace-pre-wrap leading-relaxed">{feat.description}</p>
        </div>

        {feat.source && (
          <p className="text-xs text-muted-foreground">Source: {feat.source}</p>
        )}
      </div>
    </MainLayout>
  );
}
