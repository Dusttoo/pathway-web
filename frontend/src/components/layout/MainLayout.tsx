"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="min-h-screen bg-background text-foreground flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header />
          <main
            id="main-content"
            className="flex-1 overflow-auto"
            tabIndex={-1}
          >
            <div className="container max-w-7xl py-8 px-4 md:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
