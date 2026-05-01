import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// ── POST /api/homebrew/images ─────────────────────────────────────────────────
// Accepts multipart/form-data with a single `file` field.
// Uploads to the `homebrew-images` Supabase Storage bucket under the
// authenticated user's UID prefix and returns the public URL.
//
// File path format: {userId}/{timestamp}.{ext}
// This lets the storage DELETE policy scope removal to file owners.

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, GIF, and WebP images are accepted" },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image must be under 5 MB" },
      { status: 400 }
    );
  }

  const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
  const path = `${user.id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const service = createServiceClient();

  const { data: uploaded, error: uploadError } = await service.storage
    .from("homebrew-images")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = service.storage.from("homebrew-images").getPublicUrl(uploaded.path);

  return NextResponse.json({ url: publicUrl });
}
