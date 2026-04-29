/**
 * Documentation utilities for reading and parsing documentation files
 * Uses MDX files from /content/docs directory
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface DocPage {
  slug: string;
  title: string;
  description: string;
  category: string;
  order: number;
  content: string;
  lastUpdated?: string;
  tableOfContents?: TableOfContentsItem[];
}

export interface DocPageMetadata {
  slug: string;
  title: string;
  description: string;
  category: string;
  order: number;
  lastUpdated?: string;
}

export interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
}

export interface DocCategory {
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
}

const DOCS_CONTENT_DIR = path.join(process.cwd(), "content", "docs");

/**
 * Predefined documentation categories
 */
export const DOC_CATEGORIES: DocCategory[] = [
  {
    name: "Getting Started",
    slug: "getting-started",
    description: "Add Pathway to your Discord server and import your first character",
    icon: "Zap",
    order: 1,
  },
  {
    name: "Discord Bot",
    slug: "discord-bot",
    description: "Complete guide to Pathway bot commands",
    icon: "Command",
    order: 2,
  },
  {
    name: "Web App",
    slug: "web-app",
    description: "Using the Pathway web companion",
    icon: "BookOpen",
    order: 3,
  },
  {
    name: "Characters",
    slug: "characters",
    description: "Importing and managing your PF2e characters",
    icon: "Sparkles",
    order: 4,
  },
  {
    name: "Rules Library",
    slug: "rules-library",
    description: "Browsing spells, feats, ancestries, and more",
    icon: "Map",
    order: 5,
  },
  {
    name: "Troubleshooting",
    slug: "troubleshooting",
    description: "Common issues and solutions",
    icon: "AlertCircle",
    order: 6,
  },
  {
    name: "FAQ",
    slug: "faq",
    description: "Frequently asked questions",
    icon: "HelpCircle",
    order: 7,
  },
];

/**
 * Extract table of contents from markdown content
 */
function extractTableOfContents(content: string): TableOfContentsItem[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const toc: TableOfContentsItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    toc.push({ id, title, level });
  }

  return toc;
}

/**
 * Get all documentation pages
 */
export function getAllDocs(): DocPageMetadata[] {
  // Check if directory exists
  if (!fs.existsSync(DOCS_CONTENT_DIR)) {
    return [];
  }

  const files = fs.readdirSync(DOCS_CONTENT_DIR, { withFileTypes: true });
  const docs: DocPageMetadata[] = [];

  // Process files recursively
  function processDirectory(dir: string, prefix: string = "") {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    items.forEach((item) => {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        // Skip templates directory
        if (item.name === "templates") {
          return;
        }
        processDirectory(fullPath, prefix + item.name + "/");
      } else if (item.name.endsWith(".mdx") || item.name.endsWith(".md")) {
        const slug = prefix + item.name.replace(/\.mdx?$/, "");
        const fileContents = fs.readFileSync(fullPath, "utf8");
        const { data } = matter(fileContents);

        docs.push({
          slug,
          title: data.title || "Untitled",
          description: data.description || "",
          category: data.category || "Uncategorized",
          order: data.order || 999,
          lastUpdated: data.lastUpdated,
        });
      }
    });
  }

  processDirectory(DOCS_CONTENT_DIR);

  // Sort by category order, then page order
  return docs.sort((a, b) => {
    const catA = DOC_CATEGORIES.find((c) => c.slug === a.category);
    const catB = DOC_CATEGORIES.find((c) => c.slug === b.category);
    const catOrderA = catA?.order || 999;
    const catOrderB = catB?.order || 999;

    if (catOrderA !== catOrderB) {
      return catOrderA - catOrderB;
    }

    return a.order - b.order;
  });
}

/**
 * Get a single documentation page by slug
 */
export function getDocBySlug(slug: string): DocPage | null {
  // Check if directory exists
  if (!fs.existsSync(DOCS_CONTENT_DIR)) {
    return null;
  }

  const filePath = path.join(DOCS_CONTENT_DIR, `${slug}.mdx`);
  const fallbackPath = path.join(DOCS_CONTENT_DIR, `${slug}.md`);

  let fileContents: string;
  try {
    fileContents = fs.readFileSync(filePath, "utf8");
  } catch {
    try {
      fileContents = fs.readFileSync(fallbackPath, "utf8");
    } catch {
      return null;
    }
  }

  const { data, content } = matter(fileContents);
  const tableOfContents = extractTableOfContents(content);

  return {
    slug,
    title: data.title || "Untitled",
    description: data.description || "",
    category: data.category || "Uncategorized",
    order: data.order || 999,
    content,
    lastUpdated: data.lastUpdated,
    tableOfContents,
  };
}

/**
 * Get docs by category
 */
export function getDocsByCategory(category: string): DocPageMetadata[] {
  return getAllDocs().filter((doc) => doc.category === category);
}

/**
 * Get next and previous docs in sequence
 */
export function getAdjacentDocs(currentSlug: string): {
  prev: DocPageMetadata | null;
  next: DocPageMetadata | null;
} {
  const allDocs = getAllDocs();
  const currentIndex = allDocs.findIndex((doc) => doc.slug === currentSlug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex > 0 ? allDocs[currentIndex - 1] : null,
    next: currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null,
  };
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Search docs by query
 */
export function searchDocs(query: string): DocPageMetadata[] {
  const allDocs = getAllDocs();
  const lowerQuery = query.toLowerCase();

  return allDocs.filter(
    (doc) =>
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.description.toLowerCase().includes(lowerQuery),
  );
}
