"use client";

import Link from "next/link";
import { Shield, Heart, Dice6, BookOpen, ArrowRight, Github } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="w-full">
      <section className="bg-gradient-to-b from-background to-muted py-20">
        <div className="container max-w-4xl mx-auto px-4 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border-2 border-primary/20 rounded-full px-4 py-2 mb-8">
            <Heart className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Built for the community</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-6">
            About Pathway
          </h1>
          <p className="text-xl text-muted-foreground">
            A web companion for PF2e players who use the Pathway Discord bot.
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container max-w-4xl mx-auto px-4 md:px-8">
          <div className="prose max-w-none">
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="card p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Dice6 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">The Bot</h3>
                <p className="text-muted-foreground text-sm">
                  The Pathway Discord bot lives in your server and handles dice rolls, rules lookups, and character management right where you play — in the session channel.
                </p>
              </div>
              <div className="card p-6">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">The Web App</h3>
                <p className="text-muted-foreground text-sm">
                  This web companion gives you a full character sheet viewer, a searchable rules library, and account management — all linked to your Discord identity.
                </p>
              </div>
            </div>

            <div className="card p-8 mb-8">
              <h2 className="text-2xl font-heading font-bold text-foreground mb-4">Why Pathway?</h2>
              <p className="text-muted-foreground mb-4">
                Pathfinder 2e is a deep, well-designed system — but flipping through the rulebook mid-session breaks immersion and slows the game. Pathway brings the entire PF2e rules set to your Discord channel so you can keep rolling and stay in the story.
              </p>
              <p className="text-muted-foreground mb-4">
                The web companion extends that to a full browser experience: import your Pathbuilder character once, and your sheet is always up to date and accessible from anywhere.
              </p>
              <p className="text-muted-foreground">
                Pathway is an independent, community-built project. It is not affiliated with Paizo or the official Pathfinder brand.
              </p>
            </div>

            <div className="card p-8">
              <h2 className="text-2xl font-heading font-bold text-foreground mb-4">Open Source</h2>
              <p className="text-muted-foreground mb-6">
                Pathway is developed in the open. Contributions, bug reports, and feature requests are welcome on GitHub.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="btn-outline inline-flex items-center gap-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                </a>
                <Link href="/login" className="btn-primary inline-flex items-center gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
