import { z } from "zod";

export const updateCurrentUserSchema = z.object({
  email: z.string().email().optional(),
});

export type UpdateCurrentUserInput = z.infer<typeof updateCurrentUserSchema>;
