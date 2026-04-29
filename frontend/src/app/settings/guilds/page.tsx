"use client";

import { MainLayout } from "@/components/layout";
import { useAuth } from "@/lib/providers/auth-provider";
import type { GuildSettings } from "@/lib/types";
import { Server, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const dynamic = "force-dynamic";

function useGuildSettings(guildId: string) {
  return useQuery<GuildSettings, Error>({
    queryKey: ["guild-settings", guildId],
    queryFn: async () => {
      const res = await fetch(`/api/guild-settings/${guildId}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!guildId,
  });
}

function useUpdateGuildSettings(guildId: string) {
  const qc = useQueryClient();
  return useMutation<GuildSettings, Error, Partial<GuildSettings>>({
    mutationFn: async (patch) => {
      const res = await fetch(`/api/guild-settings/${guildId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guild-settings", guildId] }),
  });
}

function GuildSettingsForm({ guildId }: { guildId: string }) {
  const { data, isLoading, error } = useGuildSettings(guildId);
  const updateMutation = useUpdateGuildSettings(guildId);
  const [saved, setSaved] = useState(false);

  if (isLoading) return <div className="flex justify-center py-8"><div className="spinner" /></div>;
  if (error) return <p className="text-destructive text-sm">{error.message}</p>;
  if (!data) return null;

  const handleToggle = async (field: "bot_enabled" | "homebrew_enabled", value: boolean) => {
    await updateMutation.mutateAsync({ [field]: value });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="font-medium">Bot Enabled</p>
            <p className="text-sm text-muted-foreground">Allow Pathway bot commands in this server</p>
          </div>
          <button
            onClick={() => handleToggle("bot_enabled", !data.bot_enabled)}
            disabled={updateMutation.isPending}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.bot_enabled ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.bot_enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="font-medium">Homebrew Content</p>
            <p className="text-sm text-muted-foreground">Allow custom homebrew content in this server</p>
          </div>
          <button
            onClick={() => handleToggle("homebrew_enabled", !data.homebrew_enabled)}
            disabled={updateMutation.isPending}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.homebrew_enabled ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.homebrew_enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      {data.command_prefix && (
        <div className="card p-5">
          <p className="font-medium mb-1">Command Prefix</p>
          <p className="font-mono text-sm bg-muted px-2 py-1 rounded inline-block">{data.command_prefix}</p>
        </div>
      )}

      {saved && (
        <p className="text-sm text-green-400">Settings saved.</p>
      )}
    </div>
  );
}

export default function GuildSettingsPage() {
  const { user } = useAuth();
  const [guildId, setGuildId] = useState("");
  const [submitted, setSubmitted] = useState("");

  if (!user) {
    return (
      <MainLayout>
        <div className="card p-8 text-center">
          <p className="text-muted-foreground">Please log in to manage server settings.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
            ← Back to Settings
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Server className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1>Server Settings</h1>
              <p className="text-muted-foreground text-sm">Configure Pathway bot settings for your Discord server</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <p className="font-medium mb-3">Enter Discord Server ID</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={guildId}
              onChange={(e) => setGuildId(e.target.value)}
              placeholder="e.g. 1234567890123456789"
              className="input flex-1 font-mono"
            />
            <button
              onClick={() => setSubmitted(guildId)}
              disabled={!guildId.trim()}
              className="btn-primary px-4"
            >
              Load
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Right-click your server in Discord → Copy Server ID (requires Developer Mode).
          </p>
        </div>

        {submitted && <GuildSettingsForm guildId={submitted} />}
      </div>
    </MainLayout>
  );
}
