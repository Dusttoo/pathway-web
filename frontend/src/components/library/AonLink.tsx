"use client";

import { ExternalLink } from "lucide-react";

type AonLinkProps = {
  name: string;
  url?: string | null;
  isOfficial?: boolean | null;
  className?: string;
};

export function aonSearchUrl(name: string): string {
  return `https://2e.aonprd.com/Search.aspx?query=${encodeURIComponent(name)}`;
}

export function valueFromMetadata(metadata: unknown, key: string): string | null {
  if (typeof metadata === "string" && metadata.trim().startsWith("{")) {
    try {
      return valueFromMetadata(JSON.parse(metadata), key);
    } catch {
      return null;
    }
  }
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>)[key];
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return null;
}

export function aonUrlFromMetadata(metadata: unknown): string | null {
  return (
    valueFromMetadata(metadata, "aon_url") ??
    valueFromMetadata(metadata, "aonUrl") ??
    valueFromMetadata(metadata, "url") ??
    null
  );
}

export function AonLink({ name, url, isOfficial, className = "" }: AonLinkProps) {
  const href = url?.trim() || (isOfficial === false ? "" : aonSearchUrl(name));
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      Archives of Nethys <ExternalLink size={11} />
    </a>
  );
}
