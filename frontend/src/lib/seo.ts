export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article" | "profile";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export const DEFAULT_SEO = {
  siteName: "Pathway",
  siteUrl: "https://pathway.gg",
  defaultTitle: "Pathway | PF2e Companion App",
  defaultDescription:
    "Web companion for the Pathway Pathfinder 2e Discord bot. Manage characters, browse the rules library, and track your adventures.",
  defaultImage: "/images/og-default.png",
  locale: "en_US",
  themeColor: "#c9a227",
};

export function generateMetadata(config: SEOConfig) {
  const {
    title,
    description,
    keywords = [],
    canonical,
    image = DEFAULT_SEO.defaultImage,
    imageAlt = DEFAULT_SEO.defaultDescription,
    type = "website",
    author,
    publishedTime,
    modifiedTime,
    noindex = false,
    nofollow = false,
  } = config;

  const fullTitle =
    title === DEFAULT_SEO.defaultTitle
      ? title
      : `${title} | ${DEFAULT_SEO.siteName}`;

  const canonicalUrl = canonical
    ? `${DEFAULT_SEO.siteUrl}${canonical}`
    : undefined;

  const imageUrl = image.startsWith("http")
    ? image
    : `${DEFAULT_SEO.siteUrl}${image}`;

  return {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords.join(", ") : undefined,
    authors: author ? [{ name: author }] : undefined,
    creator: DEFAULT_SEO.siteName,
    publisher: DEFAULT_SEO.siteName,
    formatDetection: { telephone: false },
    metadataBase: new URL(DEFAULT_SEO.siteUrl),
    alternates: { canonical: canonicalUrl },
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        "max-video-preview": -1,
        "max-image-preview": "large" as const,
        "max-snippet": -1,
      },
    },
    openGraph: {
      type,
      siteName: DEFAULT_SEO.siteName,
      title: fullTitle,
      description,
      url: canonicalUrl,
      locale: DEFAULT_SEO.locale,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: imageAlt }],
      ...(type === "article" && { publishedTime, modifiedTime, authors: author ? [author] : undefined }),
    },
    twitter: {
      card: "summary_large_image" as const,
      title: fullTitle,
      description,
      images: [imageUrl],
    },
    other: { "theme-color": DEFAULT_SEO.themeColor },
  };
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: DEFAULT_SEO.siteName,
    url: DEFAULT_SEO.siteUrl,
    description: DEFAULT_SEO.defaultDescription,
  };
}

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: DEFAULT_SEO.siteName,
    url: DEFAULT_SEO.siteUrl,
    description: DEFAULT_SEO.defaultDescription,
  };
}

export function generateSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pathway Discord Bot",
    applicationCategory: "GameApplication",
    operatingSystem: "Discord",
    description: "Pathfinder 2e companion bot for Discord",
  };
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http")
        ? item.url
        : `${DEFAULT_SEO.siteUrl}${item.url}`,
    })),
  };
}

export function generateKeywords(pageKeywords: string[]): string[] {
  const baseKeywords = [
    "Pathfinder 2e",
    "PF2e",
    "character sheet",
    "rules library",
    "Discord bot",
    "tabletop RPG",
    "TTRPG",
  ];
  return [...new Set([...baseKeywords, ...pageKeywords])];
}

export function getCanonicalUrl(path: string): string {
  const cleanPath = path === "/" ? path : path.replace(/\/$/, "");
  return `${DEFAULT_SEO.siteUrl}${cleanPath}`;
}
