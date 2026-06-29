import type { z } from "zod";
import { apiError } from "./responses";

/**
 * Zod-based request-body validation for Route Handlers.
 *
 * Returns a discriminated union so handlers can do:
 *
 *   const parsed = await parseJsonBody(request, schema);
 *   if (!parsed.ok) return parsed.response;
 *   // parsed.data is fully typed here
 *
 * Invalid JSON yields a 400; schema failures yield a 422 with a readable message.
 */
export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: ReturnType<typeof apiError> };

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<ParseResult<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: apiError("Invalid JSON body", 400) };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const message =
      result.error.issues
        .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
        .join("; ") || "Validation failed";
    return { ok: false, response: apiError(message, 422) };
  }

  return { ok: true, data: result.data };
}
