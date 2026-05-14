"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MainLayout } from "@/components/layout";
import { AonLink, aonUrlFromMetadata } from "@/components/library/AonLink";
import { useItem } from "@/lib/hooks/use-items";

function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function priceText(cp: number | null): string {
  if (!cp) return "—";
  if (cp >= 100) return `${cp / 100} gp`;
  if (cp >= 10) return `${cp / 10} sp`;
  return `${cp} cp`;
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading, error } = useItem(id);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      </MainLayout>
    );
  }

  if (error || !item) {
    return (
      <MainLayout>
        <div className="card mb-4 border-destructive bg-destructive/10 p-6">
          <p className="text-destructive">Item not found.</p>
        </div>
        <Link
          href="/library?tab=items"
          className="inline-flex items-center gap-2 text-sm text-primary"
        >
          <ArrowLeft size={14} /> Back to Items
        </Link>
      </MainLayout>
    );
  }

  const traits = asList(item.traits);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/library?tab=items"
            className="mb-4 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80"
          >
            <ArrowLeft size={14} /> Back to Items
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="mb-1 font-heading text-4xl font-bold">{item.name}</h1>
              <p className="text-muted-foreground">
                Level {item.level ?? 0}
                {item.item_type ? ` · ${item.item_type.replace(/_/g, " ")}` : ""}
                {item.item_subtype ? ` · ${item.item_subtype.replace(/_/g, " ")}` : ""}
              </p>
              <AonLink
                name={item.name}
                url={aonUrlFromMetadata(item.item_metadata)}
                isOfficial={item.is_official}
                className="mt-2"
              />
            </div>
            {item.rarity && item.rarity !== "Common" && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{item.rarity}</span>
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
          <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Price</dt>
              <dd className="font-medium">{priceText(item.price_cp)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Bulk</dt>
              <dd className="font-medium">{item.bulk || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Usage</dt>
              <dd className="font-medium">{item.usage || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Magical</dt>
              <dd className="font-medium">{item.is_magical ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </div>

        <div className="card p-6">
          <h2 className="mb-3 text-xl font-semibold">Description</h2>
          <p className="whitespace-pre-wrap leading-relaxed text-foreground">{item.description}</p>
        </div>

        {item.source && <p className="text-xs text-muted-foreground">Source: {item.source}</p>}
      </div>
    </MainLayout>
  );
}
