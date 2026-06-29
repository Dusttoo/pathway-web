import { z } from "zod";

export const queueImportRunSchema = z.object({
  source: z.enum(["nethys", "gamedata", "manual"]).default("nethys"),
  categories: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type QueueImportRunInput = z.infer<typeof queueImportRunSchema>;
