/**
 * Documentation Category Card Component
 * Displays a category with its documents count and quick links
 */

import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import type { DocPageMetadata } from "@/lib/docs";

interface DocsCategoryCardProps {
  category: {
    name: string;
    slug: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  docs: DocPageMetadata[];
  showDocsList?: boolean;
}

export function DocsCategoryCard({
  category,
  docs,
  showDocsList = false,
}: DocsCategoryCardProps) {
  const Icon = category.icon;
  const hasContent = docs.length > 0;
  const firstDoc = docs.length > 0 ? docs[0] : null;

  return (
    <div
      className={`card p-6 transition-all ${
        hasContent ? "hover:shadow-lg" : "opacity-60"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        {hasContent ? (
          <span className="inline-flex items-center bg-chart-2/20 text-chart-2 px-2 py-1 rounded-full text-xs font-medium">
            {docs.length} {docs.length === 1 ? "doc" : "docs"}
          </span>
        ) : (
          <span className="inline-flex items-center bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs font-medium">
            Coming Soon
          </span>
        )}
      </div>

      {/* Title and Description */}
      <h3 className="font-heading font-bold text-lg mb-2">{category.name}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {category.description}
      </p>

      {/* Documents List */}
      {showDocsList && hasContent && docs.length > 0 && (
        <div className="mb-4 space-y-2">
          {docs.slice(0, 3).map((doc) => (
            <Link
              key={doc.slug}
              href={`/docs/${doc.slug}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
              <FileText className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{doc.title}</span>
            </Link>
          ))}
          {docs.length > 3 && (
            <p className="text-xs text-muted-foreground pl-5">
              +{docs.length - 3} more...
            </p>
          )}
        </div>
      )}

      {/* Action */}
      {hasContent && firstDoc && (
        <Link
          href={`/docs/${firstDoc.slug}`}
          className="text-primary text-sm font-medium inline-flex items-center gap-1 hover:gap-2 transition-all group"
        >
          Browse Documentation
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
