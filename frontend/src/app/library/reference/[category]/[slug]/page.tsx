"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MainLayout } from "@/components/layout";
import { AonLink, aonUrlFromMetadata } from "@/components/library/AonLink";
import {
  GAMEDATA_CATEGORIES,
  useGamedataEntry,
  type GamedataCategory,
} from "@/lib/hooks/use-gamedata";

function dataObject(data: unknown): Record<string, unknown> {
  if (typeof data === "string" && data.trim().startsWith("{")) {
    try {
      return dataObject(JSON.parse(data));
    } catch {
      return {};
    }
  }
  return data && typeof data === "object" && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : {};
}

function cleanContentText(value: unknown): string {
  if (value == null) return "";
  if (typeof value !== "string") {
    const obj = dataObject(value);
    return cleanContentText(
      obj.summary ?? obj.summary_markdown ?? obj.description ?? obj.text ?? obj.markdown
    );
  }

  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("{")) {
    try {
      return cleanContentText(JSON.parse(trimmed));
    } catch {
      // Clean as plain text below.
    }
  }

  return trimmed
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, " ")
    .replace(/<traits>[\s\S]*?<\/traits>/gi, " ")
    .replace(/<additional-info>[\s\S]*?<\/additional-info>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\/[A-Za-z]+\.aspx\?[^)\s]+/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function displayValue(value: unknown): string {
  if (value == null || value === "") return "-";
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return cleanContentText(value) || String(value);
}

function descriptionFromData(data: unknown): string {
  const obj = dataObject(data);
  for (const key of [
    "description",
    "text",
    "summary",
    "summary_markdown",
    "effect",
    "details",
    "flavor",
    "markdown",
  ]) {
    const cleaned = cleanContentText(obj[key]);
    if (cleaned) return cleaned;
  }
  return "";
}

export default function ReferenceDetailPage() {
  const { category, slug } = useParams<{ category: GamedataCategory; slug: string }>();
  const isValidCategory = GAMEDATA_CATEGORIES.includes(category);
  const { data, isLoading, error } = useGamedataEntry(category, slug, {
    enabled: isValidCategory && !!slug,
  });

  if (!isValidCategory) {
    return (
      <MainLayout>
        <div className="card mb-4 border-destructive bg-destructive/10 p-6">
          <p className="text-destructive">Unknown library category.</p>
        </div>
        <Link href="/library" className="inline-flex items-center gap-2 text-sm text-primary">
          <ArrowLeft size={14} /> Back to Library
        </Link>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      </MainLayout>
    );
  }

  const row = data?.data;
  if (error || !row) {
    return (
      <MainLayout>
        <div className="card mb-4 border-destructive bg-destructive/10 p-6">
          <p className="text-destructive">Reference entry not found.</p>
        </div>
        <Link
          href={`/library?tab=${category}`}
          className="inline-flex items-center gap-2 text-sm text-primary"
        >
          <ArrowLeft size={14} /> Back to {category.replace(/_/g, " ")}
        </Link>
      </MainLayout>
    );
  }

  const details = dataObject(row.data);
  const description = descriptionFromData(row.data);
  const fields = Object.entries(details).filter(
    ([key, value]) =>
      ![
        "name",
        "description",
        "text",
        "summary",
        "summary_markdown",
        "effect",
        "details",
        "flavor",
        "markdown",
        "aon_url",
        "aonUrl",
        "url",
      ].includes(key) &&
      value != null &&
      value !== ""
  );
  const detailName =
    typeof details.name === "string" && details.name.trim() ? details.name.trim() : "";
  const title = row.name || detailName || row.slug;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Link
            href={`/library?tab=${category}`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80"
          >
            <ArrowLeft size={14} /> Back to {category.replace(/_/g, " ")}
          </Link>
          <h1 className="mb-1 font-heading text-4xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{category.replace(/_/g, " ")}</p>
          <AonLink name={title} url={aonUrlFromMetadata(row.data)} className="mt-2" />
        </div>

        {description && (
          <div className="card p-6">
            <h2 className="mb-3 text-xl font-semibold">Description</h2>
            <p className="whitespace-pre-wrap leading-relaxed text-foreground">{description}</p>
          </div>
        )}

        {fields.length > 0 && (
          <div className="card p-6">
            <h2 className="mb-4 text-xl font-semibold">Details</h2>
            <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              {fields.map(([key, value]) => (
                <div key={key}>
                  <dt className="font-medium capitalize text-muted-foreground">
                    {key.replace(/_/g, " ")}
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-foreground">
                    {displayValue(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
