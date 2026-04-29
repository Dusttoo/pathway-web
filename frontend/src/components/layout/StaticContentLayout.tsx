/**
 * Static Content Layout Component
 * Used for blog posts and documentation
 * Server component without auth dependencies for static generation
 */

import Link from "next/link";
import { Shield } from "lucide-react";
import { PublicFooter } from "./PublicFooter";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface StaticContentLayoutProps {
  children: React.ReactNode;
}

export function StaticContentLayout({ children }: StaticContentLayoutProps) {
  const navItems = [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Blog", href: "/blog" },
    { label: "Docs", href: "/docs" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Skip to main content link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Simplified Static Nav */}
      <nav className="sticky top-0 z-40 w-full border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="font-heading font-bold text-xl">Pathway</span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              <ThemeToggle />

              <Link href="/login" className="btn-outline">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main id="main-content" className="flex-1 w-full" tabIndex={-1}>
        {children}
      </main>

      <PublicFooter />
    </div>
  );
}
