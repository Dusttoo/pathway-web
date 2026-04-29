/**
 * Privacy Policy Page
 * Comprehensive privacy policy for Pathway
 */

import Link from "next/link";
import { Shield, Mail } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-b from-background to-muted py-12">
        <div className="container max-w-4xl mx-auto px-4 md:px-8">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-heading font-bold text-center mb-4">
            Privacy Policy
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
                This Privacy Policy describes how Pathway ("Pathway,
                Inc.", "we", "us", or "our") collects, uses, and protects your
                personal information when you use our AI-powered Dungeon Master
                service for PF2e campaigns.
              </p>
            </div>

            <div className="space-y-8">
              {/* Information We Collect */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  1. Information We Collect
                </h2>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  1.1 Information from Discord
                </h3>
                <p className="text-muted-foreground mb-4">
                  When you authenticate with Discord, we collect:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Discord user ID and username</li>
                  <li>Discord server (guild) ID you're accessing from</li>
                  <li>Email address associated with your Discord account</li>
                  <li>Profile avatar (if provided)</li>
                  <li>Discord server membership information</li>
                </ul>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  1.2 Campaign & Character Data
                </h3>
                <p className="text-muted-foreground mb-4">
                  To provide our service, we store:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Campaign names, descriptions, and settings</li>
                  <li>
                    Character sheets (stats, abilities, inventory, backstory)
                  </li>
                  <li>Session transcripts and summaries</li>
                  <li>Homebrew content you create (classes, species, items)</li>
                  <li>Quest logs, NPC data, and location information</li>
                  <li>Dice rolls and game interactions</li>
                </ul>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  1.3 AI Interaction Data
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    Conversation history with the Pathway bot
                  </li>
                  <li>AI hour usage and billing information</li>
                  <li>Prompt inputs and AI-generated responses</li>
                  <li>Session duration and activity timestamps</li>
                </ul>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  1.4 Payment Information
                </h3>
                <p className="text-muted-foreground mb-4">
                  We use third-party payment processors (Stripe) to handle
                  payments. We do NOT store your full credit card information.
                  We retain:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Subscription tier and billing cycle</li>
                  <li>Payment history and invoices</li>
                  <li>Last 4 digits of card (from payment processor)</li>
                  <li>Billing email address</li>
                </ul>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  1.5 Usage & Analytics Data
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>IP address and location data</li>
                  <li>Device type and browser information</li>
                  <li>Page views and navigation patterns</li>
                  <li>Feature usage and engagement metrics</li>
                  <li>Error logs and performance data</li>
                </ul>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  1.6 Cookies & Tracking
                </h3>
                <p className="text-muted-foreground mb-4">
                  We use cookies for authentication, analytics, and marketing.
                  See our{" "}
                  <Link
                    href="/legal/cookies"
                    className="text-primary hover:underline"
                  >
                    Cookie Policy
                  </Link>{" "}
                  for details.
                </p>
              </section>

              {/* How We Use Information */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  2. How We Use Your Information
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>Service Delivery:</strong> Run PF2e
                    sessions, manage campaigns, track characters
                  </li>
                  <li>
                    <strong>AI Processing:</strong> Send your game context to
                    Anthropic's Claude API to generate AI Dungeon Master
                    responses
                  </li>
                  <li>
                    <strong>Billing:</strong> Process subscriptions, track AI
                    hour usage, issue invoices
                  </li>
                  <li>
                    <strong>Analytics:</strong> Understand how users interact
                    with our platform and improve features
                  </li>
                  <li>
                    <strong>Communication:</strong> Send service updates,
                    billing notifications, and marketing (if opted in)
                  </li>
                  <li>
                    <strong>Security:</strong> Detect fraud, prevent abuse,
                    enforce terms of service
                  </li>
                  <li>
                    <strong>Legal Compliance:</strong> Comply with legal
                    obligations and respond to legal requests
                  </li>
                </ul>
              </section>

              {/* Third-Party Services */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  3. Third-Party Services We Use
                </h2>
                <p className="text-muted-foreground mb-4">
                  We share data with the following third-party services:
                </p>

                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-1">Anthropic Claude AI</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Purpose:</strong> AI Dungeon Master responses
                      <br />
                      <strong>Data Shared:</strong> Campaign context, character
                      data, player inputs
                      <br />
                      <strong>Policy:</strong>{" "}
                      <a
                        href="https://www.anthropic.com/legal/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Anthropic Privacy Policy
                      </a>
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-1">Discord</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Purpose:</strong> Authentication, bot
                      functionality
                      <br />
                      <strong>Data Shared:</strong> User ID, server ID, Discord
                      messages
                      <br />
                      <strong>Policy:</strong>{" "}
                      <a
                        href="https://discord.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Discord Privacy Policy
                      </a>
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-1">
                      Amazon Web Services (AWS)
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Purpose:</strong> Cloud hosting, database storage,
                      file storage
                      <br />
                      <strong>Data Shared:</strong> All application data
                      <br />
                      <strong>Region:</strong> US-East-1 (Virginia)
                      <br />
                      <strong>Policy:</strong>{" "}
                      <a
                        href="https://aws.amazon.com/privacy/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        AWS Privacy Policy
                      </a>
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-1">Stripe</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Purpose:</strong> Payment processing
                      <br />
                      <strong>Data Shared:</strong> Billing information, payment
                      details
                      <br />
                      <strong>Policy:</strong>{" "}
                      <a
                        href="https://stripe.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Stripe Privacy Policy
                      </a>
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-1">
                      Google Analytics (if applicable)
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Purpose:</strong> Website analytics
                      <br />
                      <strong>Data Shared:</strong> Anonymized usage data
                      <br />
                      <strong>Policy:</strong>{" "}
                      <a
                        href="https://policies.google.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Google Privacy Policy
                      </a>
                    </p>
                  </div>
                </div>
              </section>

              {/* Data Retention */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  4. Data Retention
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>Active Accounts:</strong> We retain your data as
                    long as your account is active
                  </li>
                  <li>
                    <strong>Deleted Accounts:</strong> Data is deleted within 30
                    days of account deletion, except as required by law
                  </li>
                  <li>
                    <strong>Backups:</strong> Backup copies may persist for up
                    to 90 days for disaster recovery
                  </li>
                  <li>
                    <strong>Legal Holds:</strong> We may retain data longer if
                    required by law or legal proceedings
                  </li>
                  <li>
                    <strong>Anonymized Analytics:</strong> Anonymized data may
                    be retained indefinitely for research
                  </li>
                </ul>
              </section>

              {/* Your Rights */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  5. Your Privacy Rights
                </h2>
                <p className="text-muted-foreground mb-4">
                  Depending on your location, you may have the following rights:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>Access:</strong> Request a copy of your personal
                    data
                  </li>
                  <li>
                    <strong>Correction:</strong> Update or correct inaccurate
                    information
                  </li>
                  <li>
                    <strong>Deletion:</strong> Request deletion of your account
                    and data (right to be forgotten)
                  </li>
                  <li>
                    <strong>Portability:</strong> Export your data in a
                    machine-readable format
                  </li>
                  <li>
                    <strong>Restriction:</strong> Limit how we process your data
                  </li>
                  <li>
                    <strong>Objection:</strong> Object to processing for
                    marketing purposes
                  </li>
                  <li>
                    <strong>Withdraw Consent:</strong> Opt out of optional data
                    processing
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  To exercise these rights, email us at{" "}
                  <a
                    href="mailto:privacy@pathway.gg"
                    className="text-primary hover:underline"
                  >
                    privacy@pathway.gg
                  </a>
                  . See our{" "}
                  <Link
                    href="/legal/gdpr"
                    className="text-primary hover:underline"
                  >
                    GDPR Compliance page
                  </Link>{" "}
                  for EU-specific rights.
                </p>
              </section>

              {/* Data Security */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  6. Data Security
                </h2>
                <p className="text-muted-foreground mb-4">
                  We implement industry-standard security measures:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>Encryption:</strong> All data in transit uses TLS
                    1.3 encryption
                  </li>
                  <li>
                    <strong>Database:</strong> Encrypted PostgreSQL database
                    with access controls
                  </li>
                  <li>
                    <strong>Authentication:</strong> OAuth2 via Discord with JWT
                    token security
                  </li>
                  <li>
                    <strong>Infrastructure:</strong> AWS security best
                    practices, VPC isolation
                  </li>
                  <li>
                    <strong>Backups:</strong> Automated daily backups with
                    encryption
                  </li>
                  <li>
                    <strong>Monitoring:</strong> Real-time security monitoring
                    and error tracking
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  However, no system is 100% secure. We cannot guarantee
                  absolute security and are not liable for unauthorized access
                  beyond our reasonable control.
                </p>
              </section>

              {/* Children's Privacy */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  7. Children's Privacy (18+ Only)
                </h2>
                <p className="text-muted-foreground">
                  Our service is intended for users 18 years and older. We do
                  not knowingly collect information from individuals under 18.
                  If you believe a minor has provided us with personal
                  information, contact us immediately at{" "}
                  <a
                    href="mailto:privacy@pathway.gg"
                    className="text-primary hover:underline"
                  >
                    privacy@pathway.gg
                  </a>{" "}
                  and we will delete it promptly.
                </p>
              </section>

              {/* International Users */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  8. International Data Transfers
                </h2>
                <p className="text-muted-foreground mb-4">
                  Our servers are located in the United States (AWS US-East-1).
                  If you access our service from outside the US, your data will
                  be transferred to and stored in the United States.
                </p>
                <p className="text-muted-foreground">
                  For EU users: We rely on Standard Contractual Clauses (SCCs)
                  and AWS's Data Processing Addendum for GDPR compliance. See
                  our{" "}
                  <Link
                    href="/legal/gdpr"
                    className="text-primary hover:underline"
                  >
                    GDPR page
                  </Link>{" "}
                  for details.
                </p>
              </section>

              {/* Changes to Policy */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  9. Changes to This Policy
                </h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will
                  notify you of material changes via email or prominent notice
                  on our website. Continued use of our service after changes
                  constitutes acceptance of the updated policy.
                </p>
              </section>

              {/* Contact */}
              <section className="card p-6 bg-muted">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  10. Contact Us
                </h2>
                <p className="text-muted-foreground mb-4">
                  For privacy-related questions or to exercise your rights:
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
                  Pathway
                  <br />
                  <em className="text-xs">
                    Physical address to be added before public launch
                  </em>
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
