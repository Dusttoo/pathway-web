"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Dice6,
  Library,
  ScrollText,
  Shield,
  Swords,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DISCORD_BOT_INVITE_URL, DISCORD_SUPPORT_SERVER_URL } from "@/lib/external-links";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
  image: string;
  imageAlt: string;
  width: number;
  height: number;
};

type BotScreenshot = {
  title: string;
  description: string;
  image: string;
  alt: string;
  width: number;
  height: number;
};

const features: Feature[] = [
  {
    icon: Dice6,
    title: "Advanced PF2e rolls",
    description:
      "Handle checks, secret rolls, saves, initiative, and table-ready breakdowns from the channel where your group already plays.",
    accent: "bg-[#d5a63a]",
    image: "/images/bot-screenshots/dice-roller.png",
    imageAlt: "Pathway dice roller Discord output showing a 2d20 plus 15 advantage roll.",
    width: 386,
    height: 203,
  },
  {
    icon: ScrollText,
    title: "Pathbuilder imports",
    description:
      "Bring characters into a readable web workspace, then let the bot reference the sheet when players ask for attacks, DCs, saves, and stats.",
    accent: "bg-[#4dbfb0]",
    image: "/images/bot-screenshots/character-sheet.png",
    imageAlt: "Pathway character sheet Discord output for Hylia.",
    width: 649,
    height: 778,
  },
  {
    icon: Library,
    title: "Rules at the table",
    description:
      "Look up spells, feats, ancestries, monsters, equipment, and traits without turning every rules question into a browser hunt.",
    accent: "bg-[#d96b4c]",
    image: "/images/bot-screenshots/item-lookup.png",
    imageAlt: "Pathway item lookup Discord output for Aberrant Ichor.",
    width: 750,
    height: 490,
  },
];

const botScreenshots: BotScreenshot[] = [
  {
    title: "Initiative tracking",
    description: "Paged encounter output keeps combat order readable in the channel.",
    image: "/images/bot-screenshots/initiative.png",
    alt: "Pathway initiative tracker showing round one combat order.",
    width: 497,
    height: 441,
  },
  {
    title: "Spell lookup",
    description: "Spell entries include source, traits, casting details, defense, and damage.",
    image: "/images/bot-screenshots/spell-lookup.png",
    alt: "Pathway spell lookup Discord output for Fireball.",
    width: 777,
    height: 726,
  },
  {
    title: "Bestiary lookup",
    description: "Creature blocks surface traits, skills, defenses, attacks, saves, and abilities.",
    image: "/images/bot-screenshots/bestiary-lookup.png",
    alt: "Pathway bestiary lookup Discord output for Cultist.",
    width: 773,
    height: 989,
  },
];

const botStats = [
  ["PF2e", "System"],
  ["Discord", "Native"],
  ["Sheets", "Synced"],
];

export default function LandingPage() {
  return (
    <div className="w-full bg-[#101421] text-white">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-20 bg-[url('/images/pathway-banner.png')] bg-cover bg-center" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,10,18,0.98),rgba(10,14,25,0.91)_42%,rgba(10,14,25,0.34)_100%)]" />

        <div className="container mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-16 md:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-md border border-white/18 bg-white/10 px-3 py-2 text-sm font-semibold text-white/86 backdrop-blur">
              <Shield className="h-4 w-4 text-[#d5a63a]" />
              Pathfinder 2e Discord companion
            </div>

            <div className="flex items-center gap-4">
              <Image
                src="/images/pathway-avatar.png"
                alt=""
                width={78}
                height={78}
                priority
                className="h-16 w-16 rounded-lg border border-[#d5a63a]/35 object-cover shadow-xl md:h-[78px] md:w-[78px]"
              />
              <h1 className="font-heading text-5xl font-bold leading-[1.03] text-white md:text-7xl">
                Pathway
              </h1>
            </div>
            <p className="mt-5 max-w-xl text-xl leading-8 text-white/78">
              A Discord bot and web command center for Pathfinder 2e groups that want fast rolls,
              clean character references, and searchable rules at the table.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={DISCORD_BOT_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-6 py-3 text-base"
              >
                Invite Bot
                <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href={DISCORD_SUPPORT_SERVER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline border-white/25 bg-white/[0.08] px-6 py-3 text-base text-white hover:bg-white/[0.14] hover:text-white"
              >
                Support Server
                <Users className="h-5 w-5" />
              </a>
              <Link
                href="/docs"
                className="btn-outline border-white/25 bg-white/[0.08] px-6 py-3 text-base text-white hover:bg-white/[0.14] hover:text-white"
              >
                Read commands
                <BookOpen className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 border-y border-white/12 py-5">
              {botStats.map(([value, label]) => (
                <div key={label} className="border-r border-white/12 last:border-r-0">
                  <p className="text-lg font-semibold text-white">{value}</p>
                  <p className="mt-1 text-sm text-white/55">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-w-0 self-end pb-2">
            <div className="absolute -left-6 top-8 hidden h-28 w-28 rounded-lg border border-[#4dbfb0]/30 bg-[#4dbfb0]/12 blur-sm lg:block" />
            <div className="relative overflow-hidden rounded-lg border border-white/16 bg-[#141928]/88 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/images/pathway-avatar.png"
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-lg border border-[#d5a63a]/35 object-cover"
                  />
                  <div>
                    <p className="font-semibold text-white">Pathway bot preview</p>
                    <p className="text-sm text-white/52">Live Discord output</p>
                  </div>
                </div>
                <span className="rounded-md bg-[#4dbfb0]/16 px-3 py-1 text-sm font-semibold text-[#79ded1]">
                  Online
                </span>
              </div>

              <div className="p-5">
                <Image
                  src="/images/bot-screenshots/dice-roller.png"
                  alt="Pathway dice roller Discord output showing a 2d20 plus 15 advantage roll."
                  width={386}
                  height={203}
                  priority
                  className="mx-auto w-full max-w-[386px] rounded-lg border border-white/10 object-contain shadow-2xl"
                />
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Link
                    href="/characters"
                    className="btn-outline border-white/14 bg-white/5 text-white"
                  >
                    Characters
                  </Link>
                  <Link
                    href="/library"
                    className="btn-outline border-white/14 bg-white/5 text-white"
                  >
                    Library
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f4f3ef] py-16 text-[#192448] [[data-theme='dark']_&]:bg-[#141830] [[data-theme='dark']_&]:text-[#f4f3ef]">
        <div className="container mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="overflow-hidden rounded-lg border border-[#192448]/12 bg-white shadow-sm [[data-theme='dark']_&]:border-[#c9a227]/15 [[data-theme='dark']_&]:bg-[#1c2348] [[data-theme='dark']_&]:shadow-none"
                >
                  <div className="bg-[#0a0c14] p-4">
                    <Image
                      src={feature.image}
                      alt={feature.imageAlt}
                      width={feature.width}
                      height={feature.height}
                      className="mx-auto max-h-56 w-full rounded-md object-contain"
                    />
                  </div>
                  <div className="p-6">
                    <div
                      className={`mb-5 flex h-11 w-11 items-center justify-center rounded-lg ${feature.accent}`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-[#192448] [[data-theme='dark']_&]:text-[#f4f3ef]">
                      {feature.title}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-[#3c5075] [[data-theme='dark']_&]:text-[#b8c1df]">
                      {feature.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 text-[#192448] [[data-theme='dark']_&]:bg-[#111528] [[data-theme='dark']_&]:text-[#f4f3ef]">
        <div className="container mx-auto max-w-7xl px-4 md:px-8">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold text-[#1d9db0]">Discord companion</p>
            <h2 className="font-heading text-3xl font-bold text-[#192448] md:text-5xl [[data-theme='dark']_&]:text-[#f4f3ef]">
              Designed around real channel output.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#3c5075] [[data-theme='dark']_&]:text-[#b8c1df]">
              Pathway's front page now shows the bot doing actual table work: rolling, tracking
              initiative, answering lookup commands, and rendering full character references.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/features" className="btn-primary px-5 py-3 text-base">
                Explore features
                <Swords className="h-5 w-5" />
              </Link>
              <Link href="/about" className="btn-outline px-5 py-3 text-base">
                About Pathway
                <Users className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="mt-12 grid items-start gap-6 lg:grid-cols-3">
            {botScreenshots.map((screenshot) => (
              <article
                key={screenshot.title}
                className="overflow-hidden rounded-lg border border-[#192448]/12 bg-[#0a0c14] shadow-xl [[data-theme='dark']_&]:border-[#c9a227]/15"
              >
                <Image
                  src={screenshot.image}
                  alt={screenshot.alt}
                  width={screenshot.width}
                  height={screenshot.height}
                  className="w-full object-contain"
                />
                <div className="border-t border-white/10 bg-white p-5 [[data-theme='dark']_&]:bg-[#1c2348]">
                  <h3 className="text-lg font-semibold text-[#192448] [[data-theme='dark']_&]:text-[#f4f3ef]">
                    {screenshot.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#3c5075] [[data-theme='dark']_&]:text-[#b8c1df]">
                    {screenshot.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#101421] py-16 text-white">
        <div className="container mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 md:flex-row md:items-center md:px-8">
          <div className="max-w-2xl">
            <h2 className="font-heading text-3xl font-bold text-white md:text-4xl">
              Bring the bot to your next PF2e session.
            </h2>
            <p className="mt-3 text-base leading-7 text-white/68">
              Invite Pathway, import your table, and keep the rules conversation in Discord.
            </p>
          </div>
          <a
            href={DISCORD_BOT_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary shrink-0 px-6 py-3 text-base"
          >
            Invite Bot
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>
    </div>
  );
}
