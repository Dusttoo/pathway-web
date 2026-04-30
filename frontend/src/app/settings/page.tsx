"use client";

import { MainLayout } from "@/components/layout";
import { useAuth } from "@/lib/providers/auth-provider";
import { Bell, CreditCard, Server, Shield, User } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { user } = useAuth();

  const settingsSections = [
    {
      title: "Guild Management",
      description: "Manage your Discord guilds and server memberships",
      icon: Server,
      href: "/settings/guilds",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Subscription & Billing",
      description: "View your subscription, usage, and manage billing",
      icon: CreditCard,
      href: "/settings/subscription",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      comingSoon: true,
    },
    {
      title: "Account Settings",
      description: "Update your profile and account preferences",
      icon: User,
      href: "/settings/account",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      comingSoon: true,
    },
    {
      title: "Notifications",
      description: "Configure notification preferences and alerts",
      icon: Bell,
      href: "/settings/notifications",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      comingSoon: true,
    },
  ];

  // Add admin settings if user is admin
  if (user?.is_admin) {
    settingsSections.push({
      title: "Admin Settings",
      description: "Manage platform settings and monitor usage",
      icon: Shield,
      href: "/settings/admin",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    });
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1>Settings</h1>
          <p className="text-muted-foreground">
            Manage your account, subscriptions, and preferences
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const content = (
              <div
                className={`card p-6 transition-all ${
                  section.comingSoon
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${section.bgColor}`}>
                    <Icon className={`h-6 w-6 ${section.color}`} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{section.title}</h3>
                      {section.comingSoon && (
                        <span className="badge badge-outline text-xs">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>
            );

            return section.comingSoon ? (
              <div key={section.title}>{content}</div>
            ) : (
              <Link key={section.title} href={section.href}>
                {content}
              </Link>
            );
          })}
        </div>

        {/* User Info Card */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Username</span>
              <span className="font-medium">{user?.discord_username}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Discord ID</span>
              <span className="font-mono text-sm">{user?.discord_id}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">
                Account Type
              </span>
              <span
                className={`badge ${user?.is_admin ? "badge-primary" : "badge-secondary"}`}
              >
                {user?.is_admin ? "Admin" : "User"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
