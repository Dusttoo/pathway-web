import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type UntypedClient = ReturnType<typeof createServiceClient> & {
  from: (table: string) => any;
};

async function resolveWritablePack(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 } as const;

  const service = createServiceClient() as UntypedClient;
  const { data: pack } = await service
    .from("homebrew_packs")
    .select("id, owner_id, content_types")
    .eq("id", id)
    .maybeSingle();

  if (!pack) return { error: "Not found", status: 404 } as const;
  if ((pack as { owner_id: string }).owner_id !== user.id) {
    return { error: "Forbidden", status: 403 } as const;
  }
  return { service, pack: pack as { id: string; content_types: string[] } } as const;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resolved = await resolveWritablePack(id);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  let body: { homebrew_entry_id?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.homebrew_entry_id) {
    return NextResponse.json({ error: "homebrew_entry_id is required" }, { status: 400 });
  }

  const { data: entry } = await resolved.service
    .from("homebrew_entries")
    .select("id, type, data")
    .eq("id", body.homebrew_entry_id)
    .maybeSingle();

  if (!entry) return NextResponse.json({ error: "Homebrew entry not found" }, { status: 404 });
  const entryType = (entry as { type: string }).type;
  if (!resolved.pack.content_types.includes(entryType)) {
    return NextResponse.json(
      { error: `This pack only accepts: ${resolved.pack.content_types.join(", ")}` },
      { status: 400 }
    );
  }

  const { count } = await resolved.service
    .from("homebrew_pack_entries")
    .select("id", { count: "exact", head: true })
    .eq("pack_id", id);

  const { data, error } = await resolved.service
    .from("homebrew_pack_entries")
    .insert({
      pack_id: id,
      homebrew_entry_id: body.homebrew_entry_id,
      notes: body.notes?.trim() || null,
      sort_order: count ?? 0,
    })
    .select("*, homebrew_entry:homebrew_entries(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
