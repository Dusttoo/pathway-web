"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, MessageCircle } from "lucide-react";
import { DISCORD_BOT_INVITE_URL, DISCORD_SUPPORT_SERVER_URL } from "@/lib/external-links";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/features" },
        { label: "About", href: "/about" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Feedback", href: "/feedback" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/legal/privacy" },
        { label: "Terms of Service", href: "/legal/terms" },
      ],
    },
    {
      title: "Community",
      links: [
        { label: "Invite Bot", href: DISCORD_BOT_INVITE_URL, external: true },
        { label: "Support Server", href: DISCORD_SUPPORT_SERVER_URL, external: true },
        { label: "GitHub", href: "#", external: true },
      ],
    },
  ];

  return (
    <footer className="bg-card border-t-2 border-border mt-auto">
      <div className="container max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/images/pathway-avatar.png"
                alt=""
                width={34}
                height={34}
                className="h-8 w-8 rounded-md object-cover"
              />
              <span className="text-xl font-heading font-bold text-foreground">Pathway</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Web companion for the Pathway PF2e Discord bot
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href={DISCORD_SUPPORT_SERVER_URL}
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Discord"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-medium text-foreground mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {currentYear} Pathway. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground text-center md:text-right">
              Built for the PF2e community
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
