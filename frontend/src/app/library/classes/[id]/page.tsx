"use client";

import { MainLayout } from "@/components/layout";
import { AonLink, aonUrlFromMetadata } from "@/components/library/AonLink";
import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/lib/types/database.types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

type CharacterClass = Tables<"character_classes">;

function metadataObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function textMeta(meta: Record<string, unknown>, key: string): string {
  const value = meta[key];
  return typeof value === "string" ? value.trim() : "";
}

function featureTitle(feature: unknown): string {
  if (typeof feature === "string") return feature;
  if (feature && typeof feature === "object") {
    const record = feature as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : "Class Feature";
    const level = typeof record.level === "number" ? ` ${record.level}` : "";
    return `${name}${level}`;
  }
  return "Class Feature";
}

function featureDescription(feature: unknown): string {
  if (feature && typeof feature === "object") {
    const description = (feature as Record<string, unknown>).description;
    return typeof description === "string" ? description : "";
  }
  return "";
}

function DetailTextSection({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return (
    <div className="card p-6">
      <h2 className="font-semibold text-xl mb-3">{title}</h2>
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{text}</p>
    </div>
  );
}

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: cls,
    isLoading,
    error,
  } = useQuery<CharacterClass, Error>({
    queryKey: ["character_classes", "detail", id],
    queryFn: async () => {
      const res = await fetch(`/api/content/classes/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading)
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      </MainLayout>
    );
  if (error || !cls)
    return (
      <MainLayout>
        <div className="card p-6 bg-destructive/10 border-destructive mb-4">
          <p className="text-destructive">Class not found.</p>
        </div>
        <Link href="/library" className="inline-flex items-center gap-2 text-primary text-sm">
          <ArrowLeft size={14} /> Back to Library
        </Link>
      </MainLayout>
    );

  const keyAttributes = Array.isArray(cls.key_attribute) ? (cls.key_attribute as string[]) : [];
  const features = Array.isArray(cls.class_features) ? cls.class_features : [];
  const metadata = metadataObject(cls.class_metadata);
  const advancementText = textMeta(metadata, "advancement_text");
  const featureDetailsText = textMeta(metadata, "feature_details_text");
  const classFeatsText = textMeta(metadata, "class_feats_text");
  const focusSpellsText = textMeta(metadata, "focus_spells_text");

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
          <h1 className="font-heading text-4xl font-bold mb-1">{cls.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
            <span>{cls.class_hp} HP per level</span>
            <span>·</span>
            <span>{cls.is_spellcaster ? "Spellcaster" : "Martial"}</span>
            {keyAttributes.length > 0 && (
              <>
                <span>·</span>
                <span>Key: {keyAttributes.join(" or ")}</span>
              </>
            )}
          </div>
          <AonLink
            name={cls.name}
            url={aonUrlFromMetadata(cls.class_metadata)}
            isOfficial={cls.is_official}
            className="mt-2"
          />
        </div>

        {cls.description && (
          <div className="card p-6">
            <h2 className="font-semibold text-xl mb-3">Description</h2>
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">{cls.description}</p>
          </div>
        )}

        {features.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-xl mb-3">Class Features</h2>
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="text-sm">
                  <p className="font-medium text-foreground">{featureTitle(feature)}</p>
                  {featureDescription(feature) && (
                    <p className="mt-1 text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {featureDescription(feature)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <DetailTextSection title="Advancement" text={advancementText} />
        <DetailTextSection title="Feature Details" text={featureDetailsText} />
        <DetailTextSection title="Class Feats" text={classFeatsText} />
        <DetailTextSection title="Focus / Special Spells" text={focusSpellsText} />

        {cls.source && <p className="text-xs text-muted-foreground">Source: {cls.source}</p>}
      </div>
    </MainLayout>
  );
}
