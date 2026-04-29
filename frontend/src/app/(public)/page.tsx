"use client";

import Link from "next/link";
import {
  Shield,
  Swords,
  BookOpen,
  Dice6,
  ArrowRight,
  Zap,
  Users,
  Star,
} from "lucide-react";
import { DiscordChatDemo } from "@/components/demo/DiscordChatDemo";

export default function LandingPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#141830] via-[#1c2348] to-[#253668]" />
        <div
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 50%, #c9a22740 0%, transparent 60%), radial-gradient(circle at 70% 30%, #4dbfb030 0%, transparent 50%)",
          }}
        />

        <div className="container max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-primary/40 rounded-full px-4 py-2 mb-8">
              <Dice6 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Pathfinder 2e Companion
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6">
              Your PF2e party,{" "}
              <span className="text-primary">organized</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/70 mb-10 max-w-3xl mx-auto">
              Web companion for the Pathway Discord bot. Import characters from
              Pathbuilder, browse the full rules library, and track your
              adventures — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="btn-primary text-base px-8 py-3">
                Sign In with Discord
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/features"
                className="btn-outline border-white/30 text-white hover:bg-white/10 text-base px-8 py-3"
              >
                See Features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Demo */}
      <section className="py-20 bg-background">
        <div className="container max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Pathway bot in action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Roll dice, look up rules, and manage characters directly from
              Discord during your session.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <DiscordChatDemo />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-muted-foreground">
              Built for PF2e players who want their game organized and
              accessible.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Swords,
                title: "Character Management",
                description:
                  "Import directly from Pathbuilder 2e. View your full character sheet, ability scores, feats, and equipment in a clean web interface.",
              },
              {
                icon: BookOpen,
                title: "Full Rules Library",
                description:
                  "Browse thousands of spells, feats, ancestries, backgrounds, classes, monsters, and items — all searchable and filterable.",
              },
              {
                icon: Dice6,
                title: "Discord Integration",
                description:
                  "The Pathway bot handles dice rolls, skill checks, spell lookups, and rule references right in your game session channel.",
              },
              {
                icon: Users,
                title: "Party Coordination",
                description:
                  "Each player manages their own character. DMs can access the full bestiary and encounter tools from the same platform.",
              },
              {
                icon: Zap,
                title: "Fast Lookups",
                description:
                  "No more pausing mid-session to flip through books. Pathway has all the PF2e core rules indexed and ready to query.",
              },
              {
                icon: Star,
                title: "Free to Use",
                description:
                  "Pathway is free for all players. Connect your Discord account and start managing your characters in minutes.",
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="card p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-[#141830] to-[#1c2348]">
        <div className="container max-w-7xl mx-auto px-4 md:px-8 text-center">
          <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
            Ready to adventure?
          </h2>
          <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            Sign in with Discord to import your characters and get the full
            Pathway experience.
          </p>
          <Link
            href="/login"
            className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
