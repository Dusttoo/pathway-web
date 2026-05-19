"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { HomebrewImageUpload } from "@/components/homebrew/HomebrewImageUpload";
import { useHomebrew } from "@/lib/hooks/use-homebrew";
import {
  useAddHomebrewPackEntry,
  useHomebrewPack,
  useRemoveHomebrewPackEntry,
  useUpdateHomebrewPack,
  type HomebrewPackContentType,
} from "@/lib/hooks/use-homebrew-packs";
import {
  ArrowLeft,
  Boxes,
  ExternalLink,
  Package,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";

function entrySummary(data: unknown): string {
  if (!data || typeof data !== "object" || Array.isArray(data)) return "";
  const obj = data as Record<string, unknown>;
  const text = obj.summary ?? obj.description ?? obj.notes ?? obj.traits;
  return typeof text === "string" ? text : "";
}

function entryMeta(type: string, data: unknown): string {
  if (!data || typeof data !== "object" || Array.isArray(data)) return type;
  const obj = data as Record<string, unknown>;
  if (type === "spell") {
    const bits = [obj.type, obj.level !== undefined ? `Rank ${obj.level}` : null, obj.traditions]
      .filter(Boolean)
      .map(String);
    return bits.join(" · ");
  }
  const bits = [obj.category, obj.level !== undefined ? `Level ${obj.level}` : null, obj.price_raw]
    .filter(Boolean)
    .map(String);
  return bits.join(" · ");
}

function formatType(type: string) {
  return type === "spell" ? "Spell" : "Item";
}

export default function HomebrewPackDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, error } = useHomebrewPack(id);
  const updatePack = useUpdateHomebrewPack();
  const addEntry = useAddHomebrewPackEntry(id);
  const removeEntry = useRemoveHomebrewPackEntry(id);

  const [selectedType, setSelectedType] = useState<HomebrewPackContentType>("spell");
  const [selectedEntryId, setSelectedEntryId] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftCover, setDraftCover] = useState<string | null>(null);
  const [draftVisibility, setDraftVisibility] = useState<"private" | "shared" | "public">("private");
  const [draftStatus, setDraftStatus] = useState<"draft" | "published">("draft");

  const pack = data?.data;
  const canWrite = data?.canWrite ?? false;

  const allowedType = pack?.content_types.includes(selectedType)
    ? selectedType
    : (pack?.content_types[0] as HomebrewPackContentType | undefined) ?? "spell";

  const { data: candidatesData } = useHomebrew({
    type: allowedType,
    limit: 100,
  });

  const existingIds = useMemo(
    () => new Set((data?.entries ?? []).map((entry) => entry.homebrew_entry_id)),
    [data?.entries]
  );

  const candidates = useMemo(
    () => (candidatesData?.data ?? []).filter((entry) => !existingIds.has(entry.id)),
    [candidatesData?.data, existingIds]
  );

  useEffect(() => {
    if (!pack) return;
    setDraftTitle(pack.title);
    setDraftDescription(pack.description ?? "");
    setDraftCover(pack.cover_image_url);
    setDraftVisibility(pack.visibility);
    setDraftStatus(pack.status);
    if (!pack.content_types.includes(selectedType)) {
      setSelectedType(pack.content_types[0] as HomebrewPackContentType);
    }
  }, [pack?.id]);

  async function handleSave() {
    if (!pack) return;
    setSaveError(null);
    try {
      await updatePack.mutateAsync({
        id: pack.id,
        title: draftTitle,
        description: draftDescription,
        cover_image_url: draftCover,
        visibility: draftVisibility,
        status: draftStatus,
        content_types: pack.content_types,
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save pack.");
    }
  }

  async function handleAddEntry() {
    setAddError(null);
    if (!selectedEntryId) return;
    try {
      await addEntry.mutateAsync({ homebrew_entry_id: selectedEntryId });
      setSelectedEntryId("");
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add entry.");
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <Link href="/homebrew/packs" className="inline-flex items-center gap-2 text-sm text-primary">
          <ArrowLeft size={14} />
          Back to Packs
        </Link>

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

        {pack && (
          <>
            <div className="card overflow-hidden">
              {draftCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draftCover} alt="" className="h-64 w-full object-cover" />
              ) : (
                <div className="flex h-52 items-center justify-center bg-muted/50">
                  <Boxes size={42} className="text-muted-foreground" />
                </div>
              )}
              <div className="p-6 space-y-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h1 className="font-heading text-4xl font-bold">{pack.title}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {data.entries.length} entries · {pack.content_types.map((t) => `${t}s`).join(", ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs capitalize text-muted-foreground">
                      {pack.status}
                    </span>
                    <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs capitalize text-muted-foreground">
                      {pack.visibility}
                    </span>
                  </div>
                </div>
                {pack.description && (
                  <p className="max-w-4xl whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {pack.description}
                  </p>
                )}
              </div>
            </div>

            {canWrite && (
              <div className="card p-6 space-y-5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Editor
                </h2>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Title</label>
                      <input
                        className="input"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Description</label>
                      <textarea
                        className="input min-h-[120px] resize-y"
                        value={draftDescription}
                        onChange={(e) => setDraftDescription(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium">Visibility</label>
                        <select
                          className="input"
                          value={draftVisibility}
                          onChange={(e) =>
                            setDraftVisibility(e.target.value as "private" | "shared" | "public")
                          }
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
                          value={draftStatus}
                          onChange={(e) => setDraftStatus(e.target.value as "draft" | "published")}
                        >
                          <option value="draft">Draft / WIP</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <HomebrewImageUpload
                    value={draftCover}
                    onChange={setDraftCover}
                    label="Cover Art"
                    recommendedSize="1200x675 px"
                  />
                </div>
                {saveError && <p className="text-sm font-medium text-destructive">{saveError}</p>}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={updatePack.isPending}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {updatePack.isPending ? <div className="spinner h-4 w-4" /> : <Save size={16} />}
                  Save Pack
                </button>
              </div>
            )}

            {canWrite && (
              <div className="card p-6 space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Add Spell or Item
                </h2>
                <div className="flex flex-wrap gap-2">
                  {pack.content_types.includes("spell") && (
                    <Link
                      href={`/homebrew/spells/new?packId=${pack.id}`}
                      className="btn-outline inline-flex items-center gap-2"
                    >
                      <Sparkles size={16} />
                      Create Spell in Pack
                    </Link>
                  )}
                  {pack.content_types.includes("item") && (
                    <Link
                      href={`/homebrew/items/new?packId=${pack.id}`}
                      className="btn-outline inline-flex items-center gap-2"
                    >
                      <Package size={16} />
                      Create Item in Pack
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[180px_1fr_auto]">
                  <select
                    className="input"
                    value={allowedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value as HomebrewPackContentType);
                      setSelectedEntryId("");
                    }}
                  >
                    {pack.content_types.map((type) => (
                      <option key={type} value={type}>
                        {formatType(type)}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input"
                    value={selectedEntryId}
                    onChange={(e) => setSelectedEntryId(e.target.value)}
                  >
                    <option value="">Choose a {allowedType}</option>
                    {candidates.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddEntry}
                    disabled={!selectedEntryId || addEntry.isPending}
                    className="btn-primary inline-flex items-center justify-center gap-2"
                  >
                    {addEntry.isPending ? <div className="spinner h-4 w-4" /> : <Plus size={16} />}
                    Add
                  </button>
                </div>
                {addError && <p className="text-sm font-medium text-destructive">{addError}</p>}
                <p className="text-xs text-muted-foreground">
                  Build a new entry directly in this pack, or add an existing homebrew spell or item.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {data.entries.map((packEntry) => {
                const entry = packEntry.homebrew_entry;
                const type = entry.type;
                const Icon = type === "spell" ? Sparkles : Package;
                return (
                  <div key={packEntry.id} className="card p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                          <Icon size={14} />
                          {formatType(type)}
                        </div>
                        <h3 className="font-heading text-xl font-bold">{entry.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {entryMeta(type, entry.data)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Link
                          href={`/homebrew/${entry.id}`}
                          className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-primary"
                          title="Open entry"
                        >
                          <ExternalLink size={16} />
                        </Link>
                        {canWrite && (
                          <button
                            type="button"
                            onClick={() => removeEntry.mutate(packEntry.id)}
                            className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            title="Remove from pack"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    {entrySummary(entry.data) && (
                      <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                        {entrySummary(entry.data)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
