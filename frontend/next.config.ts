import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com", // Discord user avatars
      },
      {
        protocol: "https",
        hostname: "*.supabase.co", // Supabase Storage (homebrew images)
      },
    ],
  },
};

export default nextConfig;
