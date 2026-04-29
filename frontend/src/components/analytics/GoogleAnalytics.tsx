"use client";

/**
 * Google Analytics Component
 *
 * Loads Google Analytics 4 scripts and tracks pageviews automatically.
 * Add this component to your root layout.
 */

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { GA_MEASUREMENT_ID, trackPageView } from "@/lib/analytics";

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track pageview on route change
  useEffect(() => {
    if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === "G-XXXXXXXXXX") {
      return; // Analytics not configured
    }

    const url =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    trackPageView(url);
  }, [pathname, searchParams]);

  // Only load GA in production environment
  const isProduction =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ||
    process.env.NEXT_PUBLIC_APP_ENV === "production";

  if (
    !GA_MEASUREMENT_ID ||
    GA_MEASUREMENT_ID === "G-XXXXXXXXXX" ||
    !isProduction
  ) {
    return null;
  }

  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}

/**
 * Cookie Consent Banner for GDPR Compliance
 *
 * Shows a banner asking users to consent to analytics cookies.
 * Required for EU users under GDPR.
 */

import { useState, useEffect as useEffectCookie } from "react";
import { X } from "lucide-react";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffectCookie(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShowBanner(false);
    // Enable analytics
    if (window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
      });
    }
  };

  const rejectCookies = () => {
    localStorage.setItem("cookie-consent", "rejected");
    setShowBanner(false);
    // Disable analytics
    if (window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
      });
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="container max-w-7xl mx-auto px-4 md:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-foreground">
              We use cookies to improve your experience and analyze site usage.{" "}
              <a
                href="/legal/cookies"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more
              </a>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={rejectCookies}
              className="btn-ghost text-sm px-4 py-2"
            >
              Reject
            </button>
            <button
              onClick={acceptCookies}
              className="btn-primary text-sm px-4 py-2"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
