"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Database,
  Dice6,
  Github,
  Heart,
  MessageCircle,
  Shield,
  Sparkles,
  Swords,
  Users,
} from "lucide-react";
import { DISCORD_SUPPORT_SERVER_URL } from "@/lib/external-links";

const pillars = [
  {
    icon: Dice6,
    title: "Discord-first play",
    description:
      "Pathway keeps rolls, lookups, initiative, characters, and table reminders in the Discord channels where groups already play.",
  },
  {
    icon: BookOpen,
    title: "PF2e reference support",
    description:
      "The bot and website organize Pathfinder 2e rules data, character options, monsters, equipment, and campaign records for fast table use.",
  },
  {
    icon: Database,
    title: "Shared web storage",
    description:
      "Character sheets, homebrew, campaign tools, and web-app records are backed by Supabase so the bot and website can stay in sync.",
  },
];

const whatItDoes = [
  "Imports Pathbuilder characters and Pathway web character JSON IDs",
  "Shows compact Discord sheets, feats, abilities, attacks, inventory, spells, and companions",
  "Runs initiative, attacks, saves, skills, HP, conditions, dying, death, and combat effects",
  "Looks up PF2e spells, feats, items, bestiary entries, ancestries, heritages, classes, traits, rules, and deities",
  "Supports downtime, hunts, harvest rewards, calendars, Eberron data, and homebrew campaign content",
  "Provides a browser workspace for building, viewing, editing, and managing character sheets",
];

const betaExpectations = [
  "Report bugs or confusing behavior in the support server",
  "Test the web app with real characters and campaign workflows",
  "Expect active changes while commands, database tools, and builder features settle",
  "Do not upload secrets, private campaign documents, or sensitive personal information",
];

export default function AboutPage() {
  return (
    <div className="w-full">
      <section className="bg-gradient-to-b from-background to-muted py-20">
        <div className="container mx-auto max-w-5xl px-4 text-center md:px-8">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border-2 border-primary/20 bg-primary/10 px-4 py-2">
            <Heart className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Invite-only closed beta</span>
          </div>
          <h1 className="mb-6 font-heading text-4xl font-bold text-foreground md:text-5xl">
            About Pathway
          </h1>
          <p className="mx-auto max-w-3xl text-xl leading-8 text-muted-foreground">
            Pathway is a Pathfinder 2e Discord bot and web companion built to keep rules lookup,
            character management, combat tracking, homebrew, and campaign utilities close to the
            table.
          </p>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="container mx-auto max-w-6xl px-4 md:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.title} className="card p-7">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="mb-3 font-heading text-xl font-bold text-foreground">
                    {pillar.title}
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">{pillar.description}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="card p-8">
              <div className="mb-5 flex items-center gap-3">
                <Swords className="h-6 w-6 text-primary" />
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  What Pathway Is For
                </h2>
              </div>
              <p className="mb-6 leading-7 text-muted-foreground">
                Pathway is for PF2e groups that want less tab-hopping during a session. The Discord
                bot handles quick commands in play, while the website handles the larger workflows
                that are easier in a browser.
              </p>
              <ul className="space-y-3">
                {whatItDoes.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                    <span className="text-sm leading-6 text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-8">
              <div className="card p-8">
                <div className="mb-5 flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  <h2 className="font-heading text-2xl font-bold text-foreground">Closed Beta</h2>
                </div>
                <p className="mb-6 leading-7 text-muted-foreground">
                  Pathway is currently being prepared for invited testers. The goal is to find rough
                  edges before opening the bot and website to a wider public audience.
                </p>
                <ul className="space-y-3">
                  {betaExpectations.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                      <span className="text-sm leading-6 text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card p-8">
                <div className="mb-5 flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary" />
                  <h2 className="font-heading text-2xl font-bold text-foreground">
                    Built With Players
                  </h2>
                </div>
                <p className="leading-7 text-muted-foreground">
                  Pathway grows from live table feedback: what slows down play, what GMs need to
                  see, what players reach for repeatedly, and what should be easier than typing a
                  long command string mid-combat.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="card p-8">
              <div className="mb-5 flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  Independent Project
                </h2>
              </div>
              <p className="leading-7 text-muted-foreground">
                Pathway is an independent community project. It is not affiliated with, endorsed by,
                or sponsored by Paizo Inc. Pathfinder and Pathfinder Second Edition are Paizo
                properties. Rules references are provided to help tables play more smoothly.
              </p>
            </div>

            <div className="card p-8">
              <div className="mb-5 flex items-center gap-3">
                <Github className="h-6 w-6 text-primary" />
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  Source and Feedback
                </h2>
              </div>
              <p className="mb-6 leading-7 text-muted-foreground">
                Bug reports and feedback are welcome during beta. The web app and bot are versioned
                separately, but both are maintained as part of the Pathway project.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={DISCORD_SUPPORT_SERVER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center justify-center gap-2"
                >
                  Join Support Server
                  <MessageCircle className="h-4 w-4" />
                </a>
                <a
                  href="https://github.com/Dusttoo/pathway-web"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline inline-flex items-center justify-center gap-2"
                >
                  Web App GitHub
                  <Github className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/features"
              className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-3 text-base"
            >
              View Features
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/commands"
              className="btn-outline inline-flex items-center justify-center gap-2 px-8 py-3 text-base"
            >
              View Commands
              <BookOpen className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
