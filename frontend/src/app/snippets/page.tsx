"use client";

import { MainLayout } from "@/components/layout";
import { useUserSnippets, useGuildSnippets, type SnippetMap } from "@/lib/hooks/use-snippets";
import { useCharacters } from "@/lib/hooks/use-characters";
import { Zap, User, Server } from "lucide-react";

function SnippetTable({ snippets, empty }: { snippets: SnippetMap; empty: string }) {
  const entries = Object.entries(snippets).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground italic py-2">{empty}</p>;
  }
  return (
    <div className="divide-y divide-border">
      {entries.map(([name, expansion]) => {
        const hasArgs = /%\d+/.test(expansion);
        return (
          <div key={name} className="flex items-start gap-3 py-2.5 text-sm">
            <code className="shrink-0 bg-muted px-2 py-0.5 rounded text-xs font-mono">
              {name}
            </code>
            {hasArgs && (
              <span className="shrink-0 text-xs text-amber-500 italic">takes args</span>
            )}
            <span className="text-muted-foreground font-mono text-xs break-all">
              {expansion}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function SnippetsPage() {
  const { data: userRow, isLoading: userLoading } = useUserSnippets();
  const { data: characters } = useCharacters({}, {});
  // Use first character's guild. For multi-server players this shows their
  // primary campaign — a full guild picker is a future feature.
  const guildId = characters?.[0]?.discord_guild_id ?? null;
  const uniqueGuilds = new Set(characters?.map((c) => c.discord_guild_id).filter(Boolean));
  const isMultiGuild = uniqueGuilds.size > 1;
  const { data: guildRow, isLoading: guildLoading } = useGuildSnippets(guildId);

  const userSnippets = (userRow?.snippets ?? {}) as SnippetMap;
  const guildSnippets = (guildRow?.snippets ?? {}) as SnippetMap;
  const isLoading = userLoading || guildLoading;

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold mb-2">Roll Snippets</h1>
          <p className="text-muted-foreground">
            Reusable dice expressions synced from the bot via{" "}
            <code className="text-xs bg-muted px-1 rounded">/snippet</code> and{" "}
            <code className="text-xs bg-muted px-1 rounded">/serversnippet</code>
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
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Personal Snippets</h2>
              <span className="ml-auto text-xs text-muted-foreground">
                {Object.keys(userSnippets).length}/50
              </span>
            </div>
            <SnippetTable
              snippets={userSnippets}
              empty="No personal snippets yet. Create one with /snippet create in Discord."
            />
          </div>

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
              empty={guildId ? "No server snippets yet." : "Import a character in Discord to link your server."}
            />
          </div>
        </div>
      )}
    </MainLayout>
  );
}
