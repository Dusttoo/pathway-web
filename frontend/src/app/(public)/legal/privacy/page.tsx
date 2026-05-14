/**
 * Privacy Policy Page
 * Privacy policy for Pathway
 */

import Link from "next/link";
import { Mail, Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full">
      <section className="bg-gradient-to-b from-background to-muted py-12">
        <div className="container max-w-4xl mx-auto px-4 md:px-8">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-heading font-bold text-center mb-4">Privacy Policy</h1>
          <p className="text-center text-muted-foreground">Last Updated: May 14, 2026</p>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container max-w-4xl mx-auto px-4 md:px-8">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="card p-8 mb-6">
              <p className="text-lg text-muted-foreground">
                This Privacy Policy explains how Pathway ("Pathway", "we", "us", or "our") collects,
                uses, stores, and protects information when you use the Pathway Discord bot, the
                Pathway web app, and related closed beta services. Pathway does not use AI to run
                the bot or generate bot responses.
              </p>
            </div>

            <div className="space-y-8">
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">1. Information We Collect</h2>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  1.1 Discord Account and Server Data
                </h3>
                <p className="text-muted-foreground mb-4">
                  When you use the bot or sign in with Discord, we may collect:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Discord user ID, username, display name, and avatar</li>
                  <li>Discord server IDs, channel IDs, and bot permissions</li>
                  <li>
                    Command interaction data needed to respond to commands and troubleshoot errors
                  </li>
                  <li>
                    Discord account information made available through Discord OAuth, such as your
                    linked email if Discord provides it
                  </li>
                </ul>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  1.2 Character, Campaign, and Game Data
                </h3>
                <p className="text-muted-foreground mb-4">
                  To provide character management, rules lookup, initiative, downtime, hunting,
                  calendar, and campaign tools, we store data you submit or import, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    Character sheets, Pathway JSON IDs, Pathbuilder import IDs, ability scores,
                    skills, saves, feats, spells, inventory, attacks, companions, notes, and
                    portraits
                  </li>
                  <li>
                    Server and campaign settings, active character selections, initiative state,
                    encounter data, calendars, weather state, downtime activities, and user-created
                    snippets
                  </li>
                  <li>
                    Homebrew records such as ancestries, heritages, classes, deities, houses, items,
                    harvest rewards, and other campaign data you choose to add
                  </li>
                  <li>
                    Bug reports, feedback, contact form submissions, and support messages you send
                    to us
                  </li>
                </ul>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  1.3 Website and Security Data
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Session cookies and authentication tokens</li>
                  <li>IP address, browser, device, and basic request metadata</li>
                  <li>Page usage, performance data, and error logs</li>
                  <li>
                    Security logs used to detect abuse, unauthorized access, or service problems
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  See our{" "}
                  <Link href="/legal/cookies" className="text-primary hover:underline">
                    Cookie Policy
                  </Link>{" "}
                  for more about cookies and similar technologies.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">2. How We Use Information</h2>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    Provide the Discord bot, web character builder, character sheet sync, and PF2e
                    campaign tools
                  </li>
                  <li>
                    Import, update, display, and back up user-created or user-imported character and
                    campaign data
                  </li>
                  <li>Remember server settings, active characters, and user preferences</li>
                  <li>Respond to commands, support requests, bug reports, and beta feedback</li>
                  <li>
                    Monitor reliability, debug errors, improve performance, and prevent abuse or
                    unauthorized access
                  </li>
                  <li>Comply with legal obligations and enforce our terms and policies</li>
                </ul>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">3. Public Discord Output</h2>
                <p className="text-muted-foreground">
                  Many Pathway bot commands post results in Discord channels where other server
                  members can see them. Some commands may be private or ephemeral, but you should
                  treat anything entered into a public Discord channel as visible to that channel.
                  Do not put private, sensitive, or real-world personal information in character
                  notes, homebrew entries, command arguments, or support channels unless you are
                  comfortable sharing it.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">4. Third-Party Services</h2>
                <p className="text-muted-foreground mb-4">
                  We use third-party services to operate Pathway. Their handling of information is
                  governed by their own policies.
                </p>
                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-1">Discord</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Purpose:</strong> Login, bot interactions, server integration, and
                      support community.
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
                    <h4 className="font-semibold mb-1">Supabase</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Purpose:</strong> Database, authentication support, and storage for
                      Pathway web and bot data.
                      <br />
                      <strong>Policy:</strong>{" "}
                      <a
                        href="https://supabase.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Supabase Privacy Policy
                      </a>
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-1">Pathbuilder</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Purpose:</strong> Optional character imports when you provide a
                      Pathbuilder JSON ID, URL, or export. Pathway reads the data you choose to
                      import so your sheet can be created or updated.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-1">Analytics and Hosting</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Purpose:</strong> Site hosting, performance monitoring, analytics,
                      uptime, security, and error reporting.
                    </p>
                  </div>
                </div>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  5. How We Share Information
                </h2>
                <p className="text-muted-foreground mb-4">
                  We do not sell your personal information. We may share information only in these
                  limited situations:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    With service providers that help us host, store, secure, and operate Pathway
                  </li>
                  <li>
                    With Discord users in the same server or channel when a bot command is public
                  </li>
                  <li>
                    With server owners or moderators when needed to address abuse, support, or
                    safety issues
                  </li>
                  <li>
                    If required by law, legal process, or to protect Pathway, our users, or the
                    public
                  </li>
                  <li>
                    In connection with a merger, acquisition, or transfer of the service, subject to
                    continued privacy protections
                  </li>
                </ul>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  6. Data Storage, Security, and Retention
                </h2>
                <p className="text-muted-foreground mb-4">
                  Pathway stores operational data in Supabase and related hosting infrastructure. We
                  use access controls, server-side service keys, environment variables, and
                  reasonable technical safeguards to protect stored data.
                </p>
                <p className="text-muted-foreground mb-4">
                  No online service can guarantee perfect security. During closed beta, features and
                  storage behavior may change as we improve the product.
                </p>
                <p className="text-muted-foreground">
                  We retain information for as long as needed to provide the service, maintain
                  backups, resolve disputes, prevent abuse, comply with legal obligations, and
                  support beta testing. When you delete content through Pathway, we will remove it
                  from active systems where technically feasible, though backups and logs may
                  persist for a limited period.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">7. Your Choices and Rights</h2>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    You can update or delete many characters, homebrew records, and settings through
                    the web app or bot commands.
                  </li>
                  <li>
                    You can disconnect Pathway from Discord by removing the bot from a server or
                    revoking OAuth access in Discord settings.
                  </li>
                  <li>
                    You can request access, correction, export, or deletion of personal data by
                    contacting us.
                  </li>
                  <li>
                    Depending on where you live, you may have additional privacy rights under local
                    law.
                  </li>
                </ul>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">8. Children</h2>
                <p className="text-muted-foreground">
                  Pathway is intended for users who are old enough to use Discord and participate in
                  the closed beta under Discord's rules and applicable law. We do not knowingly
                  collect personal information from children who are not permitted to use the
                  service.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">9. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy as Pathway changes. If we make material changes,
                  we will update the date above and may provide notice through the website, Discord,
                  or the support server.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4 flex items-center gap-2">
                  <Mail className="h-6 w-6 text-primary" />
                  10. Contact
                </h2>
                <p className="text-muted-foreground mb-4">
                  For privacy questions or data requests, contact us at:
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
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
