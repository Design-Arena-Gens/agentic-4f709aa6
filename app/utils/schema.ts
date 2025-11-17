import { z } from "zod";

export const generationSchema = z.object({
  topic: z
    .string()
    .trim()
    .max(120, "Topic is too long. Try focusing on a key theme."),
  mode: z.union([z.literal("newsletter"), z.literal("blog")]),
  voice: z.union([
    z.literal("analytical"),
    z.literal("optimistic"),
    z.literal("urgent"),
    z.literal("casual"),
    z.literal("visionary")
  ]),
  audience: z.union([
    z.literal("executives"),
    z.literal("builders"),
    z.literal("investors"),
    z.literal("general")
  ]),
  length: z.union([
    z.literal("brief"),
    z.literal("standard"),
    z.literal("deep")
  ]),
  includeSources: z.boolean()
});

export type GenerationSchema = z.infer<typeof generationSchema>;
