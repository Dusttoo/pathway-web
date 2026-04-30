"use client";

import { MainLayout } from "@/components/layout";
import {
  useUserSnippets,
  useGuildSnippets,
  type SnippetMap,
  snippetKeys,
} from "@/lib/hooks/use-snippets";
import { useCharacters } from "@/lib/hooks/use-characters";
import { Zap, User, Server, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// ── Mutations ─────────────────────────────────────────────────────────────────

function useCreateSnippet() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { name: string; expansion: string }>({
    mutationFn: (body) =>
      fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: snippetKeys.user() }),
  });
}

function useDeleteSnippet() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { name: string }>({
    mutationFn: (body) =>
      fetch("/api/snippets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: snippetKeys.user() }),
  });
}

// ── Create snippet form ───────────────────────────────────────────────────────

function CreateSnippetForm({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateSnippet();
  const [name, setName] = useState("");
  const [expansion, setExpansion] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !expansion.trim()) return;
    await createMutation.mutateAsync({ name: name.trim(), expansion: expansion.trim() });
    setName("");
    setExpansion("");
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3 border-primary/40 mt-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">New Snippet</p>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={14} />
        </button>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Name</label>
        <input
          className="input text-sm font-mono"
          placeholder="e.g. fire-bolt"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Spaces are replaced with hyphens automatically.
        </p>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Expansion</label>
        <input
          className="input text-sm font-mono"
          placeholder="e.g. 2d6+4 fire"
          value={expansion}
          onChange={(e) => setExpansion(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use <code className="bg-muted px-1 rounded">%1</code>,{" "}
          <code className="bg-muted px-1 rounded">%2</code> etc. for arguments.
        </p>
      </div>

      {createMutation.error && (
        <p className="text-xs text-destructive">{createMutation.error.message}</p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={createMutation.isPending || !name.trim() || !expansion.trim()}
        >
          {createMutation.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

// ── Snippet table ─────────────────────────────────────────────────────────────

function SnippetTable({
  snippets,
  empty,
  editable = false,
}: {
  snippets: SnippetMap;
  empty: string;
  editable?: boolean;
}) {
  const deleteMutation = useDeleteSnippet();
  const entries = Object.entries(snippets).sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground italic py-2">{empty}</p>;
  }

  return (
    <div className="divide-y divide-border">
      {entries.map(([name, expansion]) => {
        const hasArgs = /%\d+/.test(expansion);
        return (
          <div key={name} className="flex items-start gap-3 py-2.5 text-sm group">
            <code className="shrink-0 bg-muted px-2 py-0.5 rounded text-xs font-mono">
              {name}
            </code>
            {hasArgs && (
              <span className="shrink-0 text-xs text-amber-500 italic">takes args</span>
            )}
            <span className="text-muted-foreground font-mono text-xs break-all flex-1">
              {expansion}
            </span>
            {editable && (
              <button
                type="button"
                onClick={() => deleteMutation.mutate({ name })}
                disabled={deleteMutation.isPending}
                className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity disabled:opacity-30"
                title="Delete snippet"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SnippetsPage() {
  const { data: userRow, isLoading: userLoading } = useUserSnippets();
  const { data: characters } = useCharacters({}, {});
  const guildId = characters?.[0]?.discord_guild_id ?? null;
  const uniqueGuilds = new Set(characters?.map((c) => c.discord_guild_id).filter(Boolean));
  const isMultiGuild = uniqueGuilds.size > 1;
  const { data: guildRow, isLoading: guildLoading } = useGuildSnippets(guildId);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const userSnippets = (userRow?.snippets ?? {}) as SnippetMap;
  const guildSnippets = (guildRow?.snippets ?? {}) as SnippetMap;
  const isLoading = userLoading || guildLoading;
  const userCount = Object.keys(userSnippets).length;

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold mb-2">Roll Snippets</h1>
          <p className="text-muted-foreground">
            Reusable dice expressions — create and manage them here or with{" "}
            <code className="text-xs bg-muted px-1 rounded">/snippet</code>
          </p>
        </div>
        <div className="p-3 rounded-lg bg-primary/10">
          <Zap className="h-6 w-6 text-primary" />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal snippets */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Personal Snippets</h2>
              <span className="ml-auto text-xs text-muted-foreground">
                {userCount}/50
              </span>
            </div>

            {showCreateForm ? (
              <CreateSnippetForm onClose={() => setShowCreateForm(false)} />
            ) : (
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  disabled={userCount >= 50}
                  className="btn btn-ghost btn-sm flex items-center gap-1.5 text-primary disabled:opacity-50"
                >
                  <Plus size={13} /> New snippet
                </button>
              </div>
            )}

            <SnippetTable
              snippets={userSnippets}
              empty="No personal snippets yet. Click 'New snippet' above to create one."
              editable
            />
          </div>

          {/* Server snippets (read-only — managed by GMs) */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Server className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Server Snippets</h2>
              {isMultiGuild && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Primary server
                </span>
              )}
              <span className="ml-auto text-xs text-muted-foreground">
                {Object.keys(guildSnippets).length}/100
              </span>
            </div>
            <SnippetTable
              snippets={guildSnippets}
              empty={
                guildId
                  ? "No server snippets yet. GMs can create them with /serversnippet create."
                  : "Import a character in Discord to link your server."
              }
            />
          </div>
        </div>
      )}
    </MainLayout>
  );
}
