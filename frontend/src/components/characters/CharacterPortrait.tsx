/**
 * CharacterPortrait Component
 *
 * Displays character avatar and basic info
 * MVP version uses placeholder/initials until image upload is implemented (Phase 3.1)
 */

"use client";

import { User } from "lucide-react";
import { useEffect, useState } from "react";

interface CharacterPortraitProps {
  name: string;
  species?: string | null;
  characterClass?: string | null;
  level?: number;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  showDetails?: boolean;
}

export function CharacterPortrait({
  name,
  species,
  characterClass,
  level,
  imageUrl,
  size = "md",
  showDetails = true,
}: CharacterPortraitProps) {
  const [imageError, setImageError] = useState(false);
  useEffect(() => { setImageError(false); }, [imageUrl]);

  // Size classes
  const sizeClasses = {
    sm: "w-12 h-12 text-lg",
    md: "w-20 h-20 text-2xl",
    lg: "w-32 h-32 text-4xl",
    xl: "w-48 h-48 text-6xl",
  };

  const iconSizes = {
    sm: 20,
    md: 32,
    lg: 48,
    xl: 72,
  };

  // Generate initials from name (first letter of each word, max 2)
  const getInitials = (name: string): string => {
    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  // Render avatar
  const renderAvatar = () => {
    if (imageUrl && !imageError) {
      return (
        <img
          src={imageUrl}
          alt={`${name} portrait`}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      );
    }

    // Placeholder: show initials or icon
    const initials = getInitials(name);
    return (
      <div className="w-full h-full flex items-center justify-center bg-secondary text-primary font-heading">
        {initials.length > 0 ? (
          <span>{initials}</span>
        ) : (
          <User size={iconSizes[size]} className="text-muted-foreground" />
        )}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-4">
      {/* Avatar Circle */}
      <div
        className={`
        ${sizeClasses[size]}
        rounded-full
        border-4
        border-primary
        overflow-hidden
        flex-shrink-0
        shadow-md
        bg-background
      `}
      >
        {renderAvatar()}
      </div>

      {/* Character Details */}
      {showDetails && (
        <div className="flex flex-col justify-center min-w-0">
          <h3 className="font-heading text-xl font-bold text-foreground truncate">
            {name}
          </h3>
          {(species || characterClass || level) && (
            <p className="text-sm text-muted-foreground truncate">
              {level && `Level ${level} `}
              {species && characterClass && `${species} ${characterClass}`}
              {species && !characterClass && species}
              {!species && characterClass && characterClass}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
