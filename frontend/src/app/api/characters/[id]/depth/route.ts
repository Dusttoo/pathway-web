import { withAuth } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/responses";
import { withValidation } from "@/lib/api/validation";
import {
  applyCharacterDepthMutation,
  getOwnedCharacter,
  listCharacterDepth,
} from "@/modules/characters/depth/service";
import { characterDepthMutationSchema } from "@/modules/characters/depth/schema";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return withAuth(async ({ service, dbUser }) => {
    const { data: character, error: characterError } = await getOwnedCharacter(
      service,
      id,
      dbUser.id
    );

    if (characterError || !character) {
      return apiError("Character not found", 404);
    }

    const { levels, auditLog, overrides, versions } = await listCharacterDepth(service, id);

    if (levels.error || auditLog.error || overrides.error || versions.error) {
      return apiError("Failed to load character depth", 500);
    }

    return apiOk({
      levels: levels.data ?? [],
      auditLog: auditLog.data ?? [],
      overrides: overrides.data ?? [],
      versions: versions.data ?? [],
    });
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const validation = await withValidation(request, characterDepthMutationSchema);

  if (!validation.ok) {
    return validation.response;
  }

  return withAuth(async ({ service, dbUser }) => {
    const { data: character, error: characterError } = await getOwnedCharacter(
      service,
      id,
      dbUser.id
    );

    if (characterError || !character) {
      return apiError("Character not found", 404);
    }

    const { kind, result } = await applyCharacterDepthMutation(
      service,
      character,
      dbUser.id,
      validation.data
    );

    if (result.error) {
      return apiError(result.error.message, 500);
    }

    return apiOk({ [kind]: result.data }, { status: 201 });
  });
}
