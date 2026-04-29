/**
 * Health check endpoint for container health monitoring
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "pathway-frontend",
    },
    { status: 200 },
  );
}
