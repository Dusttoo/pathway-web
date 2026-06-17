"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BuilderShell } from "@/components/characters/builder-v2/BuilderShell";
import { useCreateCharacter } from "@/lib/hooks/use-characters";
import { useAuth } from "@/lib/providers/auth-provider";
import { ArrowLeft, Menu, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// ── Pathbuilder import form ───────────────────────────────────────────────────

function PathbuilderImportForm() {
  const router = useRouter();
  const createMutation = useCreateCharacter();

  const [mode, setMode] = useState<"id" | "json">("id");
  const [pathbuilderId, setPathbuilderId] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

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
        {mode === "id" ? (
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="pathbuilder-id">
              Pathbuilder Character ID
            </label>
            <input
              id="pathbuilder-id"
              type="text"
              inputMode="numeric"
              pattern="[0-9+-]*"
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
      <ProtectedRoute>
        <div className="card p-8 text-center">
          <p className="text-muted-foreground">Please log in to create a character.</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="pb-sheet-page pb-builder-page">
        <div className="pb-sheet-topbar">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/characters" className="pb-menu-button" title="Back to Characters">
              <Menu size={24} />
              <span>Menu</span>
            </Link>
            <div className="hidden h-8 w-px bg-[#8f6424]/50 sm:block" />
            <div className="flex min-w-0 items-center gap-3">
              <Sparkles size={20} className="shrink-0 text-[#d8a646]" />
              <span className="truncate text-xl font-semibold text-[#f3e5c1]">
                New Character - Builder
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setTab("build")}
              className={`pb-top-action ${tab === "build" ? "pb-top-action-active" : ""}`}
            >
              Build Character
            </button>
            <button
              type="button"
              onClick={() => setTab("import")}
              className={`pb-top-action ${tab === "import" ? "pb-top-action-active" : ""}`}
            >
              Import
            </button>
          </div>
        </div>

        {tab === "build" ? (
          <BuilderShell />
        ) : (
          <div className="pb-import-shell">
            <Link href="/characters" className="inline-flex items-center gap-2 text-sm text-[#d8a646] hover:text-white">
              <ArrowLeft size={16} />
              Back to Characters
            </Link>
            <div className="mt-6 max-w-2xl">
              <PathbuilderImportForm />
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
