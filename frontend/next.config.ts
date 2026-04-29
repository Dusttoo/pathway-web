import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Linting runs locally via `npm run lint`. Skip during Vercel builds.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com", // Discord user avatars
      },
    ],
  },
};

export default nextConfig;
