"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/lib/providers/auth-provider";
import { DISCORD_BOT_INVITE_URL, DISCORD_SUPPORT_SERVER_URL } from "@/lib/external-links";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function PublicNav() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Commands", href: "/commands" },
    { label: "Features", href: "/features" },
    { label: "About", href: "/about" },
    { label: "Other Tools", href: "/other-tools" },
    { label: "Support Server", href: DISCORD_SUPPORT_SERVER_URL, external: true },
    { label: "Feedback", href: "/feedback" },
  ];

  return (
    <nav className="bg-card border-b-2 border-border sticky top-0 z-50">
      <div className="container max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/images/pathway-avatar.png"
              alt=""
              width={34}
              height={34}
              className="h-8 w-8 rounded-md object-cover"
            />
            <span className="text-xl font-heading font-bold text-foreground">Pathway</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) =>
              "external" in item && item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary transition-colors font-medium"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-foreground hover:text-primary transition-colors font-medium"
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <a
              href={DISCORD_BOT_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              Invite Bot
            </a>
            {user ? (
              <Link href="/dashboard" className="btn-primary">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="btn-primary">
                Sign In with Discord
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn-outline p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-border">
            {navItems.map((item) =>
              "external" in item && item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-2 text-foreground hover:text-primary transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block py-2 text-foreground hover:text-primary transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              )
            )}
            <div className="pt-3 border-t border-border">
              <a
                href={DISCORD_BOT_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline mb-3 block w-full text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Invite Bot
              </a>
              {user ? (
                <Link
                  href="/dashboard"
                  className="btn-primary w-full text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="btn-primary w-full text-center block"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In with Discord
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
