import { withAdmin } from "@/lib/api/auth";
import { apiOk } from "@/lib/api/responses";
import { getAdminStats } from "@/modules/admin/service";

export async function GET() {
  return withAdmin(async ({ service }) => apiOk(await getAdminStats(service)));
}
