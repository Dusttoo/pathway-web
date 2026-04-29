"use client";

import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

interface ImageUploadProps {
  label: string;
  description?: string;
  currentImageUrl?: string | null;
  onImageSelect: (file: File | null) => void;
  maxSizeMB?: number;
  recommendedSize?: string;
}

export function ImageUpload({
  label,
  description,
  currentImageUrl,
  onImageSelect,
  maxSizeMB = 5,
  recommendedSize,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(
    currentImageUrl || null,
  );
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error
    setError(null);

    // Validate file type
    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/gif",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a PNG, JPEG, WEBP, or GIF image");
      return;
    }

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Pass file to parent
    onImageSelect(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      {description && (
        <p className="text-xs text-muted-foreground mb-2">{description}</p>
      )}
      {recommendedSize && (
        <p className="text-xs text-muted-foreground mb-2">
          Recommended: {recommendedSize}
        </p>
      )}

      <div className="flex items-start gap-4">
        {/* Preview or Upload Area */}
        <div
          onClick={handleClick}
          className={`
            relative w-32 h-32 rounded-lg border-2 border-dashed
            flex items-center justify-center cursor-pointer
            transition-all hover:border-primary hover:bg-primary/5
            ${preview ? "border-solid border-primary" : "border-border"}
            ${error ? "border-destructive" : ""}
          `}
        >
          {preview ? (
            <>
              <Image
                src={preview}
                alt={label}
                fill
                className="object-cover rounded-lg"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 z-10"
                type="button"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <div className="text-center p-4">
              <Upload
                size={24}
                className="mx-auto mb-2 text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">Click to upload</p>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Instructions */}
        <div className="flex-1 text-sm text-muted-foreground">
          <p className="mb-1">Click the box to select an image</p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>Formats: PNG, JPEG, WEBP, GIF</li>
            <li>Max size: {maxSizeMB}MB</li>
            {recommendedSize && <li>Recommended: {recommendedSize}</li>}
          </ul>
        </div>
      </div>

      {/* Error message */}
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  );
}
