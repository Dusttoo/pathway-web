/**
 * Custom 404 Not Found page with D&D theme
 */

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Home, Map, Book, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Header */}
        <div className="space-y-4">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <h2 className="text-2xl text-foreground">
            You've Wandered Into Uncharted Territory
          </h2>
          <p className="text-muted-foreground text-lg">
            The page you seek has been lost to the mists of the Shadowfell.
            Perhaps it was never meant to be found... or perhaps you just took a
            wrong turn.
          </p>
        </div>

        {/* Flavor Text */}
        <div className="card p-6 bg-muted/50">
          <p className="text-muted-foreground italic">
            "You peer into the darkness, but the path ahead is unclear. The
            echoes of your footsteps fade into silence. Perhaps it's time to
            turn back and choose a different route."
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            — From the Chronicles of the Lost Wanderer
          </p>
        </div>

        {/* Navigation Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/"
            className="card p-6 hover:shadow-lg transition-all hover:scale-[1.02] group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">
                  Return to Dashboard
                </h3>
                <p className="text-sm text-muted-foreground">
                  Head back to safety
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/campaigns"
            className="card p-6 hover:shadow-lg transition-all hover:scale-[1.02] group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Map className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">
                  View Campaigns
                </h3>
                <p className="text-sm text-muted-foreground">
                  Explore your adventures
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/templates/classes"
            className="card p-6 hover:shadow-lg transition-all hover:scale-[1.02] group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">
                  Browse Classes
                </h3>
                <p className="text-sm text-muted-foreground">
                  Discover character options
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/templates/species"
            className="card p-6 hover:shadow-lg transition-all hover:scale-[1.02] group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Book className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">
                  Browse Species
                </h3>
                <p className="text-sm text-muted-foreground">
                  Find your ancestry
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Help Text */}
        <p className="text-sm text-muted-foreground">
          If you believe this page should exist, please check your URL or
          contact your Dungeon Master.
        </p>
      </div>
    </div>
  );
}
