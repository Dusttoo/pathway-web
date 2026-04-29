/**
 * Toast notification component using Sonner
 *
 * This component should be added to the root layout to enable
 * toast notifications throughout the app.
 */

"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      expand={false}
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
        },
        className: "font-sans",
      }}
    />
  );
}
