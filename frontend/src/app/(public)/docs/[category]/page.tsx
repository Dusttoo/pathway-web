/**
 * Documentation Category Page
 * Shows all docs in a specific category
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, ChevronRight, FileText } from "lucide-react";
import { DOC_CATEGORIES, getDocsByCategory } from "@/lib/docs";

export async function generateStaticParams() {
  return DOC_CATEGORIES.map((category) => ({
    category: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const category = DOC_CATEGORIES.find((cat) => cat.slug === categorySlug);

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  return {
    title: `${category.name} | Pathway Documentation`,
    description: category.description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const category = DOC_CATEGORIES.find((cat) => cat.slug === categorySlug);

  if (!category) {
    notFound();
  }

  const docs = getDocsByCategory(categorySlug);

  return (
    <div className="w-full">
      <div className="container max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-2 text-sm text-muted-foreground mb-8"
          aria-label="Breadcrumb"
        >
          <Link href="/docs" className="hover:text-primary transition-colors">
            Documentation
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{category.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-12">
          <div className="bg-primary/20 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
            {category.name}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            {category.description}
          </p>
        </div>

        {/* Documentation List */}
        {docs.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {docs.map((doc) => (
              <Link
                key={doc.slug}
                href={`/docs/${doc.slug}`}
                className="card p-6 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {doc.description}
                    </p>
                    {doc.lastUpdated && (
                      <p className="text-xs text-muted-foreground">
                        Updated:{" "}
                        {new Date(doc.lastUpdated).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Coming Soon Message */
          <div className="card p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-heading font-bold mb-4">
              Documentation Coming Soon
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              We're working on comprehensive documentation for{" "}
              {category.name.toLowerCase()}. Check back soon or explore other
              documentation categories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/docs" className="btn-primary">
                Browse All Documentation
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/contact" className="btn-outline">
                Request Documentation
              </Link>
            </div>
          </div>
        )}

        {/* Back to Docs */}
        <div className="mt-12 pt-8 border-t border-border">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to All Documentation
          </Link>
        </div>
      </div>
    </div>
  );
}
