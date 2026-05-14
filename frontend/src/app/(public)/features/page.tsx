"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  ClipboardList,
  Database,
  Dice6,
  ScrollText,
  Search,
  Shield,
  Sparkles,
  Star,
  Swords,
  Users,
  Wand2,
} from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Character Sheets That Sync",
    description:
      "Import characters from Pathbuilder or the Pathway web builder, then use the same sheet in Discord and on the website.",
    bullets: [
      "Import with Pathbuilder codes, Pathbuilder JSON URLs, raw exports, or Pathway web JSON IDs",
      "Create and edit characters directly in the web app",
      "Track active characters per Discord user",
      "View compact Discord sheets, feats, abilities, portraits, attacks, inventory, and spells",
    ],
  },
  {
    icon: Swords,
    title: "Table-Ready Combat Tools",
    description:
      "Run PF2e combat from Discord with initiative, monster actions, player rolls, HP tracking, effects, and scene-break utilities.",
    bullets: [
      "Initiative commands for start, end, next, previous, view, join, add, and remove",
      "Player combat rolls through /i attack, /i save, /i skill, and /i cast",
      "Monster attacks, saves, skills, perception, initiative, and spellcasting outside or inside combat",
      "HP, healing, temporary HP, effects, multiple attack penalty, and grouped monsters",
    ],
  },
  {
    icon: BookOpen,
    title: "PF2e Lookup Library",
    description:
      "Look up the rules and content your table needs without leaving Discord or the website.",
    bullets: [
      "Spells, feats, actions, traits, rules, conditions, classes, class features, ancestries, and heritages",
      "Bestiary support for monsters, attacks, saves, skills, descriptions, and art where available",
      "Equipment and item lookup, including homebrew harvest materials and custom campaign items",
      "Deities, Eberron deities, dragonmarked houses, languages, rituals, and familiar PF2e references",
    ],
  },
  {
    icon: Search,
    title: "Fast Search and Suggestions",
    description:
      "Pathway is designed for quick lookup at the table, with autocomplete where Discord supports it and clearer duplicate handling.",
    bullets: [
      "Slash-command autocomplete for lookup-heavy commands",
      "Duplicate-aware results that prefer useful detail without hiding official variants",
      "Searchable web library pages for spells, feats, items, monsters, ancestries, backgrounds, and classes",
      "Filters for level, type, tradition, trait, rarity, and category where supported",
    ],
  },
  {
    icon: Dice6,
    title: "Dice, Skills, Saves, and Resources",
    description:
      "Use character data for the common rolls and trackers your table reaches for every session.",
    bullets: [
      "General dice rolls, aliases, reusable snippets, and custom roll expressions",
      "Character skills, Lore skills, Perception, saves, attacks, spellcasting, rest, and refocus",
      "Counters, notes, coin, inventory, conditions, and custom resources",
      "Companion and eidolon support with imported or manually managed stats",
    ],
  },
  {
    icon: ScrollText,
    title: "Downtime, Hunts, and Campaign Utilities",
    description:
      "Support the parts of PF2e that happen between fights, from earning income to campaign calendars.",
    bullets: [
      "Downtime commands such as income, crafting, forgery, research, retraining, scouting, disguise, and subsist",
      "Hunt and harvest tools with creature-trait skills, level-based DCs, and reward tables",
      "Server calendar and weather settings, including Eberron calendar support",
      "Scene breaks with /br and /break for clean Discord session pacing",
    ],
  },
  {
    icon: Wand2,
    title: "Homebrew and Campaign Databases",
    description:
      "Build the campaign-specific pieces your table needs and keep them available to both the bot and website.",
    bullets: [
      "Create homebrew monsters, spells, feats, items, ancestries, heritages, classes, and backgrounds",
      "Support for Eberron-friendly data such as deities and dragonmarked houses",
      "Custom attacks, Lore skills, class options, spellcasting details, and builder-friendly records",
      "Shared storage through Supabase so bot and web data stay together",
    ],
  },
  {
    icon: Database,
    title: "Web App Companion",
    description:
      "Use the website for the bigger workflows that are easier outside a Discord message box.",
    bullets: [
      "Character list, mini sheets, full sheet views, portraits, inventory, notes, feats, abilities, and companions",
      "Character builder with ancestries, heritages, classes, backgrounds, skills, feats, spells, and equipment",
      "Library browsing, command reference, homebrew forms, feedback, and support links",
      "Discord login keeps your web account connected to the bot identity you already use",
    ],
  },
  {
    icon: Shield,
    title: "Closed Beta Ready",
    description:
      "Pathway is being prepared for invited testers, with clearer docs, privacy pages, and server-safe data handling.",
    bullets: [
      "Invite-only closed beta messaging and support flow",
      "Updated Privacy Policy, Terms of Service, GDPR, and cookie documentation",
      "Supabase-backed persistence for character, campaign, and homebrew data",
      "Community feedback and bug reporting through the support server and web contact form",
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
            Everything Pathway brings to your table
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A Discord bot and web companion for PF2e character management, combat, rules lookup,
            downtime, homebrew, and campaign tools.
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container max-w-5xl mx-auto px-4 md:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="card p-7 flex flex-col">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-heading font-bold text-foreground mb-2">
                        {feature.title}
                      </h2>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {feature.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-sm leading-6">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/commands"
              className="btn-primary text-base px-8 py-3 inline-flex items-center justify-center gap-2"
            >
              View Commands
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="btn-outline text-base px-8 py-3 inline-flex items-center justify-center gap-2"
            >
              Open Web App
              <Sparkles className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
