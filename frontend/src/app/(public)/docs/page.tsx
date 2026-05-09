/**
 * Documentation Hub
 * Central hub for all Pathway documentation
 */

import Link from "next/link";
import {
  BookOpen,
  Command,
  Code,
  HelpCircle,
  ArrowRight,
  FileText,
  Zap,
  Search,
  Sparkles,
  Map,
  Layers,
  AlertCircle,
  Shield,
  CreditCard,
} from "lucide-react";
import { DOC_CATEGORIES, getAllDocs } from "@/lib/docs";
import { DISCORD_SUPPORT_SERVER_URL } from "@/lib/external-links";

// Icon mapping for dynamic rendering
const iconMap: Record<string, any> = {
  Zap,
  Command,
  BookOpen,
  Code,
  HelpCircle,
  FileText,
  Sparkles,
  Map,
  Layers,
  AlertCircle,
  Shield,
  CreditCard,
};

export default function DocsPage() {
  const allDocs = getAllDocs();

  // Group docs by category
  const docsByCategory = DOC_CATEGORIES.map((category) => ({
    ...category,
    icon: iconMap[category.icon] || FileText,
    docs: allDocs.filter((doc) => doc.category === category.slug),
  }));

  // Separate essential docs from advanced
  const essentialCategories = docsByCategory.filter((cat) => cat.order <= 5);
  const advancedCategories = docsByCategory.filter((cat) => cat.order > 5);

  const totalDocs = allDocs.length;
  const hasContent = totalDocs > 0;

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-b from-background to-muted py-20">
        <div className="container max-w-4xl mx-auto px-4 md:px-8 text-center">
          <BookOpen className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-6">
            Documentation
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Everything you need to use Pathway
          </p>

          {/* Search Bar (Placeholder for future Algolia integration) */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search documentation..."
              className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              disabled
            />
          </div>
        </div>
      </section>

      {/* Docs Grid */}
      <section className="py-20 bg-background">
        <div className="container max-w-7xl mx-auto px-4 md:px-8">
          {/* Stats */}
          {hasContent && (
            <div className="mb-12 text-center">
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {totalDocs}
                </span>{" "}
                documentation pages across{" "}
                <span className="font-semibold text-foreground">
                  {DOC_CATEGORIES.length}
                </span>{" "}
                categories
              </p>
            </div>
          )}

          {/* Essential Documentation */}
          <div className="mb-16">
            <h2 className="text-2xl font-heading font-bold mb-6">
              Essential Documentation
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {essentialCategories.map((category) => {
                const Icon = category.icon;
                const hasContent = category.docs.length > 0;

                return (
                  <Link
                    key={category.slug}
                    href={`/docs/${category.slug}`}
                    className={`card p-6 transition-all group ${
                      hasContent
                        ? "hover:shadow-lg cursor-pointer"
                        : "hover:shadow-lg cursor-pointer opacity-70"
                    }`}
                  >
                    <div className="bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-heading font-bold text-lg group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      {hasContent ? (
                        <span className="inline-flex items-center bg-chart-2/20 text-chart-2 px-2 py-0.5 rounded-full text-xs font-medium">
                          {category.docs.length}
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {category.description}
                    </p>
                    {hasContent && (
                      <div className="text-primary text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        Explore
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Advanced Topics */}
          <div>
            <h2 className="text-2xl font-heading font-bold mb-6">
              Advanced Topics
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advancedCategories.map((category) => {
                const Icon = category.icon;
                const hasContent = category.docs.length > 0;

                return (
                  <Link
                    key={category.slug}
                    href={`/docs/${category.slug}`}
                    className={`card p-6 transition-all group ${
                      hasContent
                        ? "hover:shadow-lg cursor-pointer"
                        : "hover:shadow-lg cursor-pointer opacity-70"
                    }`}
                  >
                    <div className="bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-heading font-bold text-lg group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      {hasContent ? (
                        <span className="inline-flex items-center bg-chart-2/20 text-chart-2 px-2 py-0.5 rounded-full text-xs font-medium">
                          {category.docs.length}
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {category.description}
                    </p>
                    {hasContent && (
                      <div className="text-primary text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        Explore
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Featured Documentation */}
          {hasContent && (
            <div className="mt-16">
              <h2 className="text-2xl font-heading font-bold mb-8 text-center">
                Start Here
              </h2>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {allDocs
                  .filter(
                    (doc) =>
                      doc.slug.includes("getting-started") ||
                      doc.slug.includes("concepts") ||
                      doc.slug.includes("getting-started") ||
                      doc.slug.includes("common-issues"),
                  )
                  .slice(0, 4)
                  .map((doc) => {
                    const category = DOC_CATEGORIES.find(
                      (cat) => cat.slug === doc.category,
                    );
                    return (
                      <Link
                        key={doc.slug}
                        href={`/docs/${doc.slug}`}
                        className="card p-6 hover:shadow-lg transition-all group"
                      >
                        {category && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                              {category.name}
                            </span>
                          </div>
                        )}
                        <h3 className="font-heading font-bold mb-2 group-hover:text-primary transition-colors">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {doc.description}
                        </p>
                      </Link>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Need Help CTA */}
      <section className="py-16 bg-muted">
        <div className="container max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-2xl font-heading font-bold mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-muted-foreground mb-6">
            Our community and support team are here to help
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={DISCORD_SUPPORT_SERVER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Join Discord Community
            </a>
            <Link href="/contact" className="btn-outline">
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
