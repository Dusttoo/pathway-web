import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const BUCKET = "homebrew-images";
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 5 * 1024 * 1024;

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const discordId =
    authUser.identities?.find((i) => i.provider === "discord")?.identity_data
      ?.provider_id ?? authUser.id;

  const service = createServiceClient();
  const { data } = await service
    .from("users")
    .select("id")
    .eq("discord_id", discordId)
    .single();

  if (!data?.id) return null;

  return { authUserId: authUser.id, appUserId: data.id, service };
}

async function userOwnsCharacter(appUserId: string, characterId: string) {
  const service = createServiceClient();
  const { data } = await service
    .from("characters")
    .select("id")
    .eq("id", characterId)
    .eq("user_id", appUserId)
    .maybeSingle();

  return !!data;
}

function characterFolder(authUserId: string) {
  return `${authUserId}/characters`;
}

function publicUrl(path: string, version?: string | number | null) {
  const service = createServiceClient();
  const url = service.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return version ? `${url}?v=${encodeURIComponent(String(version))}` : url;
}

export async function GET() {
  const context = await getAuthContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: characters, error: characterError } = await context.service
    .from("characters")
    .select("id")
    .eq("user_id", context.appUserId);

  if (characterError) {
    return NextResponse.json({ error: characterError.message }, { status: 500 });
  }

  const ownedIds = new Set((characters ?? []).map((c) => c.id));
  const folder = characterFolder(context.authUserId);
  const { data: files, error: listError } = await context.service.storage
    .from(BUCKET)
    .list(folder, { limit: 1000 });

  if (listError) {
    return NextResponse.json({ images: {} });
  }

  const images: Record<string, string> = {};
  for (const file of files ?? []) {
    const characterId = file.name.replace(/\.[^.]+$/, "");
    if (!ownedIds.has(characterId)) continue;
    const version = "updated_at" in file ? file.updated_at : null;
    images[characterId] = publicUrl(`${folder}/${file.name}`, version);
  }

  return NextResponse.json({ images });
}

export async function POST(request: Request) {
  const context = await getAuthContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 },
    );
  }

  const characterId = formData.get("character_id");
  const file = formData.get("file");
  if (typeof characterId !== "string" || !characterId) {
    return NextResponse.json({ error: "character_id is required" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, GIF, and WebP images are accepted" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image must be under 5 MB" },
      { status: 400 },
    );
  }

  if (!(await userOwnsCharacter(context.appUserId, characterId))) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const folder = characterFolder(context.authUserId);
  const { data: existing } = await context.service.storage
    .from(BUCKET)
    .list(folder, { limit: 1000, search: characterId });

  const oldPaths = (existing ?? [])
    .filter((entry) => entry.name.replace(/\.[^.]+$/, "") === characterId)
    .map((entry) => `${folder}/${entry.name}`);

  if (oldPaths.length > 0) {
    await context.service.storage.from(BUCKET).remove(oldPaths);
  }

  const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
  const path = `${folder}/${characterId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { data: uploaded, error: uploadError } = await context.service.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  return NextResponse.json({ url: publicUrl(uploaded.path, Date.now()) });
}

export async function DELETE(request: Request) {
  const context = await getAuthContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get("character_id");
  if (!characterId) {
    return NextResponse.json({ error: "character_id is required" }, { status: 400 });
  }

  if (!(await userOwnsCharacter(context.appUserId, characterId))) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const folder = characterFolder(context.authUserId);
  const { data: existing } = await context.service.storage
    .from(BUCKET)
    .list(folder, { limit: 1000, search: characterId });

  const paths = (existing ?? [])
    .filter((entry) => entry.name.replace(/\.[^.]+$/, "") === characterId)
    .map((entry) => `${folder}/${entry.name}`);

  if (paths.length > 0) {
    const { error } = await context.service.storage.from(BUCKET).remove(paths);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
