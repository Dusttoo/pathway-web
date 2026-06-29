import { withAuth } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/responses";

type UntypedResult = {
  data?: unknown;
  error?: { message: string } | null;
};

type UntypedQuery = PromiseLike<UntypedResult> & {
  select: (columns?: string) => UntypedQuery;
  insert: (values: Record<string, unknown>) => UntypedQuery;
  eq: (column: string, value: unknown) => UntypedQuery;
  order: (column: string, options?: { ascending?: boolean }) => UntypedQuery;
  limit: (count: number) => UntypedQuery;
  single: () => Promise<UntypedResult>;
};

type UntypedClient = {
  from: (table: string) => UntypedQuery;
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return withAuth(async ({ dbUser, service }) => {
    const db = service as unknown as UntypedClient;
    const { data: character } = await service
      .from("characters")
      .select("id")
      .eq("id", id)
      .eq("user_id", dbUser.id)
      .maybeSingle();

    if (!character) return apiError("Character not found", 404);

    const { data, error } = await db
      .from("dice_rolls")
      .select("id, label, expression, result, total, source, visibility, created_at")
      .eq("character_id", id)
      .eq("user_id", dbUser.id)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) return apiError("Failed to load rolls", 500);
    return apiOk({ rolls: data ?? [] });
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    label?: string;
    expression?: string;
    result?: unknown;
    total?: number;
    visibility?: string;
  };

  if (!body.expression || typeof body.expression !== "string") {
    return apiError("expression is required", 400);
  }

  return withAuth(async ({ dbUser, service }) => {
    const db = service as unknown as UntypedClient;
    const { data: character } = await service
      .from("characters")
      .select("id, discord_guild_id")
      .eq("id", id)
      .eq("user_id", dbUser.id)
      .maybeSingle();

    if (!character) return apiError("Character not found", 404);

    const { data, error } = await db
      .from("dice_rolls")
      .insert({
        character_id: id,
        user_id: dbUser.id,
        source: "web",
        label: body.label ?? null,
        expression: body.expression,
        result: body.result ?? {},
        total: typeof body.total === "number" ? body.total : null,
        visibility: body.visibility ?? "private",
        discord_guild_id: character.discord_guild_id,
      })
      .select("id, label, expression, total, created_at")
      .single();

    if (error) return apiError("Failed to save roll", 500);
    return apiOk({ roll: data }, { status: 201 });
  });
}
