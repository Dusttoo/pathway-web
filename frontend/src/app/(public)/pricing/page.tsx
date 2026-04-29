"use client";

import Link from "next/link";
import { Check, ArrowRight, Shield, Heart } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="w-full">
      <section className="bg-gradient-to-b from-background to-muted py-20">
        <div className="container max-w-4xl mx-auto px-4 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border-2 border-primary/20 rounded-full px-4 py-2 mb-8">
            <Heart className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Free for everyone</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-6">
            Pricing
          </h1>
          <p className="text-xl text-muted-foreground">
            Pathway is free. No subscription, no paywalls.
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container max-w-2xl mx-auto px-4 md:px-8">
          <div className="card p-8 border-2 border-primary/30">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-heading font-bold text-foreground mb-2">Free</h2>
              <div className="text-5xl font-bold text-primary mb-2">$0</div>
              <p className="text-muted-foreground">Always free. No credit card required.</p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "Unlimited character imports from Pathbuilder 2e",
                "Full rules library — spells, feats, ancestries, monsters, items",
                "Character sheet viewer",
                "Discord bot access",
                "Sign in with Discord",
                "All future features",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>

            <Link href="/login" className="btn-primary w-full text-center text-base py-3 inline-flex items-center justify-center gap-2">
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Pathway is a community project. If you&apos;d like to support development,{" "}
            <a href="#" className="text-primary underline">say hi on Discord</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
