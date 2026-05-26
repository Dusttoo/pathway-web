import {
  ExternalLink,
  FileText,
  Hammer,
  Library,
  ShoppingBag,
  Sparkles,
  Wrench,
} from "lucide-react";
import {
  ARCHIVES_OF_NETHYS_URL,
  PAIZO_BLANK_CHARACTER_SHEET_URL,
  PAIZO_STORE_URL,
  PF2_TOOLS_URL,
  PATHBUILDER_URL,
  WANDERERS_GUIDE_URL,
} from "@/lib/external-links";

const tools = [
  {
    title: "Pathbuilder",
    description:
      "Build, plan, and export Pathfinder 2e characters that can be imported into Pathway.",
    href: PATHBUILDER_URL,
    action: "Open Pathbuilder",
    icon: Hammer,
  },
  {
    title: "Paizo Store",
    description: "Buy Pathfinder books, PDFs, accessories, and subscriptions directly from Paizo.",
    href: PAIZO_STORE_URL,
    action: "Visit Paizo Store",
    icon: ShoppingBag,
  },
  {
    title: "Blank Character Sheet",
    description:
      "Download Paizo's remaster Player Core character sheet PDF for paper play or offline prep.",
    href: PAIZO_BLANK_CHARACTER_SHEET_URL,
    action: "Download Sheet",
    icon: FileText,
  },
  {
    title: "Archives of Nethys",
    description:
      "Browse the official Pathfinder 2e rules reference, including actions, spells, feats, items, and creatures.",
    href: ARCHIVES_OF_NETHYS_URL,
    action: "Open Archives",
    icon: Library,
  },
  {
    title: "PF2.tools",
    description:
      "Find community-built Pathfinder 2e utilities, references, generators, and table aids in one place.",
    href: PF2_TOOLS_URL,
    action: "Open PF2.tools",
    icon: Wrench,
  },
  {
    title: "Wanderer's Guide",
    description:
      "Create and manage Pathfinder 2e characters with a guided builder and digital sheet tools.",
    href: WANDERERS_GUIDE_URL,
    action: "Open Wanderer's Guide",
    icon: Hammer,
  },
];

export default function OtherToolsPage() {
  return (
    <div className="w-full bg-background">
      <section className="border-b-2 border-border bg-muted py-14">
        <div className="container mx-auto max-w-5xl px-4 md:px-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-primary/20 bg-primary/10 px-4 py-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Community resources</span>
          </div>
          <h1 className="font-heading text-4xl font-bold text-foreground md:text-5xl">
            Other Tools
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
            Quick links to useful Pathfinder 2e resources outside Pathway, including character
            building, official Paizo products, and a printable blank sheet.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto max-w-5xl px-4 md:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {tools.map((tool) => {
              const Icon = tool.icon;

              return (
                <a
                  key={tool.title}
                  href={tool.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card group flex min-h-64 flex-col p-6 transition-colors hover:border-primary"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="font-heading text-xl font-bold text-foreground">{tool.title}</h2>
                  <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                    {tool.description}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    {tool.action}
                    <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
