import { z } from "zod";

export const feedbackSubmissionSchema = z.object({
  type: z.enum(["bug", "feature", "feedback"]).default("feedback"),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(10_000),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>;
