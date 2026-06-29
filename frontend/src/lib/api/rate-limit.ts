import { apiError } from "./responses";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
};

const buckets = new Map<string, number[]>();

export function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
}

export function withRateLimit(request: Request, options: RateLimitOptions): Response | null {
  const now = Date.now();
  const key = `${options.keyPrefix ?? "route"}:${getClientIp(request)}`;
  const attempts = buckets.get(key) ?? [];
  const recentAttempts = attempts.filter((timestamp) => now - timestamp < options.windowMs);

  if (recentAttempts.length >= options.limit) {
    return apiError("Rate limit exceeded. Please try again later.", 429);
  }

  recentAttempts.push(now);
  buckets.set(key, recentAttempts);

  return null;
}
