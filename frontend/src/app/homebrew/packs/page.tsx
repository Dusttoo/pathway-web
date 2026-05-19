"use client";

import { useState } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layout";
import { useDeleteHomebrewPack, useHomebrewPacks } from "@/lib/hooks/use-homebrew-packs";
import { ArrowLeft, Boxes, ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HomebrewPacksPage() {
  const [q, setQ] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data, isLoading, error } = useHomebrewPacks(q);
  const deletePack = useDeleteHomebrewPack();

  async function handleDelete(id: string) {
    if (!confirm("Delete this pack? This removes the group, not the homebrew entries inside it.")) {
      return;
    }
    setDeletingId(id);
    try {
      await deletePack.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <Link href="/homebrew" className="inline-flex items-center gap-2 text-sm text-primary">
          <ArrowLeft size={14} />
          Back to Homebrew
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-heading text-4xl font-bold mb-2 flex items-center gap-3">
              <Boxes className="text-primary" size={34} />
              Homebrew Packs
            </h1>
            <p className="text-muted-foreground">
              Group custom spells and items into shareable collections for campaigns, crafting,
              shops, treasure lists, and bot-ready content.
            </p>
          </div>
          <Link href="/homebrew/packs/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} />
            New Pack
          </Link>
        </div>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            className="input pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your packs..."
          />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="spinner" />
          </div>
        )}

        {error && (
          <div className="card border-destructive bg-destructive/10 p-5 text-sm text-destructive">
            {error.message}
          </div>
        )}

        {!isLoading && !error && data?.data.length === 0 && (
          <div className="card p-12 text-center">
            <Boxes size={42} className="mx-auto mb-4 text-muted-foreground" />
            <h2 className="font-heading text-xl font-bold mb-1">No packs yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Make your first spell or item pack, then add homebrew entries you have already saved.
            </p>
            <Link href="/homebrew/packs/new" className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} />
              Create Pack
            </Link>
          </div>
        )}

        {data && data.data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {data.data.map((pack) => (
              <div key={pack.id} className="card overflow-hidden">
                {pack.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pack.cover_image_url}
                    alt=""
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-muted/50">
                    <Boxes size={40} className="text-muted-foreground" />
                  </div>
                )}
                <div className="p-5 space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-heading text-xl font-bold">{pack.title}</h2>
                      <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs capitalize text-muted-foreground">
                        {pack.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {pack.entry_count ?? 0} entries · {pack.content_types.join(", ")}
                    </p>
                  </div>

                  {pack.description && (
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {pack.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>Updated {formatDate(pack.updated_at)}</span>
                    <span className="capitalize">{pack.visibility}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/homebrew/packs/${pack.id}`}
                      className="btn-primary flex flex-1 items-center justify-center gap-2"
                    >
                      <ExternalLink size={15} />
                      Open
                    </Link>
                    <Link
                      href={`/homebrew/packs/${pack.id}`}
                      className="btn-outline inline-flex items-center gap-2"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(pack.id)}
                      disabled={deletingId === pack.id}
                      className="btn-outline inline-flex items-center gap-2 text-destructive hover:border-destructive"
                      title="Delete"
                    >
                      {deletingId === pack.id ? <div className="spinner h-4 w-4" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
