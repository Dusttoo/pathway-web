"use client";

/**
 * Sidebar navigation component
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Shield,
  LogOut,
  Settings,
  Swords,
  BookOpen,
  MessageSquare,
  Sword,
  ScrollText,
} from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useAuth } from "@/lib/providers/auth-provider";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Characters", href: "/characters", icon: Swords },
  { name: "Combat", href: "/combat", icon: Sword },
  { name: "Sessions", href: "/sessions", icon: ScrollText },
  { name: "Library", href: "/library", icon: BookOpen },
  { name: "Feedback", href: "/feedback", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Filter nav items based on admin status
  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.is_admin,
  );

  return (
    <aside className="w-64 bg-sidebar border-r-2 border-sidebar-border min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b-2 border-sidebar-border p-6">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="p-2 rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-medium">Pathway</h2>
            <p className="text-xs text-muted-foreground">PF2e Companion</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Navigation
          </h3>
        </div>
        <nav className="space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all relative
                  ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold border-l-4 border-primary pl-2"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-4 border-transparent"
                  }
                `}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-sidebar-border p-4 space-y-3">
        {/* Top row - Two small buttons side by side */}
        <div className="grid grid-cols-2 gap-2">
          <ThemeToggle />
          <Link
            href="/settings"
            className="btn-outline gap-2 h-9 justify-center"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>

        {/* Bottom row - Full width logout */}
        <button onClick={logout} className="btn-outline w-full gap-2 h-9">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
