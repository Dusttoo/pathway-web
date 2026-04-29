/**
 * Public Layout Component
 * Wraps all public pages (landing, pricing, features, etc.)
 * No authentication required
 */

import { PublicNav } from "./PublicNav";
import { PublicFooter } from "./PublicFooter";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Skip to main content link for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <PublicNav />

      <main id="main-content" className="flex-1 w-full" tabIndex={-1}>
        {children}
      </main>

      <PublicFooter />
    </div>
  );
}
