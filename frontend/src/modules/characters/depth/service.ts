import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/types/database.types";
import type { CharacterDepthMutationInput } from "./schema";

type CharacterRow = Tables<"characters">;

type QueryResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
  count?: number | null;
};

type UntypedQuery<T = unknown> = PromiseLike<QueryResult<T>> & {
  select: (columns?: string, options?: { count?: "exact"; head?: boolean }) => UntypedQuery<T>;
  insert: (values: Record<string, unknown>) => UntypedQuery<T>;
  upsert: (
    values: Record<string, unknown>,
    options?: { onConflict?: string }
  ) => UntypedQuery<T>;
  update: (values: Record<string, unknown>) => UntypedQuery<T>;
  eq: (column: string, value: unknown) => UntypedQuery<T>;
  order: (column: string, options?: { ascending?: boolean }) => UntypedQuery<T>;
  limit: (count: number) => UntypedQuery<T>;
  maybeSingle: () => Promise<QueryResult<T>>;
  single: () => Promise<QueryResult<T>>;
};

type UntypedClient = {
  from: <T = unknown>(table: string) => UntypedQuery<T>;
};

function db(service: SupabaseClient<Database>) {
  return service as unknown as UntypedClient;
}

export async function getOwnedCharacter(
  service: SupabaseClient<Database>,
  characterId: string,
  userId: string
) {
  return service
    .from("characters")
    .select("*")
    .eq("id", characterId)
    .eq("user_id", userId)
    .single();
}

export async function listCharacterDepth(service: SupabaseClient<Database>, characterId: string) {
  const untyped = db(service);
  const [levels, auditLog, overrides, versions] = await Promise.all([
    untyped.from("character_levels").select("*").eq("character_id", characterId).order("level"),
    untyped
      .from("character_audit_log")
      .select("*")
      .eq("character_id", characterId)
      .order("created_at", { ascending: false })
      .limit(50),
    untyped.from("character_overrides").select("*").eq("character_id", characterId).order("stat_key"),
    untyped
      .from("character_versions")
      .select("*")
      .eq("character_id", characterId)
      .order("version_number", { ascending: false }),
  ]);

  return { levels, auditLog, overrides, versions };
}

export async function listEnabledOverrides(
  service: SupabaseClient<Database>,
  characterId: string
) {
  return db(service)
    .from("character_overrides")
    .select("stat_key, value, reason, enabled")
    .eq("character_id", characterId)
    .eq("enabled", true);
}

export async function writeAuditEntry(
  service: SupabaseClient<Database>,
  input: {
    characterId: string;
    actorUserId: string;
    action: string;
    field?: string;
    beforeValue?: unknown;
    afterValue?: unknown;
    metadata?: Record<string, unknown>;
  }
) {
  return db(service).from("character_audit_log").insert({
    character_id: input.characterId,
    actor_user_id: input.actorUserId,
    actor_kind: "user",
    action: input.action,
    field: input.field ?? null,
    before_value: input.beforeValue ?? null,
    after_value: input.afterValue ?? null,
    metadata: input.metadata ?? {},
  });
}

async function nextVersionNumber(service: SupabaseClient<Database>, characterId: string) {
  const { data } = await db(service)
    .from<{ version_number: number }[]>("character_versions")
    .select("version_number")
    .eq("character_id", characterId)
    .order("version_number", { ascending: false })
    .limit(1);

  return ((Array.isArray(data) ? data[0]?.version_number : undefined) ?? 0) + 1;
}

export async function applyCharacterDepthMutation(
  service: SupabaseClient<Database>,
  character: CharacterRow,
  userId: string,
  input: CharacterDepthMutationInput
) {
  const untyped = db(service);

  if (input.action === "upsert_level") {
    const result = await untyped
      .from("character_levels")
      .upsert(
        {
          character_id: character.id,
          level: input.level,
          choices: input.choices,
          snapshot: input.snapshot,
          notes: input.notes ?? null,
        },
        { onConflict: "character_id,level" }
      )
      .select()
      .single();

    if (!result.error) {
      await writeAuditEntry(service, {
        characterId: character.id,
        actorUserId: userId,
        action: "upsert_level",
        field: `level.${input.level}`,
        afterValue: input,
      });
    }

    return { kind: "level", result };
  }

  if (input.action === "upsert_override") {
    const result = await untyped
      .from("character_overrides")
      .upsert(
        {
          character_id: character.id,
          stat_key: input.stat_key,
          value: input.value,
          reason: input.reason ?? null,
          enabled: input.enabled,
          created_by_user_id: userId,
        },
        { onConflict: "character_id,stat_key" }
      )
      .select()
      .single();

    if (!result.error) {
      await writeAuditEntry(service, {
        characterId: character.id,
        actorUserId: userId,
        action: "upsert_override",
        field: input.stat_key,
        afterValue: input,
      });
    }

    return { kind: "override", result };
  }

  const versionNumber = await nextVersionNumber(service, character.id);
  const result = await untyped
    .from("character_versions")
    .insert({
      character_id: character.id,
      version_number: versionNumber,
      label: input.label ?? null,
      snapshot: character,
      created_by_user_id: userId,
    })
    .select()
    .single();

  if (!result.error) {
    await writeAuditEntry(service, {
      characterId: character.id,
      actorUserId: userId,
      action: "create_version",
      field: "version",
      afterValue: { version_number: versionNumber, label: input.label ?? null },
    });
  }

  return { kind: "version", result };
}
