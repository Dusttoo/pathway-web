/**
 * Terms of Service Page
 * Legal terms and conditions for Pathway
 */

import Link from "next/link";
import { FileText, Mail } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-b from-background to-muted py-12">
        <div className="container max-w-4xl mx-auto px-4 md:px-8">
          <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-heading font-bold text-center mb-4">
            Terms of Service
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
                Welcome to Pathway! These Terms of Service ("Terms") govern
                your use of our AI-powered Dungeon Master service. By using our
                service, you agree to these Terms. Please read them carefully.
              </p>
            </div>

            <div className="space-y-8">
              {/* Acceptance */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  1. Acceptance of Terms
                </h2>
                <p className="text-muted-foreground mb-4">
                  By accessing or using Pathway and the companion Pathway bot
                  (the "Service"), you agree to be bound by these Terms and our{" "}
                  <Link
                    href="/legal/privacy"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  . If you do not agree, do not use the Service.
                </p>
                <p className="text-muted-foreground">
                  The Service is operated by Pathway ("we", "us",
                  "our").
                </p>
              </section>

              {/* Eligibility */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  2. Eligibility
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    You must be <strong>18 years or older</strong> to use this
                    Service
                  </li>
                  <li>You must have a valid Discord account</li>
                  <li>
                    You must provide accurate information during registration
                  </li>
                  <li>
                    You are responsible for maintaining the security of your
                    account
                  </li>
                  <li>
                    One account per person; no sharing or selling of accounts
                  </li>
                </ul>
              </section>

              {/* Service Description */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  3. Service Description
                </h2>
                <p className="text-muted-foreground mb-4">
                  Pathway provides:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    PF2e companion service campaigns (via Discord
                    bot and web app)
                  </li>
                  <li>Campaign management and character tracking tools</li>
                  <li>Session recording and transcript generation</li>
                  <li>Homebrew content creation tools</li>
                  <li>PF2e rules library</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  <strong>AI Usage:</strong> Our AI Dungeon Master is powered by
                  Anthropic's Claude. AI responses are generated based on game
                  context and may not always be perfect. We are not responsible
                  for AI-generated content.
                </p>
              </section>

              {/* Subscription Plans */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  4. Subscription Plans & Billing
                </h2>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  4.1 Tiers & Pricing
                </h3>
                <p className="text-muted-foreground mb-4">
                  We offer multiple subscription tiers with different AI hour
                  allocations and campaign limits. Current pricing is available
                  at{" "}
                  <Link
                    href="/pricing"
                    className="text-primary hover:underline"
                  >
                    pathway.gg/pricing
                  </Link>
                  . We reserve the right to modify pricing with 30 days' notice
                  to existing subscribers.
                </p>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  4.2 AI Hours
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>AI hours</strong> track time the AI Dungeon Master
                    is actively running your session
                  </li>
                  <li>Monthly hours reset on your billing anniversary date</li>
                  <li>Unused monthly hours do NOT roll over</li>
                  <li>
                    <strong>Hour packs</strong> purchased separately never
                    expire
                  </li>
                  <li>
                    Overage charges apply if you exceed your monthly limit
                  </li>
                  <li>
                    You will receive warnings at 80% and 95% usage before
                    overages
                  </li>
                </ul>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  4.3 Billing
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    Subscriptions auto-renew monthly or annually based on your
                    selection
                  </li>
                  <li>
                    You authorize us to charge your payment method on each
                    billing cycle
                  </li>
                  <li>
                    Payment processing is handled by Stripe (we do not store
                    card details)
                  </li>
                  <li>
                    Failed payments may result in service suspension after 3
                    days
                  </li>
                  <li>Update payment methods via your account settings</li>
                </ul>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  4.4 Free Trial
                </h3>
                <p className="text-muted-foreground">
                  Free Adventurer tier includes a one-time 3-hour AI trial. This
                  trial is available once per account and does not auto-renew to
                  a paid plan.
                </p>
              </section>

              {/* Refunds */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  5. Refund Policy
                </h2>
                <h3 className="text-xl font-heading font-semibold mb-3">
                  14-Day Money-Back Guarantee
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>New subscriptions:</strong> Full refund within 14
                    days of your first payment
                  </li>
                  <li>
                    <strong>Upgrade refunds:</strong> Pro-rated refund if you
                    downgrade within 14 days
                  </li>
                  <li>
                    <strong>Hour packs:</strong> Refundable within 14 days if
                    unused
                  </li>
                  <li>
                    <strong>Exclusions:</strong> No refunds after 14 days, or if
                    account is banned for ToS violations
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  To request a refund, email{" "}
                  <a
                    href="mailto:billing@pathway.gg"
                    className="text-primary hover:underline"
                  >
                    billing@pathway.gg
                  </a>{" "}
                  within the refund period. Refunds are processed within 5-10
                  business days.
                </p>
              </section>

              {/* Cancellation */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  6. Cancellation & Termination
                </h2>

                <h3 className="text-xl font-heading font-semibold mb-3">
                  6.1 Your Right to Cancel
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Cancel anytime via your account settings</li>
                  <li>
                    Cancellation takes effect at the end of your current billing
                    period
                  </li>
                  <li>You retain access until the period ends</li>
                  <li>No partial refunds for mid-cycle cancellations</li>
                  <li>Your data is retained for 30 days after cancellation</li>
                </ul>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  6.2 Our Right to Terminate
                </h3>
                <p className="text-muted-foreground mb-4">
                  We may suspend or terminate your account immediately if you:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Violate these Terms of Service</li>
                  <li>Abuse the service or harass other users</li>
                  <li>Engage in fraudulent activity or chargebacks</li>
                  <li>Use the service for illegal purposes</li>
                  <li>Attempt to reverse-engineer or hack our systems</li>
                </ul>
              </section>

              {/* User Conduct */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  7. Acceptable Use Policy
                </h2>
                <p className="text-muted-foreground mb-4">You agree NOT to:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    Use the service for illegal activities or promote violence
                  </li>
                  <li>Harass, threaten, or discriminate against other users</li>
                  <li>
                    Upload malicious code, viruses, or attempt to breach
                    security
                  </li>
                  <li>
                    Scrape, data mine, or excessively automate requests to our
                    API
                  </li>
                  <li>
                    Share, sell, or transfer your account to another person
                  </li>
                  <li>Impersonate others or create fake accounts</li>
                  <li>
                    Use the service to train competing AI models without
                    permission
                  </li>
                  <li>
                    Circumvent AI hour limits or abuse free trials with multiple
                    accounts
                  </li>
                  <li>
                    Post sexually explicit, gratuitously violent, or hateful
                    content in shared spaces
                  </li>
                </ul>
              </section>

              {/* Intellectual Property */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  8. Intellectual Property
                </h2>

                <h3 className="text-xl font-heading font-semibold mb-3">
                  8.1 Our IP
                </h3>
                <p className="text-muted-foreground mb-4">
                  We own all rights to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    The Pathway platform and companion Pathway Discord bot
                    (code, design, branding)
                  </li>
                  <li>Official PF2e content we provide</li>
                  <li>AI prompts and system architecture</li>
                  <li>Documentation, tutorials, and marketing materials</li>
                </ul>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  8.2 Your Content
                </h3>
                <p className="text-muted-foreground mb-4">
                  You retain ownership of:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    Your homebrew content (custom classes, species, items)
                  </li>
                  <li>Your campaign stories, characters, and narratives</li>
                  <li>
                    Any original creative works you produce using our tools
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  <strong>License to Us:</strong> By using the Service, you
                  grant us a worldwide, non-exclusive license to store, display,
                  and process your content for the purpose of providing the
                  Service. We will not sell or license your content to third
                  parties without permission.
                </p>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  8.3 Pathfinder & Paizo
                </h3>
                <p className="text-muted-foreground">
                  Pathfinder and related trademarks are property
                  of Wizards of the Coast LLC. We provide access to content
                  under the Pathfinder Compatibility License
                  Gaming License (OGL) 1.0a. Our service is not affiliated with,
                  endorsed by, or sponsored by Wizards of the Coast.
                </p>
              </section>

              {/* AI & Content */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  9. AI-Generated Content
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    AI responses are generated by Anthropic's Claude based on
                    your game context
                  </li>
                  <li>
                    AI-generated content may not always be accurate,
                    appropriate or aligned with PF2e rules
                  </li>
                  <li>
                    You are responsible for moderating AI content in your
                    campaigns
                  </li>
                  <li>
                    We do not claim ownership of AI-generated narratives in your
                    sessions
                  </li>
                  <li>
                    We are not liable for offensive or inappropriate AI outputs
                  </li>
                  <li>
                    Report problematic AI behavior to{" "}
                    <a
                      href="mailto:support@pathway.gg"
                      className="text-primary hover:underline"
                    >
                      support@pathway.gg
                    </a>
                  </li>
                </ul>
              </section>

              {/* Disclaimers */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  10. Disclaimers & Limitations of Liability
                </h2>

                <h3 className="text-xl font-heading font-semibold mb-3">
                  10.1 Service Provided "AS IS"
                </h3>
                <p className="text-muted-foreground mb-4">
                  THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY
                  KIND. WE DO NOT GUARANTEE:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Uninterrupted or error-free service</li>
                  <li>AI accuracy or PF2e rules compliance</li>
                  <li>Data backup or loss prevention (though we do back up)</li>
                  <li>Compatibility with all devices or browsers</li>
                  <li>That the service will meet your specific needs</li>
                </ul>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  10.2 Limitation of Liability
                </h3>
                <p className="text-muted-foreground mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    We are not liable for indirect, incidental, or consequential
                    damages
                  </li>
                  <li>
                    Our total liability is limited to the amount you paid us in
                    the past 12 months
                  </li>
                  <li>
                    We are not liable for third-party services (Discord,
                    Anthropic, AWS, Stripe)
                  </li>
                  <li>
                    We are not liable for user-generated content or AI-generated
                    content
                  </li>
                </ul>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  10.3 Downtime & Maintenance
                </h3>
                <p className="text-muted-foreground">
                  We may perform scheduled maintenance or experience unplanned
                  downtime. We will provide advance notice for scheduled
                  maintenance when possible. No refunds or credits for downtime
                  unless exceeding 48 consecutive hours.
                </p>
              </section>

              {/* Indemnification */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  11. Indemnification
                </h2>
                <p className="text-muted-foreground">
                  You agree to indemnify and hold us harmless from any claims,
                  damages, or expenses (including attorney fees) arising from:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                  <li>Your use of the Service</li>
                  <li>Your violation of these Terms</li>
                  <li>Your content or conduct</li>
                  <li>Your infringement of third-party rights</li>
                </ul>
              </section>

              {/* Dispute Resolution */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  12. Dispute Resolution
                </h2>

                <h3 className="text-xl font-heading font-semibold mb-3">
                  12.1 Informal Resolution
                </h3>
                <p className="text-muted-foreground">
                  Before filing a claim, contact us at{" "}
                  <a
                    href="mailto:legal@pathway.gg"
                    className="text-primary hover:underline"
                  >
                    legal@pathway.gg
                  </a>{" "}
                  to resolve the issue informally. We'll work in good faith to
                  find a solution.
                </p>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  12.2 Binding Arbitration
                </h3>
                <p className="text-muted-foreground mb-4">
                  If informal resolution fails, disputes will be resolved
                  through binding arbitration under the rules of the American
                  Arbitration Association (AAA), except:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Small claims court disputes (under $10,000)</li>
                  <li>IP infringement claims</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  <strong>No Class Actions:</strong> You agree to resolve
                  disputes individually, not as part of a class action.
                </p>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  12.3 Governing Law
                </h3>
                <p className="text-muted-foreground">
                  These Terms are governed by the laws of Delaware, United
                  States, without regard to conflict of law principles.
                </p>
              </section>

              {/* Changes to Terms */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  13. Changes to Terms
                </h2>
                <p className="text-muted-foreground">
                  We may update these Terms from time to time. Material changes
                  will be notified via:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                  <li>Email to your registered address</li>
                  <li>Prominent notice on our website or app</li>
                  <li>Discord announcement (for major changes)</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Continued use after the effective date constitutes acceptance
                  of the new Terms. If you don't agree, cancel your subscription
                  before the changes take effect.
                </p>
              </section>

              {/* Miscellaneous */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  14. Miscellaneous
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>Entire Agreement:</strong> These Terms, plus our
                    Privacy Policy, constitute the entire agreement
                  </li>
                  <li>
                    <strong>Severability:</strong> If any provision is
                    unenforceable, the rest remain in effect
                  </li>
                  <li>
                    <strong>No Waiver:</strong> Our failure to enforce a right
                    doesn't waive that right
                  </li>
                  <li>
                    <strong>Assignment:</strong> You may not transfer your
                    account; we may assign our rights
                  </li>
                  <li>
                    <strong>Force Majeure:</strong> We're not liable for delays
                    due to events beyond our control (natural disasters, war,
                    pandemics, etc.)
                  </li>
                </ul>
              </section>

              {/* Contact */}
              <section className="card p-6 bg-muted">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  15. Contact Information
                </h2>
                <p className="text-muted-foreground mb-4">
                  Questions about these Terms? Contact us:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Mail className="h-5 w-5" />
                    <a
                      href="mailto:legal@pathway.gg"
                      className="hover:underline"
                    >
                      legal@pathway.gg
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <Mail className="h-5 w-5" />
                    <a
                      href="mailto:support@pathway.gg"
                      className="hover:underline"
                    >
                      support@pathway.gg
                    </a>
                  </div>
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
