"use client";

import { MainLayout } from "@/components/layout";
import { useCharacters } from "@/lib/hooks/use-characters";
import { useGuildState, type CalendarSnapshot, type WeatherSnapshot } from "@/lib/hooks/use-guild-state";
import { useAuth } from "@/lib/providers/auth-provider";
import { BookOpen, Plus, Shield, Swords, CalendarDays, Cloud, Radio } from "lucide-react";
import Link from "next/link";

function CharacterCard({ character }: { character: { id: string; name: string; class_name: string | null; ancestry_name: string | null; level: number; status: string } }) {
  return (
    <Link
      href={`/characters/${character.id}`}
      className="card p-4 hover:shadow-md transition-all bg-secondary bg-opacity-30 block"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold">{character.name}</p>
          <p className="text-sm text-muted-foreground">
            {[character.ancestry_name, character.class_name].filter(Boolean).join(" ")}
          </p>
        </div>
        <span className="text-xs bg-muted px-2 py-1 rounded-full">Lvl {character.level}</span>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full ${character.status === "active" ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
        {character.status}
      </span>
    </Link>
  );
}

function LiveChip() {
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
      <Radio size={9} className="animate-pulse" />
      Live
    </span>
  );
}

function CalendarCard({ cal }: { cal: CalendarSnapshot }) {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-muted-foreground" />
          <span className="text-sm font-semibold">Campaign Date</span>
        </div>
        <LiveChip />
      </div>
      <div>
        <p className="text-lg font-bold">{cal.seasonEmoji} {cal.description}</p>
        <p className="text-sm text-muted-foreground capitalize">{cal.weekday} · {cal.season}</p>
      </div>
      {cal.holidays.length > 0 && (
        <p className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
          🎉 {cal.holidays.join(" · ")}
        </p>
      )}
      {cal.nextHoliday && (
        <p className="text-xs text-muted-foreground">
          Next: <span className="text-foreground">{cal.nextHoliday.name}</span> in {cal.nextHoliday.daysAway} day{cal.nextHoliday.daysAway === 1 ? "" : "s"} ({cal.nextHoliday.dateString})
        </p>
      )}
    </div>
  );
}

const PRECIP_EMOJI: Record<string, string> = {
  none: "☀️", drizzle: "🌦️", light: "🌧️", moderate: "🌧️",
  heavy: "⛈️", downpour: "🌊", snow: "❄️", blizzard: "🌨️",
  hail: "🌩️", freezingRain: "🧊",
};

function WeatherCard({ wx }: { wx: WeatherSnapshot }) {
  const precipEmoji = PRECIP_EMOJI[wx.precipitation] ?? "🌤️";
  const tempColor =
    wx.temperatureF >= 90 ? "text-orange-400" :
    wx.temperatureF <= 32 ? "text-blue-400" : "text-foreground";

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud size={16} className="text-muted-foreground" />
          <span className="text-sm font-semibold">Weather</span>
        </div>
        <LiveChip />
      </div>
      <div className="flex items-baseline gap-3">
        <span className={`text-3xl font-bold tabular-nums ${tempColor}`}>{wx.temperatureF}°F</span>
        <span className="text-sm text-muted-foreground capitalize">{wx.temperatureCategory.replace(/([A-Z])/g, " $1").trim()}</span>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="bg-muted px-2 py-0.5 rounded-full">
          {precipEmoji} {wx.precipitation === "none" ? "Clear" : wx.precipitation}
          {wx.soaked ? " (soaked)" : ""}
        </span>
        {wx.wind !== "calm" && (
          <span className="bg-muted px-2 py-0.5 rounded-full">💨 {wx.wind}</span>
        )}
        {wx.fog !== "none" && (
          <span className="bg-muted px-2 py-0.5 rounded-full">🌫️ {wx.fog}</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground capitalize">{wx.climate} · {wx.season}</p>
    </div>
  );
}

function DashboardOverview() {
  const { user } = useAuth();
  const { data: characters, isLoading } = useCharacters({}, { enabled: !!user });

  const activeChars = characters?.filter((c) => c.status === "active") ?? [];
  // Derive guild ID from the first character. For players in multiple servers
  // this shows their primary campaign — a full guild picker is a future feature.
  const guildId = characters?.[0]?.discord_guild_id ?? null;
  const uniqueGuilds = new Set(characters?.map((c) => c.discord_guild_id).filter(Boolean));
  const isMultiGuild = uniqueGuilds.size > 1;
  const { calendar, weather } = useGuildState(guildId);

  const hasCampaignData = !!(calendar || weather);

  return (
    <div className="space-y-6">
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.discord_username ?? "Adventurer"}.
        </p>
      </div>

      {/* Campaign State — calendar + weather */}
      {!isLoading && !guildId && (
        <div className="card p-4 border-dashed text-center text-sm text-muted-foreground">
          Import a character via <code className="text-xs bg-muted px-1 rounded">/char import</code> in Discord to see your campaign state here.
        </div>
      )}
      {hasCampaignData && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Campaign</h3>
            {isMultiGuild && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Showing primary server
              </span>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {calendar && <CalendarCard cal={calendar} />}
            {weather && <WeatherCard wx={weather} />}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/characters" className="card p-6 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">My Characters</p>
              <p className="text-3xl text-chart-1">{isLoading ? "—" : (characters?.length ?? 0)}</p>
              <p className="text-xs text-muted-foreground">{activeChars.length} active</p>
            </div>
            <Swords className="h-5 w-5 text-chart-1 opacity-70" />
          </div>
        </Link>

        <Link href="/library/spells" className="card p-6 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">Spell Library</p>
              <p className="text-3xl text-chart-2">PF2e</p>
              <p className="text-xs text-muted-foreground">Browse spells</p>
            </div>
            <BookOpen className="h-5 w-5 text-chart-2 opacity-70" />
          </div>
        </Link>

        <Link href="/library" className="card p-6 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">Content Library</p>
              <p className="text-3xl text-chart-3">Rules</p>
              <p className="text-xs text-muted-foreground">Feats, classes, ancestries</p>
            </div>
            <Shield className="h-5 w-5 text-chart-3 opacity-70" />
          </div>
        </Link>
      </div>

      {/* Characters */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3>My Characters</h3>
          <Link href="/characters" className="text-sm text-primary hover:underline">View all</Link>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm py-4">Loading characters…</p>
        ) : characters && characters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.slice(0, 6).map((c) => (
              <CharacterCard key={c.id} character={c} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Swords className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground mb-4">No characters yet</p>
            <Link href="/characters/new" className="btn-primary inline-flex gap-2">
              <Plus size={18} />
              Import from Pathbuilder
            </Link>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="card p-6">
        <h3 className="mb-4">Quick Links</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/library/spells", label: "Spells" },
            { href: "/library/feats", label: "Feats" },
            { href: "/library/classes", label: "Classes" },
            { href: "/library/ancestries", label: "Ancestries" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="btn-outline text-center py-3">
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
