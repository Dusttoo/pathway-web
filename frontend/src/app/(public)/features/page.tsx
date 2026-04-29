"use client";

import Link from "next/link";
import {
  Swords,
  BookOpen,
  Dice6,
  Users,
  Zap,
  Shield,
  Search,
  Star,
  ArrowRight,
  Check,
} from "lucide-react";

const features = [
  {
    icon: Swords,
    title: "Pathbuilder Import",
    description: "Paste your Pathbuilder 2e character ID or JSON and your full character sheet is imported instantly — ability scores, feats, equipment, proficiencies, everything.",
    bullets: [
      "Import by Pathbuilder character ID",
      "Paste raw Pathbuilder JSON",
      "Auto-parsed ability modifiers and saves",
      "Feats, equipment, and specials displayed",
    ],
  },
  {
    icon: BookOpen,
    title: "Rules Library",
    description: "The complete PF2e content library, indexed and searchable. Browse by category or search across all content types at once.",
    bullets: [
      "Spells — all traditions, levels, and traits",
      "Feats — ancestry, class, archetype, skill, general",
      "Ancestries and heritages",
      "Backgrounds and character classes",
      "Bestiary — monsters and animal companions",
      "Items, weapons, and equipment",
    ],
  },
  {
    icon: Dice6,
    title: "Discord Bot Commands",
    description: "The Pathway bot handles the in-session experience. Roll dice, check rules, and look up character info without leaving Discord.",
    bullets: [
      "/roll — dice with modifiers",
      "/spell — spell lookup with full details",
      "/feat — feat details and prerequisites",
      "/character sheet — your current stats",
      "Secret rolls visible only to the GM",
    ],
  },
  {
    icon: Search,
    title: "Smart Search",
    description: "Find anything in the PF2e ruleset fast. Filter by level, tradition, trait, rarity, and more.",
    bullets: [
      "Full-text search across all content",
      "Filter spells by tradition or level",
      "Filter feats by type and prerequisites",
      "Filter monsters by level and type",
    ],
  },
  {
    icon: Users,
    title: "Multiple Characters",
    description: "Manage all your characters in one place. Import as many Pathbuilder characters as you need — each linked to your Discord account.",
    bullets: [
      "Unlimited characters",
      "Per-character status (active/inactive/retired)",
      "Quick-switch between characters",
    ],
  },
  {
    icon: Shield,
    title: "Discord Auth",
    description: "Sign in with the Discord account you already use for the bot. No separate password or registration needed.",
    bullets: [
      "Single click Discord login",
      "Your characters follow your Discord identity",
      "Server-linked guild settings",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="w-full">
      <section className="bg-gradient-to-b from-background to-muted py-20">
        <div className="container max-w-4xl mx-auto px-4 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border-2 border-primary/20 rounded-full px-4 py-2 mb-8">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Feature Overview</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-6">
            Everything Pathway offers
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From Discord bot commands to full character sheets and rules browsing — here&apos;s what Pathway brings to your PF2e game.
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container max-w-5xl mx-auto px-4 md:px-8">
          <div className="space-y-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className={`card p-8 flex flex-col md:flex-row gap-8 ${idx % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                  <div className="md:w-1/3 flex flex-col items-start">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-3">{feature.title}</h2>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                  <div className="md:w-2/3">
                    <ul className="space-y-3">
                      {feature.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-foreground">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link href="/login" className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2">
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
