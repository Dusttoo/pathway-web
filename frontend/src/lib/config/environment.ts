export function getEnvironment(): "production" | "development" | "local" {
  if (typeof window === "undefined") return "development";
  const h = window.location.hostname;
  if (h === "pathway.app") return "production";
  if (h === "localhost" || h === "127.0.0.1") return "local";
  return "development";
}
