"use client";

export const dynamic = "force-dynamic";

import { MainLayout } from "@/components/layout";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  Shield,
  Users,
  Swords,
  BookOpen,
  Activity,
  ArrowLeft,
  MessageSquare,
  Database,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminStats {
  totalUsers: number;
  totalCharacters: number;
  totalEncounters: number;
  activeEncounters: number;
  totalHomebrewEntries: number;
}

interface RecentUser {
  id: string;
  discord_username: string | null;
  discord_id: string;
  is_admin: boolean;
  created_at: string;
}

interface AdminData {
  stats: AdminStats;
  recentUsers: RecentUser[];
}

// ── Data hook ─────────────────────────────────────────────────────────────────

function useAdminStats() {
  return useQuery<AdminData, Error>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    staleTime: 60_000, // refresh every minute
  });
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
  sub?: string;
}) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`p-2 rounded-lg ${bg}`}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data, isLoading, error } = useAdminStats();

  // Redirect non-admins as soon as auth resolves
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
        <div className="card p-6 bg-destructive/10 border-destructive">
          <p className="text-destructive font-semibold">Access denied</p>
          <p className="text-sm text-muted-foreground mt-1">
            You need admin privileges to view this page.
          </p>
          <Link
            href="/settings"
            className="mt-4 inline-flex items-center gap-2 text-sm text-primary"
          >
            <ArrowLeft size={14} /> Back to Settings
          </Link>
        </div>
      </MainLayout>
    );
  }

  const stats = data?.stats;
  const recentUsers = data?.recentUsers ?? [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/settings"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1"
          >
            <ArrowLeft size={13} /> Back to Settings
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Shield className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h1>Admin Settings</h1>
              <p className="text-muted-foreground text-sm">Platform overview and user management</p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="spinner" />
          </div>
        ) : error ? (
          <div className="card p-4 bg-destructive/10 border-destructive text-sm text-destructive">
            Failed to load stats: {error.message}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              label="Total Users"
              value={stats.totalUsers}
              icon={Users}
              color="text-blue-400"
              bg="bg-blue-500/10"
            />
            <StatCard
              label="Characters"
              value={stats.totalCharacters}
              icon={BookOpen}
              color="text-purple-400"
              bg="bg-purple-500/10"
            />
            <StatCard
              label="Encounters"
              value={stats.totalEncounters}
              icon={Swords}
              color="text-orange-400"
              bg="bg-orange-500/10"
              sub={`${stats.activeEncounters} active now`}
            />
            <StatCard
              label="Homebrew Entries"
              value={stats.totalHomebrewEntries}
              icon={BookOpen}
              color="text-green-400"
              bg="bg-green-500/10"
            />
            <StatCard
              label="Avg Chars / User"
              value={
                stats.totalUsers > 0 ? (stats.totalCharacters / stats.totalUsers).toFixed(1) : "—"
              }
              icon={Activity}
              color="text-chart-1"
              bg="bg-chart-1/10"
            />
          </div>
        ) : null}

        <Link
          href="/settings/admin/feedback"
          className="card flex items-start gap-4 p-5 transition-all hover:scale-[1.01] hover:shadow-lg"
        >
          <div className="rounded-lg bg-primary/10 p-2">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Feedback Inbox</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Review feedback and contact form submissions.
            </p>
          </div>
        </Link>

        <Link
          href="/settings/admin/imports"
          className="card flex items-start gap-4 p-5 transition-all hover:scale-[1.01] hover:shadow-lg"
        >
          <div className="rounded-lg bg-primary/10 p-2">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Importer Operations</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Queue Archives of Nethys runs and review ingestion history.
            </p>
          </div>
        </Link>

        {/* Recent users */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users size={16} className="text-muted-foreground" />
            Recently Joined Users
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="spinner" />
            </div>
          ) : recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Username</th>
                    <th className="pb-2 font-medium text-muted-foreground">Discord ID</th>
                    <th className="pb-2 font-medium text-muted-foreground">Joined</th>
                    <th className="pb-2 font-medium text-muted-foreground">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((u) => (
                    <tr key={u.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5 font-medium">
                        {u.discord_username ?? (
                          <span className="text-muted-foreground italic">unknown</span>
                        )}
                      </td>
                      <td className="py-2.5 font-mono text-xs text-muted-foreground">
                        {u.discord_id}
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            u.is_admin
                              ? "bg-red-500/10 text-red-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {u.is_admin ? "Admin" : "User"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
