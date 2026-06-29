import { withAuth } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/responses";
import { withValidation } from "@/lib/api/validation";
import { getCurrentUser, updateCurrentUser } from "@/modules/users/service";
import { updateCurrentUserSchema } from "@/modules/users/schema";

export async function GET() {
  return withAuth(async ({ dbUser }) => apiOk(await getCurrentUser(dbUser)));
}

export async function PATCH(request: Request) {
  const validation = await withValidation(request, updateCurrentUserSchema);

  if (!validation.ok) {
    return validation.response;
  }

  return withAuth(async ({ service, discordId }) => {
    const { data, error } = await updateCurrentUser(service, discordId, validation.data);

    if (error) {
      return apiError(error.message, 400);
    }

    return apiOk(data);
  });
}
