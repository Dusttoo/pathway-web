/**
 * GDPR Compliance Page
 * EU user rights and data protection compliance
 */

import Link from "next/link";
import { Download, Eye, Lock, Mail, Shield, Trash2 } from "lucide-react";

export default function GDPRPage() {
  return (
    <div className="w-full">
      <section className="bg-gradient-to-b from-background to-muted py-12">
        <div className="container max-w-4xl mx-auto px-4 md:px-8">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-heading font-bold text-center mb-4">GDPR Compliance</h1>
          <p className="text-center text-muted-foreground">
            Your Rights Under the EU General Data Protection Regulation
          </p>
          <p className="text-center text-muted-foreground text-sm mt-2">
            Last Updated: May 14, 2026
          </p>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container max-w-4xl mx-auto px-4 md:px-8">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="card p-8 mb-6">
              <p className="text-lg text-muted-foreground">
                This page summarizes how Pathway handles privacy requests for users in the European
                Union, European Economic Area, United Kingdom, and other regions with similar
                rights. Our full{" "}
                <Link href="/legal/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>{" "}
                provides more detail.
              </p>
            </div>

            <div className="space-y-8">
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">1. Data Controller</h2>
                <p className="text-muted-foreground mb-4">
                  For GDPR purposes, the data controller is Pathway.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold">Pathway</p>
                  <p className="text-sm text-muted-foreground">United States</p>
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm">
                      <strong>Privacy Contact:</strong>{" "}
                      <a href="mailto:privacy@pathway.gg" className="text-primary hover:underline">
                        privacy@pathway.gg
                      </a>
                    </p>
                    <p className="text-sm">
                      <strong>Support Server:</strong>{" "}
                      <a
                        href="https://discord.gg/PD7EsuzmpE"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Join Pathway Support
                      </a>
                    </p>
                  </div>
                </div>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  2. Legal Bases for Processing
                </h2>
                <div className="space-y-4">
                  <div className="border-l-4 border-chart-1 pl-4">
                    <h4 className="font-semibold mb-1">Contract Performance</h4>
                    <p className="text-sm text-muted-foreground">
                      We process account, Discord, character, campaign, and command data when needed
                      to provide the Pathway bot and web app.
                    </p>
                  </div>

                  <div className="border-l-4 border-chart-2 pl-4">
                    <h4 className="font-semibold mb-1">Legitimate Interests</h4>
                    <p className="text-sm text-muted-foreground">
                      We process limited usage, security, analytics, and error data to keep Pathway
                      reliable, secure, and useful during closed beta.
                    </p>
                  </div>

                  <div className="border-l-4 border-chart-3 pl-4">
                    <h4 className="font-semibold mb-1">Consent</h4>
                    <p className="text-sm text-muted-foreground">
                      We rely on consent where required for optional cookies, feedback, beta
                      communications, or voluntary data you choose to submit.
                    </p>
                  </div>

                  <div className="border-l-4 border-chart-4 pl-4">
                    <h4 className="font-semibold mb-1">Legal Obligations</h4>
                    <p className="text-sm text-muted-foreground">
                      We may process and retain information when required to comply with law,
                      respond to valid legal requests, or protect legal rights.
                    </p>
                  </div>
                </div>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">3. Categories of Data</h2>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    Discord identifiers, usernames, avatars, server IDs, channel IDs, and permission
                    context
                  </li>
                  <li>
                    Character sheets, Pathway JSON IDs, imported Pathbuilder data, feats, spells,
                    skills, inventory, attacks, companions, notes, portraits, and related sheet data
                  </li>
                  <li>
                    Server settings, active character preferences, initiative state, downtime data,
                    calendar data, hunt and harvest data, homebrew entries, and campaign utilities
                  </li>
                  <li>
                    Website session data, cookies, IP address, browser metadata, analytics,
                    performance logs, and security logs
                  </li>
                  <li>Feedback, support requests, bug reports, and contact form submissions</li>
                </ul>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">4. Your Rights</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-border p-4">
                    <Eye className="h-6 w-6 text-primary mb-2" />
                    <h4 className="font-semibold mb-1">Access</h4>
                    <p className="text-sm text-muted-foreground">
                      Request a copy of personal data associated with your Pathway account.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <Download className="h-6 w-6 text-primary mb-2" />
                    <h4 className="font-semibold mb-1">Portability</h4>
                    <p className="text-sm text-muted-foreground">
                      Request data in a commonly used format where technically feasible.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <Lock className="h-6 w-6 text-primary mb-2" />
                    <h4 className="font-semibold mb-1">Correction</h4>
                    <p className="text-sm text-muted-foreground">
                      Ask us to correct inaccurate account or profile information.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <Trash2 className="h-6 w-6 text-primary mb-2" />
                    <h4 className="font-semibold mb-1">Deletion</h4>
                    <p className="text-sm text-muted-foreground">
                      Ask us to delete personal data unless we must retain it for security, legal,
                      backup, or abuse-prevention reasons.
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground mt-4">
                  You may also object to or restrict certain processing, and you may withdraw
                  consent where processing is based on consent.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">5. How to Make a Request</h2>
                <p className="text-muted-foreground mb-4">
                  Email{" "}
                  <a href="mailto:privacy@pathway.gg" className="text-primary hover:underline">
                    privacy@pathway.gg
                  </a>{" "}
                  or contact us through the Pathway support server. To protect your data, we may ask
                  you to verify control of the Discord account related to the request.
                </p>
                <p className="text-muted-foreground">
                  We aim to respond within 30 days where required by law. Complex requests or
                  requests involving backups, abuse logs, or shared Discord server data may take
                  longer.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">6. International Transfers</h2>
                <p className="text-muted-foreground">
                  Pathway is operated from the United States and uses service providers such as
                  Discord, Supabase, hosting, analytics, and security providers. Your information
                  may be processed outside your country. Where required, we rely on appropriate
                  safeguards such as standard contractual clauses or equivalent protections used by
                  our service providers.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">7. Retention</h2>
                <p className="text-muted-foreground">
                  We keep personal data only as long as needed to provide Pathway, support closed
                  beta testing, maintain security, resolve disputes, comply with legal obligations,
                  and preserve backups. Deleted records may remain in backups or logs for a limited
                  period before they expire.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  8. Automated Decision-Making
                </h2>
                <p className="text-muted-foreground">
                  Pathway does not use automated decision-making or profiling that produces legal or
                  similarly significant effects. The bot does not use AI to run games or generate
                  responses.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4 flex items-center gap-2">
                  <Mail className="h-6 w-6 text-primary" />
                  9. Contact
                </h2>
                <p className="text-muted-foreground mb-4">
                  For privacy rights requests or GDPR questions:
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <p>
                    <strong>Email:</strong>{" "}
                    <a href="mailto:privacy@pathway.gg" className="text-primary hover:underline">
                      privacy@pathway.gg
                    </a>
                  </p>
                  <p>
                    <strong>Support Server:</strong>{" "}
                    <a
                      href="https://discord.gg/PD7EsuzmpE"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Join Pathway Support
                    </a>
                  </p>
                </div>
              </section>

              <div className="grid md:grid-cols-3 gap-4">
                <Link
                  href="/legal/privacy"
                  className="card p-4 hover:border-primary transition-colors"
                >
                  <h3 className="font-semibold mb-2">Privacy Policy</h3>
                  <p className="text-sm text-muted-foreground">
                    How Pathway collects and uses information
                  </p>
                </Link>
                <Link
                  href="/legal/terms"
                  className="card p-4 hover:border-primary transition-colors"
                >
                  <h3 className="font-semibold mb-2">Terms of Service</h3>
                  <p className="text-sm text-muted-foreground">Rules for using Pathway</p>
                </Link>
                <Link
                  href="/legal/cookies"
                  className="card p-4 hover:border-primary transition-colors"
                >
                  <h3 className="font-semibold mb-2">Cookie Policy</h3>
                  <p className="text-sm text-muted-foreground">Cookies and similar technologies</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
