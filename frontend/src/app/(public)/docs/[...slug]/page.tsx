import { MDXComponents } from "@/components/docs/MDXComponents";
import {
  DOC_CATEGORIES,
  formatDate,
  getAdjacentDocs,
  getAllDocs,
  getDocBySlug,
} from "@/lib/docs";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronRight,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export async function generateStaticParams() {
  const docs = getAllDocs();
  return docs.map((doc) => ({
    slug: doc.slug.split("/"),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug: slugArray } = await params;
  const slug = slugArray.join("/");
  const doc = getDocBySlug(slug);

  if (!doc) {
    return {
      title: "Documentation Not Found",
    };
  }

  return {
    title: `${doc.title} | Pathway Documentation`,
    description: doc.description,
  };
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug: slugArray } = await params;
  const slug = slugArray.join("/");
  const doc = getDocBySlug(slug);

  if (!doc) {
    notFound();
  }

  const { prev, next } = getAdjacentDocs(slug);
  const category = DOC_CATEGORIES.find((cat) => cat.slug === doc.category);

  return (
    <div className="w-full">
      <div className="container max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid lg:grid-cols-[1fr_250px] gap-12">
          {/* Main Content */}
          <article className="min-w-0">
            {/* Breadcrumb */}
            <nav
              className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
              aria-label="Breadcrumb"
            >
              <Link
                href="/docs"
                className="hover:text-primary transition-colors"
              >
                Documentation
              </Link>
              <ChevronRight className="h-4 w-4" />
              {category && (
                <>
                  <Link
                    href={`/docs/${category.slug}`}
                    className="hover:text-primary transition-colors"
                  >
                    {category.name}
                  </Link>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
              <span className="text-foreground font-medium">{doc.title}</span>
            </nav>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                {doc.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-4">
                {doc.description}
              </p>
              {doc.lastUpdated && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Last updated: {formatDate(doc.lastUpdated)}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={MDXComponents}
              >
                {doc.content}
              </ReactMarkdown>
            </div>

            {/* Navigation */}
            <div className="grid md:grid-cols-2 gap-4 mt-12 pt-8 border-t border-border">
              {prev ? (
                <Link
                  href={`/docs/${prev.slug}`}
                  className="card p-6 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </div>
                  <h3 className="font-heading font-bold group-hover:text-primary transition-colors">
                    {prev.title}
                  </h3>
                </Link>
              ) : (
                <div />
              )}

              {next && (
                <Link
                  href={`/docs/${next.slug}`}
                  className="card p-6 hover:shadow-lg transition-all group text-right"
                >
                  <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground mb-2">
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <h3 className="font-heading font-bold group-hover:text-primary transition-colors">
                    {next.title}
                  </h3>
                </Link>
              )}
            </div>

            {/* Feedback */}
            <div className="mt-12 card p-8 bg-muted">
              <h3 className="font-heading font-bold text-xl mb-3">
                Was this helpful?
              </h3>
              <p className="text-muted-foreground mb-4">
                Help us improve our documentation. Let us know if something is
                unclear or missing.
              </p>
              <div className="flex gap-4">
                <Link href="/contact" className="btn-outline">
                  Report an Issue
                </Link>
                <Link
                  href="#"
                  className="btn-outline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Edit on GitHub
                </Link>
              </div>
            </div>
          </article>

          {/* Table of Contents Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              {doc.tableOfContents && doc.tableOfContents.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    On This Page
                  </h3>
                  <nav>
                    <ul className="space-y-2 text-sm">
                      {doc.tableOfContents
                        .filter((item) => item.level <= 3)
                        .map((item) => (
                          <li
                            key={item.id}
                            style={{
                              paddingLeft: `${(item.level - 1) * 0.75}rem`,
                            }}
                          >
                            <a
                              href={`#${item.id}`}
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              {item.title}
                            </a>
                          </li>
                        ))}
                    </ul>
                  </nav>
                </div>
              )}

              {/* Quick Links */}
              <div className="card p-6 mt-6">
                <h3 className="font-heading font-bold mb-4">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href="/docs"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      All Documentation
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/docs/getting-started"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Getting Started
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/docs/features"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/docs/troubleshooting"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Troubleshooting
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Contact Support
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
