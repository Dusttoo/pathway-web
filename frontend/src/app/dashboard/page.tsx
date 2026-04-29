"use client";

import { MainLayout } from "@/components/layout";
import { useCharacters } from "@/lib/hooks/use-characters";
import { useAuth } from "@/lib/providers/auth-provider";
import { BookOpen, Plus, Shield, Swords } from "lucide-react";
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

function DashboardOverview() {
  const { user } = useAuth();
  const { data: characters, isLoading } = useCharacters({}, { enabled: !!user });

  const activeChars = characters?.filter((c) => c.status === "active") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.discord_username ?? "Adventurer"}.
        </p>
      </div>

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
