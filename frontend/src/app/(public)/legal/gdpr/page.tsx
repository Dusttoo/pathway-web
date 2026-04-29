/**
 * GDPR Compliance Page
 * EU user rights and data protection compliance
 */

import Link from "next/link";
import { Shield, Mail, Download, Trash2, Lock, Eye } from "lucide-react";

export default function GDPRPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-b from-background to-muted py-12">
        <div className="container max-w-4xl mx-auto px-4 md:px-8">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-heading font-bold text-center mb-4">
            GDPR Compliance
          </h1>
          <p className="text-center text-muted-foreground">
            Your Rights Under the EU General Data Protection Regulation
          </p>
          <p className="text-center text-muted-foreground text-sm mt-2">
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
                This page explains how Pathway complies with the European
                Union's General Data Protection Regulation (GDPR) and your
                rights as an EU/EEA resident. Our full{" "}
                <Link
                  href="/legal/privacy"
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </Link>{" "}
                provides additional details.
              </p>
            </div>

            <div className="space-y-8">
              {/* Who We Are */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  1. Data Controller Information
                </h2>
                <p className="text-muted-foreground mb-4">
                  For the purposes of GDPR, the data controller is:
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold">Pathway</p>
                  <p className="text-sm text-muted-foreground">
                    <em className="text-xs">
                      Physical address to be added before public launch
                    </em>
                    <br />
                    United States
                  </p>
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm">
                      <strong>Privacy Contact:</strong>{" "}
                      <a
                        href="mailto:privacy@pathway.gg"
                        className="text-primary hover:underline"
                      >
                        privacy@pathway.gg
                      </a>
                    </p>
                    <p className="text-sm">
                      <strong>DPO:</strong> Not required (small business)
                    </p>
                  </div>
                </div>
              </section>

              {/* Legal Basis */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  2. Legal Basis for Processing
                </h2>
                <p className="text-muted-foreground mb-4">
                  We process your personal data under the following legal bases:
                </p>

                <div className="space-y-4">
                  <div className="border-l-4 border-chart-1 pl-4">
                    <h4 className="font-semibold mb-1">
                      Contract Performance (Art. 6(1)(b))
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Processing necessary to provide our service when you
                      subscribe:
                    </p>
                    <ul className="list-disc pl-6 text-sm text-muted-foreground mt-2">
                      <li>Account creation and authentication</li>
                      <li>Campaign and character management</li>
                      <li>AI Dungeon Master functionality</li>
                      <li>Billing and subscription management</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-chart-2 pl-4">
                    <h4 className="font-semibold mb-1">
                      Legitimate Interests (Art. 6(1)(f))
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Processing necessary for our legitimate business
                      interests:
                    </p>
                    <ul className="list-disc pl-6 text-sm text-muted-foreground mt-2">
                      <li>Improving our service and user experience</li>
                      <li>Security and fraud prevention</li>
                      <li>Analytics and performance monitoring</li>
                      <li>Customer support</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-chart-3 pl-4">
                    <h4 className="font-semibold mb-1">
                      Consent (Art. 6(1)(a))
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Processing based on your explicit consent:
                    </p>
                    <ul className="list-disc pl-6 text-sm text-muted-foreground mt-2">
                      <li>Marketing emails and newsletters</li>
                      <li>Non-essential cookies (analytics, marketing)</li>
                      <li>Optional feature usage tracking</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      You may withdraw consent at any time without affecting
                      service access.
                    </p>
                  </div>

                  <div className="border-l-4 border-chart-4 pl-4">
                    <h4 className="font-semibold mb-1">
                      Legal Obligation (Art. 6(1)(c))
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Processing required by law:
                    </p>
                    <ul className="list-disc pl-6 text-sm text-muted-foreground mt-2">
                      <li>Tax and accounting records</li>
                      <li>Responding to legal requests</li>
                      <li>Compliance with financial regulations</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Your Rights */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  3. Your GDPR Rights
                </h2>
                <p className="text-muted-foreground mb-6">
                  As an EU/EEA resident, you have the following rights:
                </p>

                <div className="space-y-6">
                  {/* Right to Access */}
                  <div className="flex gap-4">
                    <div className="bg-primary/20 p-3 rounded-lg h-fit">
                      <Eye className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">
                        Right to Access (Art. 15)
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Request a copy of all personal data we hold about you,
                        including:
                      </p>
                      <ul className="list-disc pl-6 text-sm text-muted-foreground">
                        <li>Account information and profile data</li>
                        <li>Campaign and character data</li>
                        <li>Session transcripts and AI interactions</li>
                        <li>Billing and payment history</li>
                      </ul>
                      <p className="text-sm text-primary mt-2">
                        <strong>How to exercise:</strong> Email{" "}
                        <a
                          href="mailto:privacy@pathway.gg"
                          className="hover:underline"
                        >
                          privacy@pathway.gg
                        </a>{" "}
                        with subject "GDPR Access Request"
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Response time:</strong> 30 days (free, first
                        request)
                      </p>
                    </div>
                  </div>

                  {/* Right to Rectification */}
                  <div className="flex gap-4">
                    <div className="bg-primary/20 p-3 rounded-lg h-fit">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">
                        Right to Rectification (Art. 16)
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Correct inaccurate or incomplete personal data. You can
                        update most information via:
                      </p>
                      <ul className="list-disc pl-6 text-sm text-muted-foreground">
                        <li>Account settings in the web app</li>
                        <li>Discord profile (for username/avatar)</li>
                        <li>Contact support for billing details</li>
                      </ul>
                    </div>
                  </div>

                  {/* Right to Erasure */}
                  <div className="flex gap-4">
                    <div className="bg-primary/20 p-3 rounded-lg h-fit">
                      <Trash2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">
                        Right to Erasure / "Right to be Forgotten" (Art. 17)
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Request deletion of your personal data. We will comply
                        except where retention is required by law.
                      </p>
                      <p className="text-sm text-primary mb-2">
                        <strong>How to exercise:</strong> Delete your account
                        via settings or email{" "}
                        <a
                          href="mailto:privacy@pathway.gg"
                          className="hover:underline"
                        >
                          privacy@pathway.gg
                        </a>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Timeline:</strong> Data deleted within 30 days
                        (backups may persist up to 90 days)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Exceptions:</strong> We retain data if required
                        for legal compliance, tax records (7 years), or active
                        disputes
                      </p>
                    </div>
                  </div>

                  {/* Right to Data Portability */}
                  <div className="flex gap-4">
                    <div className="bg-primary/20 p-3 rounded-lg h-fit">
                      <Download className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">
                        Right to Data Portability (Art. 20)
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Receive your data in a machine-readable format (JSON) to
                        transfer to another service.
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Available exports:</strong>
                      </p>
                      <ul className="list-disc pl-6 text-sm text-muted-foreground">
                        <li>
                          Character sheets (JSON, PDF) - available in-app now
                        </li>
                        <li>
                          Campaign data (JSON) - available in-app for DMs now
                        </li>
                        <li>Full account export (JSON) - request via email</li>
                      </ul>
                      <p className="text-sm text-primary">
                        <strong>How to exercise:</strong> Use in-app export
                        features or email for full data package
                      </p>
                    </div>
                  </div>

                  {/* Right to Restriction */}
                  <div className="flex gap-4">
                    <div className="bg-primary/20 p-3 rounded-lg h-fit">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">
                        Right to Restriction of Processing (Art. 18)
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Limit how we process your data while disputing accuracy
                        or lawfulness. Data will be stored but not processed.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Example:</strong> If you dispute the accuracy of
                        billing records, we'll pause processing while
                        investigating.
                      </p>
                    </div>
                  </div>

                  {/* Right to Object */}
                  <div className="flex gap-4">
                    <div className="bg-primary/20 p-3 rounded-lg h-fit">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">
                        Right to Object (Art. 21)
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Object to processing based on legitimate interests or
                        for direct marketing:
                      </p>
                      <ul className="list-disc pl-6 text-sm text-muted-foreground">
                        <li>
                          <strong>Marketing:</strong> Unsubscribe from emails
                          via link in footer or account settings
                        </li>
                        <li>
                          <strong>Analytics:</strong> Disable via cookie
                          settings or Do Not Track
                        </li>
                        <li>
                          <strong>Profiling:</strong> We do not use automated
                          decision-making or profiling
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Right to Withdraw Consent */}
                  <div className="flex gap-4">
                    <div className="bg-primary/20 p-3 rounded-lg h-fit">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">
                        Right to Withdraw Consent (Art. 7(3))
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Withdraw consent for optional processing at any time:
                      </p>
                      <ul className="list-disc pl-6 text-sm text-muted-foreground">
                        <li>
                          Marketing emails: Click "Unsubscribe" in any email
                        </li>
                        <li>
                          Cookies: Adjust preferences in our cookie banner or
                          browser settings
                        </li>
                        <li>
                          Feature usage tracking: Disable in account privacy
                          settings
                        </li>
                      </ul>
                      <p className="text-sm text-muted-foreground mt-2">
                        Withdrawing consent does not affect your ability to use
                        the service.
                      </p>
                    </div>
                  </div>

                  {/* Right to Lodge Complaint */}
                  <div className="flex gap-4">
                    <div className="bg-primary/20 p-3 rounded-lg h-fit">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">
                        Right to Lodge a Complaint (Art. 77)
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        If you believe we've violated GDPR, you can file a
                        complaint with your local Data Protection Authority
                        (DPA):
                      </p>
                      <p className="text-sm text-primary">
                        <a
                          href="https://edpb.europa.eu/about-edpb/about-edpb/members_en"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          Find Your National DPA →
                        </a>
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        We encourage you to contact us first at{" "}
                        <a
                          href="mailto:privacy@pathway.gg"
                          className="text-primary hover:underline"
                        >
                          privacy@pathway.gg
                        </a>{" "}
                        so we can address your concerns directly.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* How to Exercise Rights */}
              <section className="card p-6 bg-primary/10">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  4. How to Exercise Your Rights
                </h2>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">📧 Email Request</h4>
                    <p className="text-sm text-muted-foreground">
                      Send requests to{" "}
                      <a
                        href="mailto:privacy@pathway.gg"
                        className="text-primary hover:underline"
                      >
                        privacy@pathway.gg
                      </a>{" "}
                      with:
                    </p>
                    <ul className="list-disc pl-6 text-sm text-muted-foreground mt-2">
                      <li>Subject line: "GDPR [Right Name] Request"</li>
                      <li>Your Discord username and user ID</li>
                      <li>Account email address</li>
                      <li>Description of your request</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">
                      🔐 Identity Verification
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      To protect your privacy, we may ask you to verify your
                      identity before fulfilling requests. This may involve:
                    </p>
                    <ul className="list-disc pl-6 text-sm text-muted-foreground mt-2">
                      <li>Logging into your account to confirm ownership</li>
                      <li>Providing additional identifying information</li>
                      <li>
                        Two-factor authentication via Discord (if enabled)
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">⏱️ Response Timeline</h4>
                    <ul className="list-disc pl-6 text-sm text-muted-foreground">
                      <li>
                        <strong>Standard response:</strong> 30 days from
                        verification
                      </li>
                      <li>
                        <strong>Complex requests:</strong> Up to 60 days (we'll
                        notify you of extension)
                      </li>
                      <li>
                        <strong>No fee</strong> for first request; reasonable
                        fee for excessive/repetitive requests
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* International Transfers */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  5. International Data Transfers
                </h2>
                <p className="text-muted-foreground mb-4">
                  Our servers are located in the United States (AWS US-East-1).
                  When you use our service from the EU/EEA, your data is
                  transferred outside the European Economic Area.
                </p>

                <h3 className="text-xl font-heading font-semibold mb-3">
                  5.1 Transfer Safeguards
                </h3>
                <p className="text-muted-foreground mb-4">
                  We protect your data during international transfers using:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>Standard Contractual Clauses (SCCs):</strong> We use
                    EU-approved SCCs with our service providers (AWS, Anthropic,
                    Stripe)
                  </li>
                  <li>
                    <strong>AWS Data Processing Addendum:</strong> AWS complies
                    with GDPR through their DPA and SCCs
                  </li>
                  <li>
                    <strong>Encryption:</strong> All data is encrypted in
                    transit (TLS 1.3) and at rest (AES-256)
                  </li>
                  <li>
                    <strong>Access Controls:</strong> Strict access limitations
                    on who can access EU user data
                  </li>
                </ul>

                <h3 className="text-xl font-heading font-semibold mb-3 mt-6">
                  5.2 Third-Party Processors
                </h3>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    EU data may be processed by:
                  </p>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground">
                    <li>
                      <strong>AWS (US):</strong> Cloud hosting - uses SCCs
                    </li>
                    <li>
                      <strong>Anthropic (US):</strong> AI processing - uses SCCs
                    </li>
                    <li>
                      <strong>Stripe (US):</strong> Payment processing - GDPR
                      compliant
                    </li>
                    <li>
                      <strong>Discord (US):</strong> Authentication - GDPR
                      compliant
                    </li>
                  </ul>
                </div>
              </section>

              {/* Data Retention */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  6. Data Retention Periods
                </h2>
                <div className="bg-muted p-4 rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-semibold">
                          Data Type
                        </th>
                        <th className="text-left py-2 font-semibold">
                          Retention Period
                        </th>
                        <th className="text-left py-2 font-semibold">
                          Legal Basis
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border">
                        <td className="py-2">Account data</td>
                        <td className="py-2">While account active + 30 days</td>
                        <td className="py-2">Contract</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-2">Billing records</td>
                        <td className="py-2">7 years after last transaction</td>
                        <td className="py-2">Legal obligation (tax law)</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-2">Campaign data</td>
                        <td className="py-2">While account active + 30 days</td>
                        <td className="py-2">Contract</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-2">AI interaction logs</td>
                        <td className="py-2">90 days (for debugging)</td>
                        <td className="py-2">Legitimate interest</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-2">Support tickets</td>
                        <td className="py-2">3 years after resolution</td>
                        <td className="py-2">Legitimate interest</td>
                      </tr>
                      <tr>
                        <td className="py-2">Marketing consent</td>
                        <td className="py-2">Until withdrawn</td>
                        <td className="py-2">Consent</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  After retention periods expire, data is securely deleted
                  unless required for legal compliance or active disputes.
                </p>
              </section>

              {/* Children's Data */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  7. Children's Data (Under 16)
                </h2>
                <p className="text-muted-foreground mb-4">
                  Our service requires users to be{" "}
                  <strong>18 years or older</strong>. We do not knowingly
                  collect data from children under 16 (or under 18, per our
                  Terms).
                </p>
                <p className="text-muted-foreground">
                  If you believe we have inadvertently collected data from a
                  minor, contact{" "}
                  <a
                    href="mailto:privacy@pathway.gg"
                    className="text-primary hover:underline"
                  >
                    privacy@pathway.gg
                  </a>{" "}
                  immediately, and we will delete it within 72 hours.
                </p>
              </section>

              {/* Automated Decision Making */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  8. Automated Decision-Making & Profiling
                </h2>
                <p className="text-muted-foreground mb-4">
                  We <strong>do not</strong> use automated decision-making or
                  profiling that produces legal or similarly significant effects
                  (Art. 22 GDPR).
                </p>
                <p className="text-muted-foreground">
                  <strong>AI Usage Note:</strong> Our AI Dungeon Master
                  generates content for your game sessions, but this does not
                  constitute "automated decision-making" under GDPR as it does
                  not make decisions about you personally (only about fictional
                  game scenarios).
                </p>
              </section>

              {/* Contact DPO */}
              <section className="card p-6 bg-muted">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  9. Contact Our Privacy Team
                </h2>
                <p className="text-muted-foreground mb-4">
                  For any GDPR-related questions or to exercise your rights:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Mail className="h-5 w-5" />
                    <div>
                      <strong>Privacy Team:</strong>{" "}
                      <a
                        href="mailto:privacy@pathway.gg"
                        className="hover:underline"
                      >
                        privacy@pathway.gg
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <Mail className="h-5 w-5" />
                    <div>
                      <strong>Legal Inquiries:</strong>{" "}
                      <a
                        href="mailto:legal@pathway.gg"
                        className="hover:underline"
                      >
                        legal@pathway.gg
                      </a>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Mailing Address:
                  <br />
                  Pathway
                  <br />
                  <em className="text-xs">
                    Physical address to be added before public launch
                  </em>
                  <br />
                  United States
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Expected response time:</strong> 30 days or less
                </p>
              </section>

              {/* Related Documents */}
              <section className="card p-6">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  10. Related Documents
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link
                    href="/legal/privacy"
                    className="card p-4 hover:shadow-md transition-all"
                  >
                    <h4 className="font-semibold text-primary mb-1">
                      Privacy Policy
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Complete data collection and usage details
                    </p>
                  </Link>
                  <Link
                    href="/legal/terms"
                    className="card p-4 hover:shadow-md transition-all"
                  >
                    <h4 className="font-semibold text-primary mb-1">
                      Terms of Service
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Legal terms and conditions for using our service
                    </p>
                  </Link>
                  <Link
                    href="/legal/cookies"
                    className="card p-4 hover:shadow-md transition-all"
                  >
                    <h4 className="font-semibold text-primary mb-1">
                      Cookie Policy
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      How we use cookies and tracking technologies
                    </p>
                  </Link>
                  <Link
                    href="/contact"
                    className="card p-4 hover:shadow-md transition-all"
                  >
                    <h4 className="font-semibold text-primary mb-1">
                      Contact Us
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Get in touch with our support team
                    </p>
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
