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
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function AonLink({ name, url, isOfficial, className = "" }: AonLinkProps) {
  const href = url?.trim() || (isOfficial === false ? "" : aonSearchUrl(name));

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1 text-xs text-primary hover:underline ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      Archives of Nethys <ExternalLink size={11} />
    </a>
  );
}
