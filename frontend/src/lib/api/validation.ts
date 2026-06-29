import { z } from "zod";
import { apiError } from "./responses";

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: Response };

export async function withValidation<T>(
  request: Request,
  schema: z.Schema<T>
): Promise<ValidationResult<T>> {
  const body = await request.json().catch(() => ({}));
  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      ok: false,
      response: apiError(
        "Validation failed",
        400,
        result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }))
      ),
    };
  }

  return { ok: true, data: result.data };
}
