"use client";

export const dynamic = "force-dynamic";

import { MainLayout } from "@/components/layout";
import { useAuth } from "@/lib/providers/auth-provider";
import type { GuildSettings } from "@/lib/types";
import { Server, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DiscordGuild } from "@/app/api/discord/guilds/route";

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useDiscordGuilds() {
  return useQuery<DiscordGuild[], Error>({
    queryKey: ["discord-guilds"],
    queryFn: async () => {
      const res = await fetch("/api/discord/guilds");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    staleTime: 5 * 60_000,
  });
}

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

// ── Guild selector ────────────────────────────────────────────────────────────

function GuildSelector({
  guilds,
  selected,
  onSelect,
}: {
  guilds: DiscordGuild[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const current = guilds.find((g) => g.id === selected);

  return (
    <div className="card p-5">
      <p className="font-medium mb-3">Select a Server</p>
      <div className="relative">
        <select
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
          className="input appearance-none pr-10 cursor-pointer"
        >
          <option value="">— choose a server —</option>
          {guilds.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
      </div>
      {current && (
        <p className="text-xs text-muted-foreground mt-2 font-mono">
          ID: {current.id}
        </p>
      )}
    </div>
  );
}

// ── Settings form ─────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function GuildSettingsForm({ guildId }: { guildId: string }) {
  const { data, isLoading, error } = useGuildSettings(guildId);
  const updateMutation = useUpdateGuildSettings(guildId);
  const [saved, setSaved] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-4 bg-destructive/10 border-destructive text-sm text-destructive">
        {error.message}
      </div>
    );
  }

  if (!data) return null;

  const handleToggle = async (
    field: "bot_enabled" | "homebrew_enabled",
    value: boolean
  ) => {
    await updateMutation.mutateAsync({ [field]: value });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Bot Enabled</p>
            <p className="text-sm text-muted-foreground">
              Allow Pathway bot commands in this server
            </p>
          </div>
          <Toggle
            checked={data.bot_enabled}
            onChange={(v) => handleToggle("bot_enabled", v)}
            disabled={updateMutation.isPending}
          />
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Homebrew Content</p>
            <p className="text-sm text-muted-foreground">
              Allow custom homebrew content in this server
            </p>
          </div>
          <Toggle
            checked={data.homebrew_enabled}
            onChange={(v) => handleToggle("homebrew_enabled", v)}
            disabled={updateMutation.isPending}
          />
        </div>
      </div>

      {data.command_prefix && (
        <div className="card p-5">
          <p className="font-medium mb-1">Command Prefix</p>
          <p className="font-mono text-sm bg-muted px-2 py-1 rounded inline-block">
            {data.command_prefix}
          </p>
        </div>
      )}

      {saved && (
        <p className="text-sm text-green-400 animate-fade-in">✓ Settings saved.</p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GuildSettingsPage() {
  const { user } = useAuth();
  const [selectedGuildId, setSelectedGuildId] = useState("");
  const { data: guilds, isLoading: guildsLoading, error: guildsError } = useDiscordGuilds();

  if (!user) {
    return (
      <MainLayout>
        <div className="card p-8 text-center">
          <p className="text-muted-foreground">
            Please log in to manage server settings.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/settings"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Settings
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Server className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1>Server Settings</h1>
              <p className="text-muted-foreground text-sm">
                Configure Pathway bot settings for your Discord servers
              </p>
            </div>
          </div>
        </div>

        {/* Guild picker */}
        {guildsLoading ? (
          <div className="flex justify-center py-6">
            <div className="spinner" />
          </div>
        ) : guildsError ? (
          <div className="card p-4 bg-destructive/10 border-destructive text-sm text-destructive">
            {guildsError.message.includes("No Discord token")
              ? "Your Discord session has expired. Please log out and log back in to refresh it."
              : guildsError.message}
          </div>
        ) : guilds && guilds.length > 0 ? (
          <GuildSelector
            guilds={guilds}
            selected={selectedGuildId}
            onSelect={setSelectedGuildId}
          />
        ) : (
          <div className="card p-6 text-center text-sm text-muted-foreground">
            No Discord servers found. Make sure you&apos;re a member of at least one server.
          </div>
        )}

        {/* Settings for the selected guild */}
        {selectedGuildId && <GuildSettingsForm guildId={selectedGuildId} />}
      </div>
    </MainLayout>
  );
}
