import { withAuth } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/responses";
import { buildCharacterStatBreakdowns } from "@/modules/characters/calc/stat-breakdowns";
import { getOwnedCharacter, listEnabledOverrides } from "@/modules/characters/depth/service";
import type { CharacterOverride } from "@/modules/characters/calc/stat-breakdowns";

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

    const { data: overrides, error: overridesError } = await listEnabledOverrides(service, id);

    if (overridesError) {
      return apiError("Failed to load character overrides", 500);
    }

    return apiOk({
      breakdowns: buildCharacterStatBreakdowns(
        character,
        (overrides ?? []) as CharacterOverride[]
      ),
    });
  });
}
