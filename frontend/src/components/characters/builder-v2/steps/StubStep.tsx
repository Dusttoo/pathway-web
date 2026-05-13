"use client";

import { Construction } from "lucide-react";
import type { StepProps } from "../types";

type Props = StepProps & { label: string };

export function StubStep({ label }: Props) {
  return (
    <div className="p-6 border-2 border-dashed border-border rounded-lg text-center space-y-3">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted">
        <Construction size={28} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{label} — coming soon</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        This step is part of the v2 builder shell. The full UI for{" "}
        <span className="font-medium text-foreground">{label}</span> lands in a follow-up PR. Use{" "}
        <kbd className="px-1.5 py-0.5 text-xs rounded bg-muted border border-border">Next</kbd> to
        continue.
      </p>
    </div>
  );
}
