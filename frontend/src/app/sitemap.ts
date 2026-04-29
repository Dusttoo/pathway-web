import { MetadataRoute } from "next";
import { getAllDocs } from "@/lib/docs";

const BASE_URL = "https://pathway.gg";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${BASE_URL}/features`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
  ];

  const legalPages = [
    { url: `${BASE_URL}/legal/privacy`, lastModified: new Date("2025-01-01"), changeFrequency: "yearly" as const, priority: 0.5 },
    { url: `${BASE_URL}/legal/terms`, lastModified: new Date("2025-01-01"), changeFrequency: "yearly" as const, priority: 0.5 },
  ];

  let docPages: MetadataRoute.Sitemap = [];
  try {
    const docs = getAllDocs();
    docPages = docs.map((doc) => ({
      url: `${BASE_URL}/docs/${doc.slug}`,
      lastModified: doc.lastUpdated ? new Date(doc.lastUpdated) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  } catch {
    // no docs yet
  }

  return [...staticPages, ...legalPages, ...docPages];
}
