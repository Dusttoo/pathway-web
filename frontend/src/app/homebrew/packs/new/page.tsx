"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { HomebrewImageUpload } from "@/components/homebrew/HomebrewImageUpload";
import { useCreateHomebrewPack } from "@/lib/hooks/use-homebrew-packs";
import { ArrowLeft, Boxes } from "lucide-react";

export default function NewHomebrewPackPage() {
  const router = useRouter();
  const createPack = useCreateHomebrewPack();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"private" | "shared" | "public">("private");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [contentTypes, setContentTypes] = useState<Set<"spell" | "item">>(
    new Set(["spell", "item"])
  );
  const [error, setError] = useState<string | null>(null);

  function toggleType(type: "spell" | "item") {
    setContentTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next.size ? next : prev;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Pack title is required.");
      return;
    }

    try {
      const result = await createPack.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        cover_image_url: coverImageUrl,
        visibility,
        status,
        content_types: Array.from(contentTypes),
      });
      router.push(`/homebrew/packs/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create pack.");
    }
  }

  return (
    <MainLayout>
      <div className="max-w-4xl space-y-6">
        <Link href="/homebrew/packs" className="inline-flex items-center gap-2 text-sm text-primary">
          <ArrowLeft size={14} />
          Back to Packs
        </Link>

        <div>
          <h1 className="font-heading text-3xl font-bold mb-1 flex items-center gap-2">
            <Boxes className="text-primary" size={28} />
            New Homebrew Pack
          </h1>
          <p className="text-sm text-muted-foreground">
            Create a collection that can hold homebrew spells, items, or both.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto]">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Pack Title</label>
                  <input
                    className="input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Retired Spells of Old"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Description</label>
                  <textarea
                    className="input min-h-[140px] resize-y"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this pack for?"
                  />
                </div>
              </div>
              <HomebrewImageUpload
                value={coverImageUrl}
                onChange={setCoverImageUrl}
                label="Cover Art"
                recommendedSize="1200x675 px"
              />
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pack Settings
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Visibility</label>
                <select
                  className="input"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as "private" | "shared" | "public")}
                >
                  <option value="private">Private</option>
                  <option value="shared">Shared link</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select
                  className="input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                >
                  <option value="draft">Draft / WIP</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Allowed Content</label>
              <div className="flex flex-wrap gap-2">
                {(["spell", "item"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={`rounded-full border-2 px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                      contentTypes.has(type)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {type}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={createPack.isPending}
              className="btn-primary inline-flex items-center gap-2"
            >
              {createPack.isPending ? <div className="spinner h-4 w-4" /> : <Boxes size={16} />}
              Create Pack
            </button>
            <Link href="/homebrew/packs" className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
