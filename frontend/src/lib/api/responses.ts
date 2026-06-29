import { NextResponse } from "next/server";

/**
 * Consistent JSON response helpers for Route Handlers.
 *
 * Every handler previously hand-rolled `NextResponse.json({ error }, { status })`,
 * which made error shapes drift over time. Routing all responses through these
 * helpers keeps the API surface uniform and easy to change in one place.
 */

export function apiError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function unauthorized(message = "Unauthorized"): NextResponse {
  return apiError(message, 401);
}

export function forbidden(message = "Forbidden"): NextResponse {
  return apiError(message, 403);
}

export function notFound(message = "Not found"): NextResponse {
  return apiError(message, 404);
}

export function apiOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}
