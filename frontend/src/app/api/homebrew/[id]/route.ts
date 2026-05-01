import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// ── DELETE /api/homebrew/[id] ─────────────────────────────────────────────────
// Only the entry creator or an admin may delete.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();

  // Fetch the entry to verify ownership
  const { data: entry, error: fetchError } = await service
    .from("homebrew_entries")
    .select("id, added_by")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check if requester is the creator or an admin
  const { data: dbUser } = await service
    .from("users")
    .select("is_admin")
    .eq("id", authUser.id)
    .maybeSingle();

  if (entry.added_by !== authUser.id && !dbUser?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await service
    .from("homebrew_entries")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
