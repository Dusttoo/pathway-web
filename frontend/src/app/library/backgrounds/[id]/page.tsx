"use client";

import { MainLayout } from "@/components/layout";
import { AonLink, aonUrlFromMetadata } from "@/components/library/AonLink";
import { useBackground } from "@/lib/hooks/use-backgrounds";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function BackgroundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: bg, isLoading, error } = useBackground(id);

  if (isLoading)
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      </MainLayout>
    );
  if (error || !bg)
    return (
      <MainLayout>
        <div className="card p-6 bg-destructive/10 border-destructive mb-4">
          <p className="text-destructive">Background not found.</p>
        </div>
        <Link href="/library" className="inline-flex items-center gap-2 text-primary text-sm">
          <ArrowLeft size={14} /> Back to Library
        </Link>
      </MainLayout>
    );

  const boosts = Array.isArray(bg.attribute_boosts) ? (bg.attribute_boosts as string[]) : [];
  const skills = Array.isArray(bg.skill_proficiencies) ? (bg.skill_proficiencies as string[]) : [];
  const lore = Array.isArray(bg.lore_skills) ? (bg.lore_skills as string[]) : [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm mb-4"
          >
            <ArrowLeft size={14} /> Back to Library
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-4xl font-bold mb-1">{bg.name}</h1>
              <AonLink
                name={bg.name}
                url={aonUrlFromMetadata(bg.background_metadata)}
                isOfficial={bg.is_official}
                className="mt-2"
              />
            </div>
            {bg.rarity !== "Common" && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{bg.rarity}</span>
            )}
          </div>
        </div>

        <div className="card p-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
            {boosts.length > 0 && (
              <>
                <dt className="text-muted-foreground font-medium">Attribute Boosts</dt>
                <dd>{boosts.join(", ")}</dd>
              </>
            )}
            {skills.length > 0 && (
              <>
                <dt className="text-muted-foreground font-medium">Trained Skills</dt>
                <dd>{skills.join(", ")}</dd>
              </>
            )}
            {lore.length > 0 && (
              <>
                <dt className="text-muted-foreground font-medium">Lore Skills</dt>
                <dd>{lore.join(", ")}</dd>
              </>
            )}
          </dl>
        </div>

        {bg.description && (
          <div className="card p-6">
            <h2 className="font-semibold text-xl mb-3">Description</h2>
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">{bg.description}</p>
          </div>
        )}

        {bg.source && <p className="text-xs text-muted-foreground">Source: {bg.source}</p>}
      </div>
    </MainLayout>
  );
}
