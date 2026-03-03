import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    series: z.enum(['concepts', 'compiler', 'deep-dives']),
    seriesNumber: z.number(),           // position within the series
    pubDate: z.coerce.date(),
    readingTime: z.string(),            // e.g. "12 min"
    prRef: z.string().optional(),       // e.g. "PR #1497"
    sourceFile: z.string().optional(),  // e.g. "guppylang/checker/linearity.py"
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
