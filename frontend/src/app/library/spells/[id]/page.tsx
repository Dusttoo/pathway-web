"use client";

import { MainLayout } from "@/components/layout";
import { useSpell } from "@/lib/hooks/use-spells";
import { ArrowLeft, Clock, Target, Zap } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function SpellDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: spell, isLoading, error } = useSpell(id);

  if (isLoading) return <MainLayout><div className="flex justify-center py-12"><div className="spinner" /></div></MainLayout>;
  if (error || !spell) return (
    <MainLayout>
      <div className="card p-6 bg-destructive/10 border-destructive mb-4">
        <p className="text-destructive">Spell not found.</p>
      </div>
      <Link href="/library" className="inline-flex items-center gap-2 text-primary text-sm">
        <ArrowLeft size={14} /> Back to Library
      </Link>
    </MainLayout>
  );

  const traditions = Array.isArray(spell.traditions) ? (spell.traditions as string[]) : [];
  const traits = Array.isArray(spell.traits) ? (spell.traits as string[]) : [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Link href="/library" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm mb-4">
            <ArrowLeft size={14} /> Back to Library
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-4xl font-bold mb-1">{spell.name}</h1>
              <p className="text-muted-foreground">
                Level {spell.level} spell
                {spell.is_focus_spell ? " · Focus" : ""}
                {spell.is_ritual ? " · Ritual" : ""}
                {traditions.length > 0 ? ` · ${traditions.join(", ")}` : ""}
              </p>
              {spell.rarity !== "Common" && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{spell.rarity}</span>
              )}
            </div>
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

        {/* Spell Stats */}
        <div className="card p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {spell.cast_actions && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Clock className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Cast</p>
                  <p className="font-semibold text-sm">{spell.cast_actions}</p>
                </div>
              </div>
            )}
            {spell.range_text && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Target className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Range</p>
                  <p className="font-semibold text-sm">{spell.range_text}</p>
                </div>
              </div>
            )}
            {spell.area && (
              <div>
                <p className="text-xs text-muted-foreground">Area</p>
                <p className="font-semibold text-sm">{spell.area}</p>
              </div>
            )}
            {spell.duration && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Zap className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-semibold text-sm">{spell.duration}</p>
                </div>
              </div>
            )}
            {spell.defense && (
              <div>
                <p className="text-xs text-muted-foreground">Defense</p>
                <p className="font-semibold text-sm">{spell.defense}</p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="card p-6">
          <h2 className="font-semibold text-xl mb-3">Description</h2>
          <p className="text-foreground whitespace-pre-wrap leading-relaxed">{spell.description}</p>
        </div>

        {/* Heightening */}
        {spell.heightening && (
          <div className="card p-6">
            <h2 className="font-semibold text-xl mb-3">Heightened</h2>
            <p className="text-foreground whitespace-pre-wrap text-sm">
              {typeof spell.heightening === "object"
                ? (spell.heightening as { raw?: string }).raw ?? JSON.stringify(spell.heightening)
                : String(spell.heightening)}
            </p>
          </div>
        )}

        {spell.source && (
          <p className="text-xs text-muted-foreground">Source: {spell.source}</p>
        )}
      </div>
    </MainLayout>
  );
}
