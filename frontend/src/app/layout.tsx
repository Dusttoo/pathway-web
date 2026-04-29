import {
  CookieConsent,
  GoogleAnalytics,
} from "@/components/analytics/GoogleAnalytics";
import { Toaster } from "@/components/Toaster";
import { AuthProvider } from "@/lib/providers/auth-provider";
import { GuildProvider } from "@/lib/providers/guild-provider";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Pathway | Pathfinder 2e Companion",
    template: "%s | Pathway",
  },
  description:
    "Pathway is the web companion for the Pathway Pathfinder 2e Discord bot. Import characters from Pathbuilder, browse the PF2e content library, and manage your server's bot settings.",
  keywords: [
    "Pathfinder 2e",
    "PF2e",
    "Discord bot",
    "Pathbuilder",
    "character sheet",
    "tabletop RPG",
    "TTRPG",
  ],
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL("https://pathway.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Pathway",
    title: "Pathway | Pathfinder 2e Companion",
    description: "Pathway is the web companion for the Pathway Pathfinder 2e Discord bot.",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
  other: {
    "theme-color": "#6366f1",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <GuildProvider>{children}</GuildProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        <CookieConsent />
        <Toaster />
      </body>
    </html>
  );
}
