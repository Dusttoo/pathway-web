"use client";

import { useAuth } from "@/lib/providers/auth-provider";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-card border-b-2 border-border">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1" />
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {user.discord_username}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <button onClick={logout} className="btn-outline text-xs px-3 py-1">
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
