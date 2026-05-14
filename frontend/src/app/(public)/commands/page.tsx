import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Dice6, Search, Shield, Sparkles, Swords } from "lucide-react";

type BotCommand = {
  name: string;
  description: string;
  syntax: string;
  options?: string[];
  subcommands?: string[];
  examples?: string[];
  ownerOnly?: boolean;
};

type CommandGroup = {
  id: string;
  title: string;
  summary: string;
  commands: BotCommand[];
};

const commandGroups: CommandGroup[] = [
  {
    id: "start",
    title: "Start Here",
    summary: "Quick utility commands for checking the bot, getting help, and posting scene breaks.",
    commands: [
      {
        name: "help",
        description: "Get help on a command or topic.",
        syntax: "/help [topic]",
        options: ["topic - command or topic to explain"],
        examples: ["/help char", "/help initiative"],
      },
      {
        name: "ping",
        description: "Check if Pathway is online.",
        syntax: "/ping",
      },
      {
        name: "br",
        description: "Post a visual scene-break divider.",
        syntax: "/br [title]",
        options: ["title - optional scene title"],
        examples: ["/br Into the Vault"],
      },
      {
        name: "break",
        description: "Long-form alias for /br.",
        syntax: "/break [title]",
        options: ["title - optional scene title"],
      },
    ],
  },
  {
    id: "characters",
    title: "Characters",
    summary:
      "Import Pathbuilder or Pathway web sheets, set active characters, edit sheet data, and view character output.",
    commands: [
      {
        name: "char",
        description:
          "Import, create, edit, and manage saved character sheets. /char import and /char update accept Pathbuilder codes, Pathbuilder JSON URLs, and Pathway web JSON IDs.",
        syntax: "/char <subcommand>",
        subcommands: [
          "add",
          "update",
          "import",
          "create",
          "list",
          "active",
          "remove",
          "art",
          "edit",
          "identity",
          "misc",
          "ability",
          "stat",
          "skill",
          "lore",
          "weapon",
          "attack",
          "item",
          "spellcasting",
          "feat",
          "hp",
          "template",
        ],
        examples: [
          "/char add file:sheet.json",
          "/char import id:1a501305-de50-4391-a0cf-44f4c5869d3d",
          "/char update id:e33b3c85-03d5-44f0-9cc1-40a139a0a7db",
          "/char active character:Hylia",
          "/char attack name:Rapier attack:+7 damage:1d6+1 damage_type:piercing",
          "/char lore name:Underworld bonus:+6",
        ],
      },
      {
        name: "sheet",
        description: "Display a full character sheet.",
        syntax: "/sheet [name]",
        options: ["name - character name; defaults to your active character"],
        examples: ["/sheet", "/sheet name:Hylia"],
      },
      {
        name: "feats",
        description: "Display a character's feats in a compact block.",
        syntax: "/feats [character]",
      },
      {
        name: "abilities",
        description:
          "Display a character's special abilities and features without cluttering the main sheet.",
        syntax: "/abilities [character]",
        examples: ["/abilities", "/abilities character:Isolde"],
      },
      {
        name: "portrait",
        description: "Show the current portrait art for a character.",
        syntax: "/portrait [character]",
      },
      {
        name: "companion",
        description:
          "Manage animal companions, eidolons, custom stats, abilities, and companion rolls.",
        syntax: "/companion <subcommand>",
        subcommands: [
          "info",
          "list",
          "add",
          "import",
          "mine",
          "sheet",
          "active",
          "remove",
          "use",
          "set",
          "reset",
          "resetall",
          "attack",
          "ability",
          "skill",
          "notes",
          "hp",
          "form",
          "art",
          "roll",
        ],
        examples: [
          "/companion add name:Shadow base:wolf",
          "/companion import file:abyss.pdf",
          "/companion hp name:Shadow amount:+12",
          "/companion sheet name:Shadow",
        ],
      },
    ],
  },
  {
    id: "dice",
    title: "Dice And Checks",
    summary: "Roll dice, character skills, Perception, saves, and reusable roll expressions.",
    commands: [
      {
        name: "roll",
        description: "Roll dice with snippet expansion and basic math.",
        syntax: "/roll dice:<expression> [character]",
        options: [
          "dice - expression such as 1d20+8",
          "character - whose snippets or portrait to use",
        ],
        examples: ["/roll dice:2d20+15 adv", "/roll dice:1d20+@hylia.athletics"],
      },
      {
        name: "r",
        description: "Quick alias for /roll.",
        syntax: "/r dice:<expression> [character]",
      },
      {
        name: "skill",
        description: "Roll a skill check from a character sheet.",
        syntax: "/skill skill:<name> [bonus] [character]",
        options: [
          "skill - skill name",
          "bonus - extra bonus or penalty",
          "character - defaults to active",
        ],
      },
      {
        name: "perception",
        description: "Roll a Perception check.",
        syntax: "/perception [bonus] [character]",
      },
      {
        name: "save",
        description: "Roll Fortitude, Reflex, or Will from your sheet.",
        syntax: "/save type:<fortitude|reflex|will> [bonus] [character]",
      },
      {
        name: "snippet",
        description: "Manage personal dice and text snippets used in /roll expressions.",
        syntax: "/snippet <subcommand>",
        subcommands: ["create", "list", "view", "delete"],
      },
      {
        name: "serversnippet",
        description: "Manage server-wide snippets for a table.",
        syntax: "/serversnippet <subcommand>",
        subcommands: ["create", "list", "view", "delete"],
      },
      {
        name: "cvar",
        description: "Manage per-character variables for roll expressions.",
        syntax: "/cvar <subcommand>",
        subcommands: ["set", "list", "show", "delete"],
      },
    ],
  },
  {
    id: "combat",
    title: "Combat",
    summary:
      "Run initiative, join combat, resolve attacks, saves, effects, HP, and monster actions.",
    commands: [
      {
        name: "init",
        description: "Initiative and combat tracker for the active channel.",
        syntax: "/init <subcommand>",
        subcommands: [
          "start",
          "end",
          "next",
          "prev",
          "view",
          "list",
          "add",
          "addnpc",
          "addmonster",
          "remove",
          "modify",
          "attack",
          "hp",
          "thp",
          "effect",
          "removeeffect",
          "effects",
          "conditions",
          "move",
          "reaction",
          "dying",
          "recovery",
          "damage",
          "delay",
          "rejoin",
        ],
        examples: ["/init start", "/init addmonster name:Kobold Warrior count:4", "/init next"],
      },
      {
        name: "i",
        description: "Player-facing combat actions.",
        syntax: "/i <subcommand>",
        subcommands: [
          "join",
          "attack",
          "save",
          "skill",
          "cast",
          "reaction",
          "hp",
          "thp",
          "effect",
          "remove",
          "attacks",
        ],
        examples: ["/i join", "/i attack target:Kobold Warrior 1", "/i cast spell:Fireball"],
      },
      {
        name: "mattack",
        description:
          "GM command for rolling a monster attack in or out of initiative, including multiple attack penalty support.",
        syntax:
          "/mattack attacker:<name> name:<attack> target:<target> [bonus] [damage] [type] [map] [agile]",
        examples: ["/mattack attacker:Goblin Warrior name:dogslicer target:Hylia"],
      },
      {
        name: "m",
        description:
          "GM quick monster actions for saves, skills, spellcasting, abilities, and attack lists in or out of initiative.",
        syntax: "/m <subcommand>",
        subcommands: ["save", "skill", "cast", "ability", "attacks"],
        examples: [
          "/m skill monster:Goblin Warrior skill:stealth",
          "/m save monster:Goblin Warrior save:fortitude",
        ],
      },
    ],
  },
  {
    id: "spells",
    title: "Spells And Resources",
    summary:
      "Look up spells, manage preparation, cast spells, rest, refocus, and track daily resources.",
    commands: [
      {
        name: "spell",
        description: "Look up a spell from the database.",
        syntax: "/spell name:<spell>",
        examples: ["/spell name:Fireball"],
      },
      {
        name: "cast",
        description: "Cast a spell, roll attacks or saves, apply damage, and track slot use.",
        syntax: "/cast spell:<name> [character] [level] [target] [targets]",
      },
      {
        name: "spells",
        description: "Manage learned and prepared spells for a character.",
        syntax: "/spells <subcommand>",
        subcommands: ["learn", "forget", "prepare", "unprepare", "swap"],
      },
      {
        name: "spellbook",
        description: "View a character's full spell list.",
        syntax: "/spellbook [name]",
      },
      {
        name: "prepared",
        description: "View today's prepared spell list for a prepared caster.",
        syntax: "/prepared [name]",
      },
      {
        name: "resource",
        description: "View or manually set spell slots, focus points, and hero points.",
        syntax: "/resource <show|set>",
        subcommands: ["show", "set"],
      },
      {
        name: "rest",
        description: "Take a full rest, refill spell slots and focus, and reset hero points to 1.",
        syntax: "/rest [character]",
      },
      {
        name: "refocus",
        description: "Spend 10 minutes refocusing to restore 1 focus point.",
        syntax: "/refocus [character]",
      },
      {
        name: "hp",
        description: "Out-of-combat HP tracking.",
        syntax: "/hp <subcommand>",
        subcommands: ["view", "set", "add", "reset", "max"],
      },
      {
        name: "hero",
        description: "Track, award, spend, reset, and reroll with Hero Points.",
        syntax: "/hero <subcommand>",
        subcommands: ["view", "add", "spend", "set", "reset", "reroll"],
      },
      {
        name: "xp",
        description: "Track experience points and XP logs.",
        syntax: "/xp <subcommand>",
        subcommands: ["view", "award", "set", "reset"],
      },
    ],
  },
  {
    id: "inventory",
    title: "Inventory And Notes",
    summary: "Track party inventory, coin, custom counters, and character session notes.",
    commands: [
      {
        name: "bag",
        description: "Manage your shared inventory bag.",
        syntax: "/bag <subcommand>",
        subcommands: ["view", "rename", "add", "remove", "removecategory"],
      },
      {
        name: "gold",
        description: "Track platinum, gold, silver, and copper for a character.",
        syntax: "/gold <subcommand>",
        subcommands: ["view", "add", "spend", "convert", "set"],
      },
      {
        name: "cc",
        description:
          "Track arbitrary character resources such as panache, reagents, or focus charges.",
        syntax: "/cc <subcommand>",
        subcommands: ["add", "set", "use", "restore", "reset", "list", "remove"],
      },
      {
        name: "counters",
        description: "Show all custom counters on a character.",
        syntax: "/counters [character]",
      },
      {
        name: "notes",
        description:
          "Per-character session notebook for NPCs, locations, plot threads, and reminders.",
        syntax: "/notes <subcommand>",
        subcommands: ["add", "list", "view", "search", "edit", "remove", "pin"],
      },
    ],
  },
  {
    id: "downtime",
    title: "Downtime",
    summary:
      "Spend downtime days for crafting, earning income, infiltration prep, research, and retraining.",
    commands: [
      {
        name: "downtime",
        description: "Track and spend downtime days. Auto-accrues 1 day per real-world day.",
        syntax: "/downtime <subcommand>",
        subcommands: ["check", "spend", "grant", "log", "reset"],
      },
      {
        name: "craft",
        description: "Craft an item with Crafting.",
        syntax: "/craft item:<name> item_level:<level> [dc] [bonus] [days] [character]",
      },
      {
        name: "forgery",
        description: "Create a forged document with Society.",
        syntax: "/forgery document:<type> [bonus] [days] [character]",
      },
      {
        name: "income",
        description: "Earn Income with a trained skill.",
        syntax: "/income skill:<skill> task_level:<level> [days] [bonus] [character]",
      },
      {
        name: "learnname",
        description: "Learn a creature private or true name.",
        syntax: "/learnname skill:<skill> [dc|level|difficulty] [bonus] [days] [character]",
      },
      {
        name: "longrest",
        description: "Spend a full day and night resting.",
        syntax: "/longrest [days] [character]",
      },
      {
        name: "subsist",
        description: "Provide food and shelter.",
        syntax: "/subsist skill:<skill> [dc|level|difficulty] [bonus] [days] [character]",
      },
      {
        name: "treatdisease",
        description: "Treat a diseased creature with Medicine.",
        syntax: "/treatdisease target:<name> dc:<dc> [bonus] [days] [character]",
      },
      {
        name: "bribe",
        description: "Infiltration downtime: bribe a contact for Edge Points.",
        syntax: "/bribe skill:<skill> [dc|level|difficulty] [bonus] [days] [character]",
      },
      {
        name: "forgedocuments",
        description: "Infiltration downtime: prepare forged paperwork props.",
        syntax: "/forgedocuments skill:<skill> [dc|level|difficulty] [bonus] [days] [character]",
      },
      {
        name: "gaincontact",
        description: "Infiltration downtime: gain a useful contact.",
        syntax: "/gaincontact skill:<skill> [dc|level|difficulty] [bonus] [days] [character]",
      },
      {
        name: "gossip",
        description: "Infiltration downtime: gather rumors about the target.",
        syntax: "/gossip skill:<skill> [dc|level|difficulty] [bonus] [days] [character]",
      },
      {
        name: "scout",
        description: "Infiltration downtime: observe a location or group.",
        syntax: "/scout skill:<skill> [dc|level|difficulty] [bonus] [days] [character]",
      },
      {
        name: "disguise",
        description: "Infiltration downtime: secure disguises.",
        syntax: "/disguise skill:<skill> [dc|level|difficulty] [bonus] [days] [character]",
      },
      {
        name: "cram",
        description: "Academia downtime: study twice at a tiring cost.",
        syntax: "/cram branch:<branch> [days] [character]",
      },
      {
        name: "research",
        description: "Academia downtime: practical research in the field.",
        syntax: "/research skill:<skill> [dc|level|difficulty] [bonus] [days] [character]",
      },
      {
        name: "study",
        description: "Academia downtime: study a primary or secondary branch.",
        syntax: "/study skill:<skill> [dc|level|difficulty] [bonus] [days] [character]",
      },
      {
        name: "retrain",
        description: "Retrain a feat, skill increase, or class feature.",
        syntax: "/retrain change:<description> [days] [character]",
      },
    ],
  },
  {
    id: "lookup",
    title: "Rules Lookup",
    summary: "Search Pathfinder 2e data from Discord with autocomplete-backed lookup commands.",
    commands: [
      {
        name: "action",
        description: "Look up a PF2e action or activity.",
        syntax: "/action name:<entry>",
      },
      {
        name: "affliction",
        description: "Look up a PF2e curse or disease.",
        syntax: "/affliction name:<entry>",
      },
      {
        name: "ancestry",
        description: "Look up an ancestry.",
        syntax: "/ancestry name:<ancestry>",
      },
      {
        name: "archetype",
        description: "Look up an archetype.",
        syntax: "/archetype name:<archetype>",
      },
      {
        name: "background",
        description: "Look up a background.",
        syntax: "/background name:<background>",
      },
      { name: "class", description: "Look up a class.", syntax: "/class name:<class>" },
      {
        name: "classfeature",
        description: "Look up class features and class options.",
        syntax: "/classfeature name:<feature>",
      },
      {
        name: "condition",
        description: "Look up a PF2e condition.",
        syntax: "/condition name:<condition>",
      },
      {
        name: "creatureextra",
        description: "Look up creature abilities and adjustments.",
        syntax: "/creatureextra name:<entry>",
      },
      { name: "deity", description: "Look up a deity.", syntax: "/deity name:<deity>" },
      { name: "domain", description: "Look up a deity domain.", syntax: "/domain name:<domain>" },
      {
        name: "familiar",
        description: "Look up familiar abilities and specific familiars.",
        syntax: "/familiar name:<entry>",
      },
      {
        name: "feat",
        description: "Look up a feat, optionally filtered by level.",
        syntax: "/feat name:<feat> [level]",
      },
      { name: "hazard", description: "Look up a PF2e hazard.", syntax: "/hazard name:<hazard>" },
      { name: "heritage", description: "Look up a heritage.", syntax: "/heritage name:<heritage>" },
      {
        name: "item",
        description: "Look up an item, optionally filtered by level.",
        syntax: "/item name:<item> [level]",
      },
      {
        name: "kingdom",
        description: "Look up kingdom structures and events.",
        syntax: "/kingdom name:<entry>",
      },
      {
        name: "language",
        description: "Look up a PF2e language.",
        syntax: "/language name:<language>",
      },
      {
        name: "monster",
        description: "Look up a creature from the bestiary.",
        syntax: "/monster name:<creature>",
      },
      { name: "plane", description: "Look up a PF2e plane.", syntax: "/plane name:<plane>" },
      {
        name: "relic",
        description: "Look up a PF2e relic or relic gift.",
        syntax: "/relic name:<entry>",
      },
      { name: "ritual", description: "Look up a PF2e ritual.", syntax: "/ritual name:<ritual>" },
      { name: "rule", description: "Look up a rule entry.", syntax: "/rule name:<rule>" },
      {
        name: "siege",
        description: "Look up a PF2e siege weapon.",
        syntax: "/siege name:<weapon>",
      },
      {
        name: "skillinfo",
        description: "Look up full details on a skill, including actions and DCs.",
        syntax: "/skillinfo skill:<skill>",
      },
      {
        name: "sourcebook",
        description: "Look up PF2e source books and products.",
        syntax: "/sourcebook name:<source>",
      },
      { name: "trait", description: "Look up a PF2e trait.", syntax: "/trait name:<trait>" },
      {
        name: "vehicle",
        description: "Look up a PF2e vehicle.",
        syntax: "/vehicle name:<vehicle>",
      },
      {
        name: "hunt",
        description: "Find a balanced bestiary creature for a hunt.",
        syntax: "/hunt start trait:<trait> level:<party level> players:<count> bonus:<modifier>",
        subcommands: ["start"],
      },
      {
        name: "harvest",
        description: "Harvest useful materials from a defeated creature.",
        syntax: "/harvest creature:<name> bonus:<modifier> [skill]",
      },
    ],
  },
  {
    id: "homebrew",
    title: "Homebrew And Admin Tools",
    summary: "Add custom spells, items, and monsters, or patch bestiary entries for a server.",
    commands: [
      {
        name: "monsteradd",
        description: "Add or remove a homebrew creature in the global bestiary.",
        syntax: "/monsteradd <subcommand>",
        subcommands: ["paste", "file", "remove"],
        ownerOnly: true,
      },
      {
        name: "monsterart",
        description: "Set or remove a custom monster portrait on this server.",
        syntax: "/monsterart <subcommand>",
        subcommands: ["set", "remove"],
      },
      {
        name: "monsteredit",
        description: "Add abilities, items, languages, or skill overrides to a bestiary creature.",
        syntax: "/monsteredit <subcommand>",
        subcommands: ["ability", "item", "language", "skill"],
      },
      {
        name: "spelladd",
        description: "Add or remove a homebrew spell in the global database.",
        syntax: "/spelladd <subcommand>",
        subcommands: ["paste", "file", "remove"],
        ownerOnly: true,
      },
      {
        name: "itemadd",
        description: "Add or remove a homebrew item in the global database.",
        syntax: "/itemadd <subcommand>",
        subcommands: ["paste", "file", "remove"],
        ownerOnly: true,
      },
    ],
  },
  {
    id: "world",
    title: "Calendar, Weather, And World",
    summary: "Run in-game calendars, weather, and Eberron reference lookups.",
    commands: [
      {
        name: "calendar",
        description: "In-game calendar for Golarion or Eberron, configured per server.",
        syntax: "/calendar <subcommand>",
        subcommands: [
          "today",
          "set",
          "advance",
          "month",
          "holidays",
          "next-holiday",
          "moon",
          "clear",
          "setting",
          "autotick",
        ],
        examples: [
          "/calendar today",
          "/calendar setting setting:Eberron",
          "/calendar autotick enabled:true",
        ],
      },
      {
        name: "weather",
        description: "In-game weather for Golarion or Eberron, configured per server.",
        syntax: "/weather <subcommand>",
        subcommands: [
          "current",
          "climate",
          "set",
          "roll",
          "advance",
          "forecast",
          "apply",
          "clear",
          "setting",
        ],
        examples: ["/weather current", "/weather roll climate:temperate", "/weather apply"],
      },
      {
        name: "eberron",
        description: "Eberron campaign reference lookups.",
        syntax: "/eberron <subcommand>",
        subcommands: ["house", "deity"],
        examples: ["/eberron house name:Cannith", "/eberron deity name:Silver Flame"],
      },
    ],
  },
];

const commandCount = commandGroups.reduce((total, group) => total + group.commands.length, 0);
const subcommandCount = commandGroups.reduce(
  (total, group) =>
    total +
    group.commands.reduce(
      (commandTotal, command) => commandTotal + (command.subcommands?.length ?? 0),
      0
    ),
  0
);

function CommandCard({ command }: { command: BotCommand }) {
  return (
    <article
      id={command.name}
      className="scroll-mt-28 rounded-lg border border-[#192448]/12 bg-white p-5 shadow-sm [[data-theme='dark']_&]:border-[#c9a227]/15 [[data-theme='dark']_&]:bg-[#1c2348] [[data-theme='dark']_&]:shadow-none"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-mono text-xl font-semibold text-[#192448] [[data-theme='dark']_&]:text-[#f4f3ef]">
              /{command.name}
            </h3>
            {command.ownerOnly && (
              <span className="rounded-md bg-[#d96b4c]/12 px-2 py-1 text-xs font-semibold text-[#9f432b]">
                Bot owner
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-6 text-[#3c5075] [[data-theme='dark']_&]:text-[#b8c1df]">
            {command.description}
          </p>
        </div>
        <code className="rounded-md border border-[#192448]/10 bg-[#f4f3ef] px-3 py-2 font-mono text-xs text-[#192448] [[data-theme='dark']_&]:border-[#c9a227]/15 [[data-theme='dark']_&]:bg-[#111528] [[data-theme='dark']_&]:text-[#f4f3ef]">
          {command.syntax}
        </code>
      </div>

      {command.options && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d9db0]">
            Options
          </p>
          <ul className="mt-2 grid gap-2 text-sm text-[#3c5075] md:grid-cols-2 [[data-theme='dark']_&]:text-[#b8c1df]">
            {command.options.map((option) => (
              <li
                key={option}
                className="rounded-md bg-[#f4f3ef] px-3 py-2 [[data-theme='dark']_&]:bg-[#111528]"
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
      )}

      {command.subcommands && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d9db0]">
            Subcommands
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {command.subcommands.map((subcommand) => (
              <span
                key={subcommand}
                className="rounded-md border border-[#192448]/10 bg-[#f4f3ef] px-2.5 py-1 font-mono text-xs text-[#192448] [[data-theme='dark']_&]:border-[#c9a227]/15 [[data-theme='dark']_&]:bg-[#111528] [[data-theme='dark']_&]:text-[#f4f3ef]"
              >
                {subcommand}
              </span>
            ))}
          </div>
        </div>
      )}

      {command.examples && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d9db0]">
            Examples
          </p>
          <div className="mt-2 grid gap-2">
            {command.examples.map((example) => (
              <code
                key={example}
                className="rounded-md bg-[#111528] px-3 py-2 font-mono text-sm text-white"
              >
                {example}
              </code>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export default function CommandsPage() {
  return (
    <div className="bg-[#f4f3ef] text-[#192448] [[data-theme='dark']_&]:bg-[#141830] [[data-theme='dark']_&]:text-[#f4f3ef]">
      <section className="relative isolate overflow-hidden bg-[#101421] text-white">
        <div className="absolute inset-0 -z-20 bg-[url('/images/pathway-banner.png')] bg-cover bg-center opacity-70" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,10,18,0.98),rgba(10,14,25,0.9)_52%,rgba(10,14,25,0.48))]" />
        <div className="container mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-md border border-white/18 bg-white/10 px-3 py-2 text-sm font-semibold text-white/86 backdrop-blur">
              <BookOpen className="h-4 w-4 text-[#d5a63a]" />
              Pathway command reference
            </div>
            <h1 className="font-heading text-4xl font-bold leading-tight text-white md:text-6xl">
              Commands
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/76">
              A practical reference for Pathway slash commands, organized by table workflow and
              built from the bot command definitions.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#characters" className="btn-primary px-5 py-3 text-base">
                Browse commands
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/"
                className="btn-outline border-white/25 bg-white/[0.08] px-5 py-3 text-base text-white hover:bg-white/[0.14] hover:text-white"
              >
                Back home
              </Link>
            </div>
          </div>

          <div className="grid gap-4 self-end sm:grid-cols-3">
            {[
              [commandCount.toString(), "Commands", Dice6],
              [subcommandCount.toString(), "Subcommands", Swords],
              [commandGroups.length.toString(), "Categories", Shield],
            ].map(([value, label, Icon]) => {
              const StatIcon = Icon as typeof Dice6;
              return (
                <div
                  key={label as string}
                  className="rounded-lg border border-white/14 bg-[#101421]/70 p-5"
                >
                  <StatIcon className="mb-4 h-5 w-5 text-[#d5a63a]" />
                  <p className="text-3xl font-semibold text-white">{value as string}</p>
                  <p className="mt-1 text-sm text-white/56">{label as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-[#192448]/10 bg-white [[data-theme='dark']_&]:border-[#c9a227]/15 [[data-theme='dark']_&]:bg-[#1c2348]">
        <div className="container mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/images/pathway-avatar.png"
              alt=""
              width={42}
              height={42}
              className="h-10 w-10 rounded-md object-cover"
            />
            <div>
              <p className="font-semibold text-[#192448] [[data-theme='dark']_&]:text-[#f4f3ef]">
                Slash commands use Discord autocomplete.
              </p>
              <p className="text-sm text-[#3c5075] [[data-theme='dark']_&]:text-[#b8c1df]">
                Required options are shown with angle brackets or named fields.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-[#192448]/12 bg-[#f4f3ef] px-3 py-2 text-sm text-[#3c5075] [[data-theme='dark']_&]:border-[#c9a227]/15 [[data-theme='dark']_&]:bg-[#111528] [[data-theme='dark']_&]:text-[#b8c1df]">
            <Search className="h-4 w-4 text-[#1d9db0]" />
            Use browser find to jump to a command.
          </div>
        </div>
      </section>

      <div className="container mx-auto grid max-w-7xl gap-8 px-4 py-14 md:px-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 rounded-lg border border-[#192448]/12 bg-white p-4 shadow-sm [[data-theme='dark']_&]:border-[#c9a227]/15 [[data-theme='dark']_&]:bg-[#1c2348] [[data-theme='dark']_&]:shadow-none">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#1d9db0]">
              Categories
            </p>
            <div className="space-y-1">
              {commandGroups.map((group) => (
                <a
                  key={group.id}
                  href={`#${group.id}`}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-[#3c5075] hover:bg-[#f4f3ef] hover:text-[#192448] [[data-theme='dark']_&]:text-[#b8c1df] [[data-theme='dark']_&]:hover:bg-[#111528] [[data-theme='dark']_&]:hover:text-[#f4f3ef]"
                >
                  {group.title}
                </a>
              ))}
            </div>
          </nav>
        </aside>

        <main className="space-y-12">
          {commandGroups.map((group) => (
            <section key={group.id} id={group.id} className="scroll-mt-24">
              <div className="mb-5 flex flex-col gap-2 border-b border-[#192448]/12 pb-5 [[data-theme='dark']_&]:border-[#c9a227]/15">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#d5a63a]" />
                  <h2 className="font-heading text-3xl font-bold text-[#192448] [[data-theme='dark']_&]:text-[#f4f3ef]">
                    {group.title}
                  </h2>
                </div>
                <p className="max-w-3xl text-sm leading-6 text-[#3c5075] [[data-theme='dark']_&]:text-[#b8c1df]">
                  {group.summary}
                </p>
              </div>
              <div className="grid gap-4">
                {group.commands.map((command) => (
                  <CommandCard key={command.name} command={command} />
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
