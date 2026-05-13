"use client";

import { MainLayout } from "@/components/layout";
import { BuilderShell } from "@/components/characters/builder-v2/BuilderShell";
import { useCreateCharacter, useDiscordGuilds } from "@/lib/hooks/use-characters";
import { useAuth } from "@/lib/providers/auth-provider";
import { ArrowLeft, Upload, ChevronDown, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// ── Pathbuilder import form ───────────────────────────────────────────────────

function GuildPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { data: guilds, isLoading, error } = useDiscordGuilds();

  if (isLoading) {
    return (
      <div className="input w-full flex items-center gap-2 text-muted-foreground">
        <div className="spinner w-4 h-4" />
        Loading your servers…
      </div>
    );
  }

  if (error || !guilds?.length) {
    return (
      <div className="space-y-2">
        {error && (
          <div className="flex items-center gap-2 text-xs text-amber-500">
            <AlertCircle size={12} />
            Couldn&apos;t load servers automatically — please paste your Server ID.
          </div>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. 1234567890123456789"
          className="input w-full font-mono"
          required
        />
        <p className="text-xs text-muted-foreground">
          Right-click your server icon in Discord → Copy Server ID (Developer Mode required).
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input w-full appearance-none pr-8"
        required
      >
        <option value="">Select a server…</option>
        {guilds.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
    </div>
  );
}

function PathbuilderImportForm() {
  const router = useRouter();
  const createMutation = useCreateCharacter();

  const [mode, setMode] = useState<"id" | "json">("id");
  const [guildId, setGuildId] = useState("");
  const [pathbuilderId, setPathbuilderId] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!guildId.trim()) {
      setFormError("Please select a Discord server.");
      return;
    }

    if (mode === "id") {
      const id = parseInt(pathbuilderId, 10);
      if (!pathbuilderId || isNaN(id)) {
        setFormError("Enter a valid Pathbuilder character ID (number).");
        return;
      }
      let pbRes: Response;
      try {
        pbRes = await fetch(`https://pathbuilder2e.com/json.php?id=${id}`);
      } catch {
        setFormError("Could not reach Pathbuilder. Check your connection.");
        return;
      }
      if (!pbRes.ok) {
        setFormError(`Pathbuilder returned an error (HTTP ${pbRes.status}). Try again.`);
        return;
      }
      const pbJson = await pbRes.json();
      if (!pbJson.success) {
        setFormError(
          `ID ${id} not found or expired. Get a fresh one: Pathbuilder → Menu → Export JSON.`
        );
        return;
      }
      try {
        const character = await createMutation.mutateAsync({
          discord_guild_id: guildId,
          pathbuilder_data: pbJson,
          pathbuilder_id: id,
        });
        router.push(`/characters/${character.id}`);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Import failed.");
      }
    } else {
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        setFormError("Invalid JSON — please check the format.");
        return;
      }
      try {
        const character = await createMutation.mutateAsync({
          discord_guild_id: guildId,
          pathbuilder_data: parsed,
        });
        router.push(`/characters/${character.id}`);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Import failed.");
      }
    }
  };

  return (
    <div className="card p-6">
      {/* Sub-mode toggle */}
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
          <label className="block text-sm font-medium mb-1">Discord Server</label>
          <GuildPicker value={guildId} onChange={setGuildId} />
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
              In Pathbuilder: Menu → Export &amp; Import → Export JSON → copy the 6-digit code.
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
              In Pathbuilder: Menu → Export &amp; Import → Export JSON → Copy to Clipboard.
            </p>
          </div>
        )}

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {createMutation.isPending ? (
            <>
              <div className="spinner w-4 h-4" /> Importing…
            </>
          ) : (
            <>
              <Upload size={16} /> Add Character
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "build" | "import";

export default function NewCharacterPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("build");

  if (!user) {
    return (
      <MainLayout>
        <div className="card p-8 text-center">
          <p className="text-muted-foreground">Please log in to create a character.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <Link
          href="/characters"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft size={16} />
          Back to Characters
        </Link>
        <h1 className="font-heading text-3xl font-bold">Create Character</h1>
        <p className="text-muted-foreground mt-1">
          Build your Pathfinder 2e character directly, or import from Pathbuilder.
        </p>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2 mb-6 max-w-md">
        <button
          type="button"
          onClick={() => setTab("build")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            tab === "build"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80 text-foreground"
          }`}
        >
          Build Character
        </button>
        <button
          type="button"
          onClick={() => setTab("import")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            tab === "import"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80 text-foreground"
          }`}
        >
          Import from Pathbuilder
        </button>
      </div>

      {tab === "build" ? (
        <div className="max-w-5xl">
          <BuilderShell />
        </div>
      ) : (
        <div className="max-w-xl">
          <PathbuilderImportForm />
        </div>
      )}
    </MainLayout>
  );
}
