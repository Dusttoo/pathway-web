/**
 * Google Analytics 4 Integration
 *
 * Client-side analytics tracking for public website.
 * Tracks pageviews, events, and conversions.
 */

// GA4 Measurement ID - Set via environment variable
// Only loads in production if NEXT_PUBLIC_GA_ID is set
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "";

/**
 * Initialize Google Analytics
 * Call this in root layout or _app
 */
export function initGA() {
  if (typeof window === "undefined") return;
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === "G-XXXXXXXXXX") {
    console.warn("Google Analytics ID not configured");
    return;
  }

  // Load gtag.js
  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
    send_page_view: true,
  });
}

/**
 * Track pageview
 * Automatically called on route changes in Next.js
 */
export function trackPageView(url: string) {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;

  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
}

/**
 * Get current guild_id from localStorage for analytics
 * Security fix: FRONTEND-P2-7 - Include guild context in analytics
 */
function getCurrentGuildId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("discord_guild_id");
  } catch {
    return null;
  }
}

/**
 * Track custom events
 * Usage: trackEvent("button_click", { button_name: "Sign Up" })
 *
 * Security fix: FRONTEND-P2-7 - Automatically include guild_id in all events
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, any>,
) {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;

  // Security fix: FRONTEND-P2-7 - Add guild_id to event parameters for multi-tenant analytics
  const guildId = getCurrentGuildId();
  const enrichedParams = {
    ...eventParams,
    ...(guildId ? { guild_id: guildId } : {}),
  };

  window.gtag("event", eventName, enrichedParams);
}

/**
 * Track conversions
 * Usage: trackConversion("sign_up", { value: 0, currency: "USD" })
 */
export function trackConversion(
  conversionName: string,
  conversionParams?: Record<string, any>,
) {
  trackEvent(conversionName, conversionParams);
}

// Common event tracking helpers

export function trackSignUp(method: "discord" | "email") {
  trackConversion("sign_up", {
    method,
  });
}

export function trackLogin(method: "discord" | "email") {
  trackEvent("login", {
    method,
  });
}

export function trackPurchase(params: {
  transaction_id: string;
  value: number;
  currency: string;
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>;
}) {
  trackConversion("purchase", params);
}

export function trackBeginCheckout(params: {
  value: number;
  currency: string;
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
  }>;
}) {
  trackEvent("begin_checkout", params);
}

export function trackAddToCart(params: {
  value: number;
  currency: string;
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
  }>;
}) {
  trackEvent("add_to_cart", params);
}

export function trackViewItem(params: {
  item_id: string;
  item_name: string;
  price: number;
  currency: string;
}) {
  trackEvent("view_item", {
    currency: params.currency,
    value: params.price,
    items: [
      {
        item_id: params.item_id,
        item_name: params.item_name,
        price: params.price,
      },
    ],
  });
}

export function trackSearch(searchTerm: string) {
  trackEvent("search", {
    search_term: searchTerm,
  });
}

export function trackShare(params: {
  method: string;
  content_type: string;
  item_id: string;
}) {
  trackEvent("share", params);
}

export function trackSelectContent(params: {
  content_type: string;
  item_id: string;
}) {
  trackEvent("select_content", params);
}

export function trackOutboundLink(url: string) {
  trackEvent("click", {
    event_category: "outbound",
    event_label: url,
    transport_type: "beacon",
  });
}

export function trackDownload(fileName: string) {
  trackEvent("file_download", {
    file_name: fileName,
  });
}

export function trackVideoPlay(videoTitle: string) {
  trackEvent("video_start", {
    video_title: videoTitle,
  });
}

export function trackFormSubmit(formName: string) {
  trackEvent("generate_lead", {
    form_name: formName,
  });
}

export function trackNewsletterSignup() {
  trackConversion("newsletter_signup", {
    method: "website",
  });
}

// Type definitions for window.gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
