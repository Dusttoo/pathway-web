/**
 * Terms of Service Page
 * Legal terms and conditions for Pathway
 */

import Link from "next/link";
import { FileText, Mail } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="w-full">
      <section className="bg-gradient-to-b from-background to-muted py-12">
        <div className="container max-w-4xl mx-auto px-4 md:px-8">
          <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-heading font-bold text-center mb-4">Terms of Service</h1>
          <p className="text-center text-muted-foreground">Last Updated: May 14, 2026</p>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container max-w-4xl mx-auto px-4 md:px-8">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="card p-8 mb-6">
              <p className="text-lg text-muted-foreground">
                Welcome to Pathway. These Terms of Service ("Terms") govern your use of the Pathway
                Discord bot, the Pathway web app, and related closed beta services. Pathway is a
                PF2e campaign, character, and rules-support tool. The bot does not use AI to run
                games or generate responses.
              </p>
            </div>

            <div className="space-y-8">
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground mb-4">
                  By accessing or using Pathway, you agree to these Terms and our{" "}
                  <Link href="/legal/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  . If you do not agree, do not use Pathway.
                </p>
                <p className="text-muted-foreground">
                  During closed beta, access may be limited to invited users, selected Discord
                  servers, testers, and collaborators.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  2. Eligibility and Accounts
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    You must be old enough to use Discord and Pathway under applicable law and
                    Discord's rules.
                  </li>
                  <li>
                    You are responsible for your Discord account and any activity that occurs
                    through it.
                  </li>
                  <li>
                    You must not impersonate others, bypass access controls, or use another person's
                    account without permission.
                  </li>
                  <li>
                    You must keep any beta-only links, keys, or private test materials within the
                    group they were shared with.
                  </li>
                </ul>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">3. What Pathway Provides</h2>
                <p className="text-muted-foreground mb-4">
                  Pathway provides tools for Pathfinder 2e-style play, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Discord bot commands for PF2e lookup and table play</li>
                  <li>
                    Character import, character creation, sheet display, active character selection,
                    feats, abilities, attacks, companions, inventory, and spell support
                  </li>
                  <li>
                    Initiative, monster rolls, downtime, calendar, hunting, harvest, and campaign
                    utility tools
                  </li>
                  <li>
                    Web app tools for building, editing, storing, and syncing character data with
                    the bot
                  </li>
                  <li>
                    Homebrew and campaign databases, including user-created items, deities, Eberron
                    content, and other table-specific entries
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Pathway is not an official rules authority. Game Masters and table organizers
                  remain responsible for final rulings.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">4. Closed Beta Status</h2>
                <p className="text-muted-foreground mb-4">
                  Pathway is currently being prepared for closed beta. Features may be incomplete,
                  changed, limited, removed, reset, or temporarily unavailable. We may use beta
                  feedback, bug reports, and usage patterns to improve the service.
                </p>
                <p className="text-muted-foreground">
                  Do not rely on beta features as your only copy of important campaign or character
                  information. Keep your own backups of important table data.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">5. User Content</h2>
                <p className="text-muted-foreground mb-4">
                  "User Content" means anything you submit, upload, import, or create in Pathway,
                  including character sheets, portraits, notes, homebrew entries, feedback, and
                  Discord command input.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>You keep ownership of your User Content.</li>
                  <li>
                    You give Pathway permission to store, display, process, and transmit User
                    Content as needed to operate the service.
                  </li>
                  <li>
                    You are responsible for ensuring you have the right to use content you submit,
                    including images, homebrew, and imported data.
                  </li>
                  <li>
                    You should not submit private, sensitive, illegal, harassing, or harmful
                    content.
                  </li>
                  <li>
                    Public Discord commands may display User Content to other people in the same
                    channel or server.
                  </li>
                </ul>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">6. Acceptable Use</h2>
                <p className="text-muted-foreground mb-4">You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Use Pathway to violate Discord's Terms of Service.</li>
                  <li>
                    Attempt to access, alter, scrape, or damage accounts, servers, data, or systems
                    you do not control.
                  </li>
                  <li>
                    Abuse commands, spam the bot, overload the service, or interfere with other
                    users' access.
                  </li>
                  <li>
                    Upload malware, credential data, doxxing material, or content intended to harm
                    others.
                  </li>
                  <li>
                    Use Pathway for unlawful activity or to harass, threaten, or exploit anyone.
                  </li>
                  <li>
                    Misrepresent Pathway as an official Paizo, Discord, or Pathbuilder product.
                  </li>
                </ul>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  7. Third-Party Services and Game Content
                </h2>
                <p className="text-muted-foreground mb-4">
                  Pathway integrates with or references services and materials we do not control,
                  including Discord, Supabase, Pathbuilder, and publicly available Pathfinder 2e
                  resources. Your use of those services may be governed by their own terms.
                </p>
                <p className="text-muted-foreground">
                  Pathfinder, Pathfinder 2e, and related game content belong to their respective
                  owners. Pathway is an independent fan and table-support tool and is not affiliated
                  with, endorsed by, or sponsored by Paizo Inc., Discord, Pathbuilder, or Archives
                  of Nethys unless expressly stated.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  8. Payments and Paid Features
                </h2>
                <p className="text-muted-foreground">
                  If Pathway offers paid features, subscriptions, donations, or purchases in the
                  future, the checkout page or purchase flow will provide the applicable price,
                  renewal, refund, and cancellation terms. Unless a paid plan is clearly presented
                  and accepted by you, closed beta access does not create a paid subscription.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  9. Service Changes, Suspension, and Termination
                </h2>
                <p className="text-muted-foreground mb-4">
                  We may update, limit, suspend, or discontinue any part of Pathway at any time,
                  especially during beta. We may remove access or content if we believe a user is
                  violating these Terms, creating security risk, abusing the service, or harming
                  other users.
                </p>
                <p className="text-muted-foreground">
                  You may stop using Pathway at any time. You can also remove the bot from a Discord
                  server or revoke Discord OAuth access through Discord.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">10. Disclaimers</h2>
                <p className="text-muted-foreground mb-4">
                  Pathway is provided "as is" and "as available." We do not guarantee that the
                  service will be uninterrupted, error-free, secure, or accurate.
                </p>
                <p className="text-muted-foreground">
                  Rules lookup, monster data, character calculations, command results, and imported
                  sheets may contain mistakes or become outdated. Always verify important game data
                  before relying on it at the table.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  11. Limitation of Liability
                </h2>
                <p className="text-muted-foreground">
                  To the fullest extent permitted by law, Pathway and its operators will not be
                  liable for indirect, incidental, special, consequential, exemplary, or punitive
                  damages, or for lost data, lost profits, lost goodwill, service interruption, or
                  reliance on incorrect game information.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">12. Indemnity</h2>
                <p className="text-muted-foreground">
                  You agree to defend and hold Pathway harmless from claims, damages, liabilities,
                  and expenses arising from your use of Pathway, your User Content, your violation
                  of these Terms, or your violation of another person's rights.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">13. Changes to These Terms</h2>
                <p className="text-muted-foreground">
                  We may update these Terms as Pathway changes. If changes are material, we may
                  provide notice through the website, Discord, or the support server. Continued use
                  of Pathway after changes become effective means you accept the updated Terms.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4 flex items-center gap-2">
                  <Mail className="h-6 w-6 text-primary" />
                  14. Contact
                </h2>
                <p className="text-muted-foreground mb-4">
                  Questions about these Terms? Contact us:
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <p>
                    <strong>Email:</strong>{" "}
                    <a href="mailto:legal@pathway.gg" className="text-primary hover:underline">
                      legal@pathway.gg
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
