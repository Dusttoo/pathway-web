import { MetadataRoute } from "next";

/**
 * Dynamic Robots.txt Generator
 *
 * Configures search engine crawler access to the site.
 * Next.js will serve this at /robots.txt
 */

const BASE_URL = "https://pathway.gg"; // Update with actual domain

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/", // Member-only area
          "/_next/",
          "/admin/", // If exists
        ],
      },
      {
        userAgent: "GPTBot", // OpenAI crawler
        disallow: ["/"], // Block AI training crawlers from using our content
      },
      {
        userAgent: "CCBot", // Common Crawl
        disallow: ["/"],
      },
      {
        userAgent: "anthropic-ai", // Anthropic crawler
        disallow: ["/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
