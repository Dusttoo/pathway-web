import { z } from "zod";

export const updateSubmissionSchema = z.object({
  kind: z.enum(["feedback", "contact"]),
  id: z.string().min(1),
  addressed: z.boolean(),
});

export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;
