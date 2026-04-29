"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { Shield, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { signInWithDiscord, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-2xl font-heading font-bold text-foreground"
          >
            <Shield className="h-8 w-8 text-primary" />
            Pathway
          </Link>
          <p className="mt-3 text-muted-foreground">
            The Pathfinder 2e companion app for your Discord server
          </p>
        </div>

        <div className="card p-8 shadow-xl">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
            Sign In
          </h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Use your Discord account to access your characters and server
            settings.
          </p>

          <button
            type="button"
            onClick={signInWithDiscord}
            className="w-full px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 127.14 96.36"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.10A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
            </svg>
            Continue with Discord
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/legal/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          {" · "}
          <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
