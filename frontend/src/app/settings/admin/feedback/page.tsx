"use client";

export const dynamic = "force-dynamic";

import { MainLayout } from "@/components/layout";
import { useAuth } from "@/lib/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bug, Lightbulb, Mail, MessageSquare, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface FeedbackSubmission {
  id: string;
  user_id: string | null;
  type: "bug" | "feature" | "feedback";
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  status: string;
  created_at: string;
}

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  discord_username: string | null;
  ip_address: string | null;
  user_agent: string | null;
  status: string;
  created_at: string;
}

interface SubmissionsResponse {
  feedback: FeedbackSubmission[];
  contact: ContactSubmission[];
}

type Tab = "feedback" | "contact";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function feedbackIcon(type: FeedbackSubmission["type"]) {
  if (type === "bug") return Bug;
  if (type === "feature") return Lightbulb;
  return MessageSquare;
}

function subjectLabel(subject: string) {
  return subject
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="card p-8 text-center">
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        New submissions will appear here after users send them.
      </p>
    </div>
  );
}

export default function AdminFeedbackPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("feedback");

  const { data, isLoading, error } = useQuery<SubmissionsResponse, Error>({
    queryKey: ["admin-submissions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/submissions");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!user?.is_admin,
    staleTime: 30_000,
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
            You need admin privileges to view submissions.
          </p>
        </div>
      </MainLayout>
    );
  }

  const feedback = data?.feedback ?? [];
  const contact = data?.contact ?? [];

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
              <h1>Feedback Inbox</h1>
              <p className="text-sm text-muted-foreground">
                Review feedback and contact form submissions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("feedback")}
            className={`btn-outline ${tab === "feedback" ? "bg-primary/10 text-primary" : ""}`}
          >
            Feedback ({feedback.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("contact")}
            className={`btn-outline ${tab === "contact" ? "bg-primary/10 text-primary" : ""}`}
          >
            Contact ({contact.length})
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="spinner" />
          </div>
        ) : error ? (
          <div className="card border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load submissions: {error.message}
          </div>
        ) : tab === "feedback" ? (
          <div className="space-y-4">
            {feedback.length === 0 ? (
              <EmptyState label="No feedback yet." />
            ) : (
              feedback.map((item) => {
                const Icon = feedbackIcon(item.type);
                return (
                  <article key={item.id} className="card p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-semibold">{item.title}</h2>
                            <span className="badge badge-secondary capitalize">{item.type}</span>
                            <span className="badge badge-outline capitalize">{item.status}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(item.created_at)}
                            {item.user_id ? ` · User ${item.user_id}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                    <pre className="mt-4 whitespace-pre-wrap rounded-md border border-border bg-muted p-4 text-sm leading-6">
                      {item.description}
                    </pre>
                    {Object.keys(item.metadata ?? {}).length > 0 && (
                      <details className="mt-3 text-sm">
                        <summary className="cursor-pointer text-muted-foreground">Metadata</summary>
                        <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                          {JSON.stringify(item.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </article>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {contact.length === 0 ? (
              <EmptyState label="No contact messages yet." />
            ) : (
              contact.map((item) => (
                <article key={item.id} className="card p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold">{subjectLabel(item.subject)}</h2>
                          <span className="badge badge-outline capitalize">{item.status}</span>
                        </div>
                        <p className="mt-1 text-sm">
                          {item.name} ·{" "}
                          <a href={`mailto:${item.email}`} className="text-primary hover:underline">
                            {item.email}
                          </a>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(item.created_at)}
                          {item.discord_username ? ` · Discord ${item.discord_username}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                  <pre className="mt-4 whitespace-pre-wrap rounded-md border border-border bg-muted p-4 text-sm leading-6">
                    {item.message}
                  </pre>
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer text-muted-foreground">
                      Request details
                    </summary>
                    <dl className="mt-2 grid gap-2 rounded-md bg-muted p-3 text-xs md:grid-cols-2">
                      <div>
                        <dt className="font-semibold">IP</dt>
                        <dd>{item.ip_address ?? "Unknown"}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold">User Agent</dt>
                        <dd className="break-all">{item.user_agent ?? "Unknown"}</dd>
                      </div>
                    </dl>
                  </details>
                </article>
              ))
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
