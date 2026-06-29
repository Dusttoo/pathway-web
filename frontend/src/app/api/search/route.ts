import { createServiceClient } from "@/lib/supabase/server";
import { apiError, apiOk } from "@/lib/api/responses";
import { searchRulesLibrary } from "@/modules/search/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Number(searchParams.get("limit") ?? 24);

  try {
    const result = await searchRulesLibrary(createServiceClient(), { q, limit });
    return apiOk(result);
  } catch (error) {
    console.error("[search] failed", error);
    return apiError("Search failed", 500);
  }
}
