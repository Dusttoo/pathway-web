import { NextResponse } from "next/server";

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function apiError(error: string, status = 500, details?: unknown) {
  return NextResponse.json(
    {
      error,
      ...(details === undefined ? {} : { details }),
    },
    { status }
  );
}
