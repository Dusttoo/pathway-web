"use client";

import { MainLayout } from "@/components/layout";
import { BookOpen, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type Row = Record<string, unknown>;

type Tab = "spells" | "feats" | "classes" | "ancestries" | "backgrounds";

const TABS: { id: Tab; label: string }[] = [
  { id: "ancestries", label: "Ancestries" },
  { id: "classes", label: "Classes" },
  { id: "spells", label: "Spells" },
  { id: "feats", label: "Feats" },
  { id: "backgrounds", label: "Backgrounds" },
];

function useContent(tab: Tab, q: string, page: number) {
  return useQuery({
    queryKey: ["library", tab, q, page],
    queryFn: async () => {
      const qs = new URLSearchParams({ limit: "24", page: String(page) });
      if (q) qs.set("q", q);
      const endpoint = tab === "ancestries" ? "ancestries" : tab;
      const res = await fetch(`/api/content/${endpoint}?${qs}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<{ data: Record<string, unknown>[]; total: number; page: number; limit: number }>;
    },
  });
}

function str(v: unknown): string { return v as string ?? ""; }
function num(v: unknown): number { return v as number ?? 0; }
function bool(v: unknown): boolean { return Boolean(v); }

function ContentCard({ item, tab }: { item: Row; tab: Tab }) {
  const href = `/library/${tab}/${str(item.id)}`;
  const rarity = str(item.rarity);
  const traditions = Array.isArray(item.traditions) ? (item.traditions as string[]) : [];
  return (
    <Link href={href} className="card p-5 hover:shadow-md transition-all block">
      <div className="flex items-start justify-between mb-2">
        <p className="font-semibold">{str(item.name)}</p>
        {rarity && rarity !== "Common" && (
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full ml-2 shrink-0">{rarity}</span>
        )}
      </div>
      {tab === "spells" && (
        <p className="text-xs text-muted-foreground mb-2">
          Level {num(item.level)}
          {bool(item.is_focus_spell) ? " · Focus" : ""}
          {bool(item.is_ritual) ? " · Ritual" : ""}
          {traditions.length > 0 ? ` · ${traditions.join(", ")}` : ""}
        </p>
      )}
      {tab === "feats" && (
        <p className="text-xs text-muted-foreground mb-2">
          Level {num(item.level)}
          {item.feat_type ? ` · ${str(item.feat_type).replace(/_/g, " ")}` : ""}
        </p>
      )}
      {tab === "classes" && (
        <p className="text-xs text-muted-foreground mb-2">
          {num(item.class_hp)} HP · {bool(item.is_spellcaster) ? "Spellcaster" : "Martial"}
        </p>
      )}
      <p className="text-sm text-muted-foreground line-clamp-2">
        {str(item.description) || "—"}
      </p>
    </Link>
  );
}

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>("ancestries");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => { setPage(1); }, [tab]);

  const { data, isLoading } = useContent(tab, search, page);
  const items = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data ? Math.ceil(total / 24) : 1;

  return (
    <MainLayout>
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-lg bg-primary/10">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-4xl font-bold mb-1">Content Library</h1>
          <p className="text-muted-foreground">Pathfinder 2e rules — ancestries, classes, spells, feats, backgrounds</p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4 mb-6 flex items-center gap-3">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${tab}…`}
          className="input flex-1 border-0 bg-transparent p-0 focus:ring-0"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex space-x-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12"><div className="spinner mx-auto" /></div>
      ) : items.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted-foreground">No {tab} found{search ? ` matching "${search}"` : ""}.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <ContentCard key={str(item.id)} item={item} tab={tab} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-outline px-4 py-2 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} total)
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-outline px-4 py-2 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
}
