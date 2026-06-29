"use client";

export const dynamic = "force-dynamic";

import { MainLayout } from "@/components/layout";
import { useAuth } from "@/lib/providers/auth-provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Database, Play, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ImportRun = {
  id: string;
  source: "nethys" | "gamedata" | "manual";
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  categories: string[];
  requested_by_user_id: string | null;
  started_at: string | null;
  finished_at: string | null;
  total_fetched: number;
  total_inserted: number;
  total_updated: number;
  total_skipped: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type ImportRunsResponse = {
  importRuns: ImportRun[];
};

const DEFAULT_CATEGORIES = [
  "actions",
  "conditions",
  "deities",
  "hazards",
  "languages",
  "rituals",
  "rules",
  "sources",
  "traits",
];

function formatDate(value: string | null) {
  if (!value) return "Not started";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClass(status: ImportRun["status"]) {
  if (status === "succeeded") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  if (status === "failed") return "border-red-500/40 bg-red-500/10 text-red-200";
  if (status === "running") return "border-blue-500/40 bg-blue-500/10 text-blue-200";
  if (status === "cancelled") return "border-muted bg-muted text-muted-foreground";
  return "border-amber-500/40 bg-amber-500/10 text-amber-200";
}

export default function AdminImportsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>(DEFAULT_CATEGORIES);

  const { data, isLoading, error } = useQuery<ImportRunsResponse, Error>({
    queryKey: ["admin-import-runs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/import-runs");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!user?.is_admin,
    staleTime: 30_000,
  });

  const queueRun = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/import-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "nethys",
          categories: selected,
          metadata: { queued_from: "admin_imports_page" },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-import-runs"] });
    },
  });

  useEffect(() => {
    if (!authLoading && user && !user.is_admin) {
      router.replace("/settings");
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      </MainLayout>
    );
  }

  if (!user?.is_admin) {
    return (
      <MainLayout>
        <div className="card border-destructive bg-destructive/10 p-6">
          <p className="font-semibold text-destructive">Access denied</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You need admin privileges to view importer operations.
          </p>
        </div>
      </MainLayout>
    );
  }

  const runs = data?.importRuns ?? [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/settings/admin"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={13} /> Back to Admin
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2">
              <Shield className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h1>Importer Operations</h1>
              <p className="text-sm text-muted-foreground">
                Queue and review Archives of Nethys ingestion runs.
              </p>
            </div>
          </div>
        </div>

        <section className="card p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-semibold">Queue Nethys Import</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This creates a durable queued run for the scheduled importer or worker to process.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {DEFAULT_CATEGORIES.map((category) => {
                  const active = selected.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() =>
                        setSelected((current) =>
                          active
                            ? current.filter((item) => item !== category)
                            : [...current, category]
                        )
                      }
                      className={`rounded-md border px-3 py-1.5 text-sm capitalize transition ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {category.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => queueRun.mutate()}
              disabled={queueRun.isPending || selected.length === 0}
              className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Play size={16} />
              {queueRun.isPending ? "Queueing..." : "Queue Run"}
            </button>
          </div>
          {queueRun.error && (
            <p className="mt-3 text-sm text-destructive">Failed to queue: {queueRun.error.message}</p>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Recent Import Runs</h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="spinner" />
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
              Failed to load import runs: {error.message}
            </div>
          ) : runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No import runs recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Status</th>
                    <th className="pb-2 font-medium text-muted-foreground">Source</th>
                    <th className="pb-2 font-medium text-muted-foreground">Categories</th>
                    <th className="pb-2 font-medium text-muted-foreground">Totals</th>
                    <th className="pb-2 font-medium text-muted-foreground">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(
                            run.status
                          )}`}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td className="py-3 capitalize">{run.source}</td>
                      <td className="max-w-xs py-3 text-muted-foreground">
                        {run.categories.length ? run.categories.join(", ") : "All categories"}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {run.total_fetched} fetched · {run.total_inserted} new ·{" "}
                        {run.total_updated} updated
                      </td>
                      <td className="py-3 text-muted-foreground">{formatDate(run.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
