/**
 * Cookie Policy Page
 * Explains cookie usage for Pathway
 */

import Link from "next/link";
import { Cookie, Mail } from "lucide-react";

export default function CookiePolicyPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-b from-background to-muted py-12">
        <div className="container max-w-4xl mx-auto px-4 md:px-8">
          <Cookie className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-heading font-bold text-center mb-4">
            Cookie Policy
          </h1>
          <p className="text-center text-muted-foreground">
            Last Updated: January 1, 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-background">
        <div className="container max-w-4xl mx-auto px-4 md:px-8">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="card p-8 mb-6">
              <p className="text-lg text-muted-foreground">
                This Cookie Policy explains how Pathway uses cookies and
                similar tracking technologies. By using our website and service,
                you consent to the use of cookies as described in this policy.
              </p>
            </div>

            <div className="space-y-8">
              {/* What Are Cookies */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  1. What Are Cookies?
                </h2>
                <p className="text-muted-foreground mb-4">
                  Cookies are small text files stored on your device (computer,
                  tablet, or mobile) when you visit a website. They help
                  websites remember your preferences, keep you logged in, and
                  improve your browsing experience.
                </p>
                <p className="text-muted-foreground">
                  We use both <strong>first-party cookies</strong> (set by us)
                  and <strong>third-party cookies</strong> (set by external
                  services like Google Analytics) to provide and improve our
                  service.
                </p>
              </section>

              {/* Types of Cookies */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  2. Types of Cookies We Use
                </h2>

                <div className="space-y-6">
                  {/* Essential Cookies */}
                  <div className="border-l-4 border-chart-1 pl-4">
                    <h3 className="text-xl font-heading font-semibold mb-2">
                      2.1 Essential Cookies (Required)
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      These cookies are necessary for the website to function
                      and cannot be disabled.
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 font-semibold">
                              Cookie Name
                            </th>
                            <th className="text-left py-2 font-semibold">
                              Purpose
                            </th>
                            <th className="text-left py-2 font-semibold">
                              Duration
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                          <tr className="border-b border-border">
                            <td className="py-2 font-mono text-xs">
                              auth_token
                            </td>
                            <td className="py-2">
                              Maintains your login session
                            </td>
                            <td className="py-2">7 days</td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="py-2 font-mono text-xs">
                              csrf_token
                            </td>
                            <td className="py-2">
                              Security protection against cross-site attacks
                            </td>
                            <td className="py-2">Session</td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="py-2 font-mono text-xs">
                              discord_oauth
                            </td>
                            <td className="py-2">
                              Discord authentication state
                            </td>
                            <td className="py-2">10 minutes</td>
                          </tr>
                          <tr>
                            <td className="py-2 font-mono text-xs">theme</td>
                            <td className="py-2">
                              Stores your light/dark mode preference
                            </td>
                            <td className="py-2">1 year</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="border-l-4 border-chart-2 pl-4">
                    <h3 className="text-xl font-heading font-semibold mb-2">
                      2.2 Analytics Cookies (Optional)
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      These cookies help us understand how users interact with
                      our service to improve it.
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 font-semibold">
                              Cookie Name
                            </th>
                            <th className="text-left py-2 font-semibold">
                              Purpose
                            </th>
                            <th className="text-left py-2 font-semibold">
                              Duration
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                          <tr className="border-b border-border">
                            <td className="py-2 font-mono text-xs">_ga</td>
                            <td className="py-2">
                              Google Analytics - distinguishes users
                            </td>
                            <td className="py-2">2 years</td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="py-2 font-mono text-xs">_ga_*</td>
                            <td className="py-2">
                              Google Analytics - persists session state
                            </td>
                            <td className="py-2">2 years</td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="py-2 font-mono text-xs">_gid</td>
                            <td className="py-2">
                              Google Analytics - distinguishes users
                            </td>
                            <td className="py-2">24 hours</td>
                          </tr>
                          <tr>
                            <td className="py-2 font-mono text-xs">_gat</td>
                            <td className="py-2">
                              Google Analytics - throttles request rate
                            </td>
                            <td className="py-2">1 minute</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      <strong>Data collected:</strong> Page views, time on site,
                      device type, browser, location (city-level), referral
                      source
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Privacy:</strong> Analytics data is anonymized. We
                      do not link analytics to individual user accounts.
                    </p>
                  </div>

                  {/* Marketing Cookies */}
                  <div className="border-l-4 border-chart-3 pl-4">
                    <h3 className="text-xl font-heading font-semibold mb-2">
                      2.3 Marketing & Advertising Cookies (Optional)
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      These cookies track your browsing to show you relevant ads
                      and measure campaign effectiveness.
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 font-semibold">
                              Service
                            </th>
                            <th className="text-left py-2 font-semibold">
                              Purpose
                            </th>
                            <th className="text-left py-2 font-semibold">
                              Duration
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                          <tr className="border-b border-border">
                            <td className="py-2">Google Ads</td>
                            <td className="py-2">
                              Retargeting and conversion tracking
                            </td>
                            <td className="py-2">90 days</td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="py-2">Facebook Pixel</td>
                            <td className="py-2">
                              Social media advertising and remarketing
                            </td>
                            <td className="py-2">90 days</td>
                          </tr>
                          <tr>
                            <td className="py-2">Twitter Pixel</td>
                            <td className="py-2">
                              Track ad performance on Twitter/X
                            </td>
                            <td className="py-2">30 days</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      <strong>Note:</strong> We only use marketing cookies if
                      you consent via our cookie banner. You can opt out
                      anytime.
                    </p>
                  </div>

                  {/* Functional Cookies */}
                  <div className="border-l-4 border-chart-4 pl-4">
                    <h3 className="text-xl font-heading font-semibold mb-2">
                      2.4 Functional Cookies (Optional)
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      These cookies enhance functionality and personalization.
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 font-semibold">
                              Cookie Name
                            </th>
                            <th className="text-left py-2 font-semibold">
                              Purpose
                            </th>
                            <th className="text-left py-2 font-semibold">
                              Duration
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                          <tr className="border-b border-border">
                            <td className="py-2 font-mono text-xs">
                              preferred_language
                            </td>
                            <td className="py-2">
                              Remember language selection
                            </td>
                            <td className="py-2">1 year</td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="py-2 font-mono text-xs">
                              sidebar_collapsed
                            </td>
                            <td className="py-2">Remember UI preferences</td>
                            <td className="py-2">1 year</td>
                          </tr>
                          <tr>
                            <td className="py-2 font-mono text-xs">
                              tutorial_completed
                            </td>
                            <td className="py-2">Track onboarding progress</td>
                            <td className="py-2">1 year</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>

              {/* Local Storage */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  3. Local Storage & Session Storage
                </h2>
                <p className="text-muted-foreground mb-4">
                  In addition to cookies, we use browser storage technologies:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>Local Storage:</strong> Stores draft campaign data,
                    character builder progress, and UI preferences locally on
                    your device (never expires unless cleared)
                  </li>
                  <li>
                    <strong>Session Storage:</strong> Temporarily stores form
                    data during your browsing session (clears when you close the
                    tab)
                  </li>
                  <li>
                    <strong>IndexedDB:</strong> May store offline data for
                    character sheets and campaign content (enables offline
                    access)
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  This data stays on your device and is not sent to our servers
                  unless you explicitly save or sync.
                </p>
              </section>

              {/* Managing Cookies */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  4. Managing Your Cookie Preferences
                </h2>

                <h3 className="text-xl font-heading font-semibold mb-3">
                  4.1 Cookie Banner
                </h3>
                <p className="text-muted-foreground mb-4">
                  When you first visit our site, you'll see a cookie consent
                  banner. You can:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>Accept All:</strong> Allow all cookies (analytics,
                    marketing, functional)
                  </li>
                  <li>
                    <strong>Reject All:</strong> Only essential cookies will be
                    used
                  </li>
                  <li>
                    <strong>Customize:</strong> Choose which types of cookies to
                    allow
                  </li>
                </ul>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  4.2 Browser Settings
                </h3>
                <p className="text-muted-foreground mb-4">
                  You can control cookies through your browser settings:
                </p>
                <div className="space-y-3">
                  <div className="bg-muted p-3 rounded">
                    <strong className="text-foreground">Chrome:</strong>
                    <span className="text-sm text-muted-foreground ml-2">
                      Settings → Privacy and Security → Cookies
                    </span>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <strong className="text-foreground">Firefox:</strong>
                    <span className="text-sm text-muted-foreground ml-2">
                      Settings → Privacy & Security → Cookies and Site Data
                    </span>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <strong className="text-foreground">Safari:</strong>
                    <span className="text-sm text-muted-foreground ml-2">
                      Preferences → Privacy → Cookies and website data
                    </span>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <strong className="text-foreground">Edge:</strong>
                    <span className="text-sm text-muted-foreground ml-2">
                      Settings → Cookies and site permissions
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  ⚠️ <strong>Warning:</strong> Blocking essential cookies will
                  prevent you from logging in and using the service.
                </p>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  4.3 Opt-Out Links
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>Google Analytics:</strong>{" "}
                    <a
                      href="https://tools.google.com/dlpage/gaoptout"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Google Analytics Opt-out Browser Add-on
                    </a>
                  </li>
                  <li>
                    <strong>Google Ads:</strong>{" "}
                    <a
                      href="https://adssettings.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Ads Settings
                    </a>
                  </li>
                  <li>
                    <strong>Facebook:</strong>{" "}
                    <a
                      href="https://www.facebook.com/settings?tab=ads"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Ad Preferences
                    </a>
                  </li>
                  <li>
                    <strong>Industry-wide opt-out:</strong>{" "}
                    <a
                      href="https://optout.aboutads.info/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Digital Advertising Alliance Opt-Out
                    </a>
                  </li>
                </ul>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  4.4 Do Not Track (DNT)
                </h3>
                <p className="text-muted-foreground">
                  We respect Do Not Track signals. If your browser has DNT
                  enabled, we will not set analytics or marketing cookies (but
                  essential cookies are still required for functionality).
                </p>
              </section>

              {/* Mobile Apps */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  5. Discord Bot & Mobile Apps
                </h2>
                <p className="text-muted-foreground mb-4">
                  Our Discord bot and potential future mobile apps do not use
                  cookies, but they do use:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>Device IDs:</strong> To identify your device for
                    push notifications
                  </li>
                  <li>
                    <strong>App Preferences:</strong> Stored locally to remember
                    your settings
                  </li>
                  <li>
                    <strong>Analytics SDKs:</strong> To track app usage (you can
                    opt out in app settings)
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  See our{" "}
                  <Link
                    href="/legal/privacy"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>{" "}
                  for more details on Discord and mobile data collection.
                </p>
              </section>

              {/* Third-Party Cookies */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  6. Third-Party Cookies
                </h2>
                <p className="text-muted-foreground mb-4">
                  Some cookies are set by third-party services we integrate:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>Discord:</strong> When you authenticate via Discord,
                    they may set cookies (see{" "}
                    <a
                      href="https://discord.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Discord Privacy Policy
                    </a>
                    )
                  </li>
                  <li>
                    <strong>Stripe:</strong> Payment processing may use cookies
                    for fraud detection (see{" "}
                    <a
                      href="https://stripe.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Stripe Privacy Policy
                    </a>
                    )
                  </li>
                  <li>
                    <strong>CDN Providers:</strong> Content delivery networks
                    may cache resources
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  We do not control third-party cookies. Please review their
                  privacy policies.
                </p>
              </section>

              {/* Updates */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  7. Updates to This Policy
                </h2>
                <p className="text-muted-foreground">
                  We may update this Cookie Policy as we add or remove services.
                  The "Last Updated" date at the top reflects the most recent
                  changes. We'll notify you of significant changes via our
                  website or email.
                </p>
              </section>

              {/* Contact */}
              <section className="card p-6 bg-muted">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  8. Questions?
                </h2>
                <p className="text-muted-foreground mb-4">
                  If you have questions about our use of cookies:
                </p>
                <div className="flex items-center gap-2 text-primary">
                  <Mail className="h-5 w-5" />
                  <a
                    href="mailto:privacy@pathway.gg"
                    className="hover:underline"
                  >
                    privacy@pathway.gg
                  </a>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  See also:{" "}
                  <Link
                    href="/legal/privacy"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>{" "}
                  |{" "}
                  <Link
                    href="/legal/gdpr"
                    className="text-primary hover:underline"
                  >
                    GDPR Compliance
                  </Link>
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
