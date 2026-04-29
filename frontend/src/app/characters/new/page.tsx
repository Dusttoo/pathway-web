"use client";

import { MainLayout } from "@/components/layout";
import { useCreateCharacter } from "@/lib/hooks/use-characters";
import { useAuth } from "@/lib/providers/auth-provider";
import { ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewCharacterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const createMutation = useCreateCharacter();

  const [mode, setMode] = useState<"id" | "json">("id");
  const [pathbuilderId, setPathbuilderId] = useState("");
  const [guildId, setGuildId] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  if (!user) {
    return (
      <MainLayout>
        <div className="card p-8 text-center">
          <p className="text-muted-foreground">Please log in to import a character.</p>
        </div>
      </MainLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJsonError(null);

    if (!guildId.trim()) {
      setJsonError("Discord Server ID is required.");
      return;
    }

    let payload: Parameters<typeof createMutation.mutateAsync>[0];

    if (mode === "id") {
      const id = parseInt(pathbuilderId, 10);
      if (!pathbuilderId || isNaN(id)) {
        setJsonError("Enter a valid Pathbuilder character ID (number).");
        return;
      }
      payload = { discord_guild_id: guildId, pathbuilder_id: id };
    } else {
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        setJsonError("Invalid JSON — please check the format.");
        return;
      }
      payload = { discord_guild_id: guildId, pathbuilder_data: parsed };
    }

    try {
      const character = await createMutation.mutateAsync(payload);
      router.push(`/characters/${character.id}`);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : "Import failed.");
    }
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <Link href="/characters" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={16} />
          Back to Characters
        </Link>
        <h1 className="font-heading text-3xl font-bold">Import Character</h1>
        <p className="text-muted-foreground mt-1">
          Import your Pathfinder 2e character from Pathbuilder 2e.
        </p>
      </div>

      <div className="max-w-xl">
        <div className="card p-6">
          {/* Mode tabs */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setMode("id")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "id" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              }`}
            >
              By Pathbuilder ID
            </button>
            <button
              type="button"
              onClick={() => setMode("json")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "json" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              }`}
            >
              Paste JSON Export
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="guild-id">
                Discord Server ID
              </label>
              <input
                id="guild-id"
                type="text"
                value={guildId}
                onChange={(e) => setGuildId(e.target.value)}
                placeholder="e.g. 1234567890123456789"
                className="input w-full font-mono"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Right-click your server icon in Discord → Copy Server ID (Developer Mode required).
              </p>
            </div>

            {mode === "id" ? (
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="pathbuilder-id">
                  Pathbuilder Character ID
                </label>
                <input
                  id="pathbuilder-id"
                  type="number"
                  value={pathbuilderId}
                  onChange={(e) => setPathbuilderId(e.target.value)}
                  placeholder="e.g. 123456"
                  className="input w-full"
                  min="1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Find this in Pathbuilder 2e under Share → Export to Pathbuilder Code.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="json-export">
                  Pathbuilder JSON Export
                </label>
                <textarea
                  id="json-export"
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder='{"success":true,"build":{...}}'
                  className="input w-full font-mono text-xs min-h-[200px] resize-y"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  In Pathbuilder 2e: Menu → Export → Export to JSON, then paste the result here.
                </p>
              </div>
            )}

            {jsonError && (
              <p className="text-sm text-destructive">{jsonError}</p>
            )}

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <><div className="spinner w-4 h-4" /> Importing…</>
              ) : (
                <><Upload size={16} /> Import Character</>
              )}
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
