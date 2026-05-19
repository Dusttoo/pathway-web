import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type UntypedClient = ReturnType<typeof createServiceClient> & {
  from: (table: string) => any;
};

async function canWritePack(packId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 } as const;

  const service = createServiceClient() as UntypedClient;
  const { data: pack } = await service
    .from("homebrew_packs")
    .select("owner_id")
    .eq("id", packId)
    .maybeSingle();

  if (!pack) return { error: "Not found", status: 404 } as const;
  if ((pack as { owner_id: string }).owner_id !== user.id) {
    return { error: "Forbidden", status: 403 } as const;
  }
  return { service } as const;
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const { id, entryId } = await params;
  const resolved = await canWritePack(id);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const { error } = await resolved.service
    .from("homebrew_pack_entries")
    .delete()
    .eq("pack_id", id)
    .eq("id", entryId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
