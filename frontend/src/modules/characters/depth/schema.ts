import { z } from "zod";

const jsonValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValue), z.record(z.string(), jsonValue)])
);

export const upsertCharacterLevelSchema = z.object({
  action: z.literal("upsert_level"),
  level: z.number().int().min(1).max(20),
  choices: z.record(z.string(), jsonValue).default({}),
  snapshot: z.record(z.string(), jsonValue).default({}),
  notes: z.string().nullable().optional(),
});

export const upsertCharacterOverrideSchema = z.object({
  action: z.literal("upsert_override"),
  stat_key: z.string().trim().min(1),
  value: jsonValue,
  reason: z.string().nullable().optional(),
  enabled: z.boolean().default(true),
});

export const createCharacterVersionSchema = z.object({
  action: z.literal("create_version"),
  label: z.string().trim().min(1).max(120).nullable().optional(),
});

export const characterDepthMutationSchema = z.discriminatedUnion("action", [
  upsertCharacterLevelSchema,
  upsertCharacterOverrideSchema,
  createCharacterVersionSchema,
]);

export type CharacterDepthMutationInput = z.infer<typeof characterDepthMutationSchema>;
