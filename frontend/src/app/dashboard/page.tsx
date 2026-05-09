"use client";

import { MainLayout } from "@/components/layout";
import {
  characterKeys,
  useCharacters,
  useUpdateCharacter,
} from "@/lib/hooks/use-characters";
import {
  useGuildState,
  type CalendarSnapshot,
  type WeatherSnapshot,
} from "@/lib/hooks/use-guild-state";
import { useAuth } from "@/lib/providers/auth-provider";
import type { CharacterOverlay } from "@/lib/types/bot-integration";
import type { Json, Tables } from "@/lib/types/database.types";
import {
  BookOpen,
  CalendarDays,
  Cloud,
  ExternalLink,
  ImagePlus,
  Loader2,
  Plus,
  Radio,
  Shield,
  Swords,
  Trash2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRef, useState } from "react";

type Character = Tables<"characters">;
type DashboardUser = Tables<"users">;

const PATHWAY_AVATAR = "/images/pathway-avatar.png";

function isRecord(value: Json | unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNestedString(value: Json | null, paths: string[][]) {
  for (const path of paths) {
    let cursor: unknown = value;
    for (const key of path) {
      if (!isRecord(cursor)) {
        cursor = null;
        break;
      }
      cursor = cursor[key];
    }
    if (typeof cursor === "string" && cursor.trim()) {
      return cursor.trim();
    }
  }

  return null;
}

function getDiscordAvatarUrl(user: DashboardUser | null) {
  if (!user?.discord_avatar) return PATHWAY_AVATAR;
  if (user.discord_avatar.startsWith("http")) return user.discord_avatar;
  return `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.discord_avatar}.png?size=256`;
}

function getDiscordName(user: DashboardUser | null) {
  if (!user?.discord_username) return "Adventurer";
  if (!user.discord_discriminator || user.discord_discriminator === "0") {
    return user.discord_username;
  }
  return `${user.discord_username}#${user.discord_discriminator}`;
}

function getCustomCharacterImage(character: Character) {
  const overlay = (character.overlay ?? {}) as CharacterOverlay;
  return overlay.profile_image_url?.trim() || null;
}

function getPathbuilderCharacterImage(character: Character) {
  return getNestedString(character.pathbuilder_data, [
    ["image"],
    ["img"],
    ["avatar"],
    ["portrait"],
    ["art"],
    ["thumbnail"],
    ["build", "image"],
    ["build", "img"],
    ["build", "avatar"],
    ["build", "portrait"],
    ["build", "art"],
    ["build", "thumbnail"],
    ["build", "character", "image"],
    ["build", "character", "portrait"],
    ["character", "image"],
    ["character", "portrait"],
  ]);
}

function getCharacterImage(character: Character) {
  return getCustomCharacterImage(character) ?? getPathbuilderCharacterImage(character);
}

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const uploadRes = await fetch("/api/homebrew/images", {
    method: "POST",
    body: formData,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({ error: uploadRes.statusText }));
    throw new Error(err.error ?? "Image upload failed");
  }

  const body = (await uploadRes.json()) as { url?: string };
  if (!body.url) throw new Error("Image upload did not return a URL");
  return body.url;
}

function CharacterImageFallback({ name }: { name: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(211,171,53,0.2),transparent_42%),linear-gradient(145deg,rgba(15,23,42,0.96),rgba(5,8,18,0.98))] text-center">
      <img
        src={PATHWAY_AVATAR}
        alt=""
        className="h-20 w-20 rounded-full border border-primary/30 object-cover opacity-75 shadow-xl"
      />
      <span className="mt-4 max-w-[80%] text-sm font-semibold text-foreground/85">
        Image for {name}
      </span>
    </div>
  );
}

function CharacterCard({ character }: { character: Character }) {
  const customImage = getCustomCharacterImage(character);
  const image = getCharacterImage(character);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const updateCharacter = useUpdateCharacter(character.id);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const subtitle = [character.ancestry_name, character.class_name]
    .filter(Boolean)
    .join(" · ");
  const updated = new Date(character.updated_at).toLocaleDateString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });

  async function saveImageUrl(url: string | null) {
    await updateCharacter.mutateAsync({
      overlay: { profile_image_url: url },
    });
    await queryClient.invalidateQueries({ queryKey: characterKeys.all });
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      await saveImageUrl(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function removeImage() {
    setUploadError(null);
    setIsUploading(true);
    try {
      await saveImageUrl(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not remove image");
    } finally {
      setIsUploading(false);
    }
  }

  const isBusy = isUploading || updateCharacter.isPending;

  return (
    <div className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={`Image for ${character.name}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <CharacterImageFallback name={character.name} />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/55 to-transparent p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-foreground">
                {character.name}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {subtitle || "Pathfinder 2e character"}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
              Lvl {character.level}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              character.status === "active"
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {character.status}
          </span>
          <span className="text-muted-foreground">{updated}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Link
            href={`/characters/${character.id}`}
            className="flex items-center justify-between gap-3 rounded-md bg-primary px-3 py-2 text-sm font-semibold !text-slate-950 transition-colors hover:bg-primary/90 [&_svg]:text-slate-950"
          >
            View Sheet
            <ExternalLink size={15} />
          </Link>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="btn-outline h-10 w-10 p-0"
            title={image ? "Replace character image" : "Upload character image"}
            aria-label={image ? "Replace character image" : "Upload character image"}
          >
            {isBusy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ImagePlus size={16} />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <div className="flex min-h-5 items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {customImage
              ? "Custom dashboard image"
              : image
                ? "Pathbuilder sheet image"
                : "Add art for this sheet"}
          </p>
          {customImage && (
            <button
              type="button"
              onClick={removeImage}
              disabled={isBusy}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 size={12} />
              Remove
            </button>
          )}
        </div>
        {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
      </div>
    </div>
  );
}

function ProfileHero({
  user,
  characterCount,
  activeCount,
  isLoading,
}: {
  user: DashboardUser | null;
  characterCount: number;
  activeCount: number;
  isLoading: boolean;
}) {
  const discordName = getDiscordName(user);
  const avatar = getDiscordAvatarUrl(user);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative min-h-[280px] bg-[linear-gradient(100deg,rgba(5,8,18,0.96),rgba(19,28,63,0.94)),url('/images/pathway-banner.png')] bg-cover bg-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(211,171,53,0.18),transparent_28%),linear-gradient(180deg,transparent,rgba(5,8,18,0.72))]" />
        <div className="relative grid min-h-[280px] items-center gap-8 p-6 md:grid-cols-[minmax(180px,300px)_1fr] md:p-10">
          <div className="flex justify-center md:justify-end">
            <img
              src={avatar}
              alt={`${discordName} profile picture`}
              className="h-40 w-40 rounded-full border-4 border-background object-cover shadow-2xl md:h-56 md:w-56"
            />
          </div>
          <div className="text-center md:text-left">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Discord Profile
            </p>
            <h1 className="text-4xl font-semibold text-white md:text-6xl">
              {discordName}
            </h1>
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
              <span className="rounded-md bg-background/75 px-4 py-2 text-sm font-semibold text-foreground backdrop-blur">
                Characters: {isLoading ? "..." : characterCount}
              </span>
              <span className="rounded-md bg-background/75 px-4 py-2 text-sm font-semibold text-foreground backdrop-blur">
                Active: {isLoading ? "..." : activeCount}
              </span>
              {user?.email && (
                <span className="rounded-md bg-background/75 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
                  {user.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LiveChip() {
  return (
    <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
      <Radio size={9} className="animate-pulse" />
      Live
    </span>
  );
}

function CalendarCard({ cal }: { cal: CalendarSnapshot }) {
  return (
    <div className="card space-y-3 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-muted-foreground" />
          <span className="text-sm font-semibold">Campaign Date</span>
        </div>
        <LiveChip />
      </div>
      <div>
        <p className="text-lg font-bold">{cal.description}</p>
        <p className="text-sm capitalize text-muted-foreground">
          {cal.weekday} · {cal.season}
        </p>
      </div>
      {cal.holidays.length > 0 && (
        <p className="rounded bg-amber-500/10 px-2 py-1 text-xs text-amber-400">
          Holidays: {cal.holidays.join(" · ")}
        </p>
      )}
      {cal.nextHoliday && (
        <p className="text-xs text-muted-foreground">
          Next:{" "}
          <span className="text-foreground">{cal.nextHoliday.name}</span> in{" "}
          {cal.nextHoliday.daysAway} day
          {cal.nextHoliday.daysAway === 1 ? "" : "s"} (
          {cal.nextHoliday.dateString})
        </p>
      )}
    </div>
  );
}

const PRECIP_LABEL: Record<string, string> = {
  none: "Clear",
  drizzle: "Drizzle",
  light: "Light rain",
  moderate: "Moderate rain",
  heavy: "Heavy rain",
  downpour: "Downpour",
  snow: "Snow",
  blizzard: "Blizzard",
  hail: "Hail",
  freezingRain: "Freezing rain",
};

function WeatherCard({ wx }: { wx: WeatherSnapshot }) {
  const tempColor =
    wx.temperatureF >= 90
      ? "text-orange-400"
      : wx.temperatureF <= 32
        ? "text-blue-400"
        : "text-foreground";

  return (
    <div className="card space-y-3 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud size={16} className="text-muted-foreground" />
          <span className="text-sm font-semibold">Weather</span>
        </div>
        <LiveChip />
      </div>
      <div className="flex items-baseline gap-3">
        <span className={`text-3xl font-bold tabular-nums ${tempColor}`}>
          {wx.temperatureF}F
        </span>
        <span className="text-sm capitalize text-muted-foreground">
          {wx.temperatureCategory.replace(/([A-Z])/g, " $1").trim()}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-muted px-2 py-0.5">
          {PRECIP_LABEL[wx.precipitation] ?? wx.precipitation}
          {wx.soaked ? " (soaked)" : ""}
        </span>
        {wx.wind !== "calm" && (
          <span className="rounded-full bg-muted px-2 py-0.5">{wx.wind}</span>
        )}
        {wx.fog !== "none" && (
          <span className="rounded-full bg-muted px-2 py-0.5">{wx.fog}</span>
        )}
      </div>
      <p className="text-xs capitalize text-muted-foreground">
        {wx.climate} · {wx.season}
      </p>
    </div>
  );
}

function DashboardOverview() {
  const { user } = useAuth();
  const { data: characters, isLoading } = useCharacters({}, { enabled: !!user });

  const activeChars = characters?.filter((c) => c.status === "active") ?? [];
  const guildId = characters?.[0]?.discord_guild_id ?? null;
  const uniqueGuilds = new Set(
    characters?.map((c) => c.discord_guild_id).filter(Boolean),
  );
  const isMultiGuild = uniqueGuilds.size > 1;
  const { calendar, weather } = useGuildState(guildId);

  const hasCampaignData = !!(calendar || weather);

  return (
    <div className="space-y-6">
      <ProfileHero
        user={user}
        characterCount={characters?.length ?? 0}
        activeCount={activeChars.length}
        isLoading={isLoading}
      />

      {!isLoading && !guildId && (
        <div className="card border-dashed p-4 text-center text-sm text-muted-foreground">
          Import a character via{" "}
          <code className="rounded bg-muted px-1 text-xs">/char import</code>{" "}
          in Discord to see your campaign state here.
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Characters</h2>
            <p className="text-sm text-muted-foreground">
              Your Pathfinder 2e character sheets and imported art.
            </p>
          </div>
          <Link href="/characters/new" className="btn-primary inline-flex gap-2">
            <Plus size={18} />
            Import Character
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-80 animate-pulse rounded-lg border border-border bg-card"
              />
            ))}
          </div>
        ) : characters && characters.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {characters.map((c) => (
              <CharacterCard key={c.id} character={c} />
            ))}
          </div>
        ) : (
          <div className="card py-12 text-center">
            <Swords className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-50" />
            <p className="mb-4 text-muted-foreground">No characters yet</p>
            <Link href="/characters/new" className="btn-primary inline-flex gap-2">
              <Plus size={18} />
              Import from Pathbuilder
            </Link>
          </div>
        )}
      </section>

      {hasCampaignData && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Campaign
            </h3>
            {isMultiGuild && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Showing primary server
              </span>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {calendar && <CalendarCard cal={calendar} />}
            {weather && <WeatherCard wx={weather} />}
          </div>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/characters"
          className="card cursor-pointer p-6 transition-all hover:scale-[1.02] hover:shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">My Characters</p>
              <p className="text-3xl text-chart-1">
                {isLoading ? "..." : (characters?.length ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                {activeChars.length} active
              </p>
            </div>
            <Swords className="h-5 w-5 text-chart-1 opacity-70" />
          </div>
        </Link>

        <Link
          href="/library/spells"
          className="card cursor-pointer p-6 transition-all hover:scale-[1.02] hover:shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Spell Library</p>
              <p className="text-3xl text-chart-2">PF2e</p>
              <p className="text-xs text-muted-foreground">Browse spells</p>
            </div>
            <BookOpen className="h-5 w-5 text-chart-2 opacity-70" />
          </div>
        </Link>

        <Link
          href="/library"
          className="card cursor-pointer p-6 transition-all hover:scale-[1.02] hover:shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Content Library</p>
              <p className="text-3xl text-chart-3">Rules</p>
              <p className="text-xs text-muted-foreground">
                Feats, classes, ancestries
              </p>
            </div>
            <Shield className="h-5 w-5 text-chart-3 opacity-70" />
          </div>
        </Link>
      </div>

      <div className="card p-6">
        <h3 className="mb-4">Quick Links</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { href: "/library/spells", label: "Spells" },
            { href: "/library/feats", label: "Feats" },
            { href: "/library/classes", label: "Classes" },
            { href: "/library/ancestries", label: "Ancestries" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="btn-outline py-3 text-center">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <MainLayout>
      <DashboardOverview />
    </MainLayout>
  );
}
