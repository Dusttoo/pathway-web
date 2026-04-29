// Force all settings pages to be dynamic (not statically generated)
// This prevents SSR/SSG issues with browser APIs like window and location
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
