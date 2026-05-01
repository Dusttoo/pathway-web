"use client";

/**
 * HomebrewImageUpload
 *
 * Wraps the existing ImageUpload component (which handles file selection,
 * validation, and local preview) with the actual Supabase Storage upload step.
 *
 * Flow:
 *   1. User picks a file → ImageUpload validates and calls onImageSelect(file)
 *   2. This component uploads the file to /api/homebrew/images
 *   3. On success, calls onChange(url) with the permanent public URL
 *   4. Shows an overlay spinner during upload; surfaces errors below the picker
 *
 * In edit mode, pass `value` (existing URL) so ImageUpload initialises its
 * preview from it. Next.js <Image> requires *.supabase.co to be whitelisted
 * in next.config.ts remotePatterns — see that file for the entry.
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

interface HomebrewImageUploadProps {
  /** Existing URL — used in edit forms to pre-populate the preview. */
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  description?: string;
  recommendedSize?: string;
}

export function HomebrewImageUpload({
  value,
  onChange,
  label = "Image",
  description,
  recommendedSize = "512×512 px or larger",
}: HomebrewImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleImageSelect(file: File | null) {
    setUploadError(null);

    if (!file) {
      // User clicked the remove (X) button
      onChange(null);
      return;
    }

    setIsUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/homebrew/images", {
        method: "POST",
        body,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }

      const { url } = (await res.json()) as { url: string };
      onChange(url);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed — please try again."
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="relative">
      <ImageUpload
        label={label}
        description={description}
        currentImageUrl={value ?? undefined}
        onImageSelect={handleImageSelect}
        recommendedSize={recommendedSize}
      />

      {/* Spinner overlay during upload */}
      {isUploading && (
        <div className="absolute inset-0 flex items-start pt-8 justify-center bg-background/70 rounded-lg backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 text-sm text-primary font-medium">
            <Loader2 size={16} className="animate-spin" />
            Uploading…
          </div>
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-destructive mt-1">{uploadError}</p>
      )}
    </div>
  );
}
