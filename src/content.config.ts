import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
const clanky = defineCollection({
  loader: glob({ pattern: "**/index.md", base: "./src/content/clanky" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      place: z.string().optional(),
      medals: z.string().optional(),
      summary: z.string(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      draft: z.boolean().default(false),
    }),
});
const galerie = defineCollection({
  loader: glob({ pattern: "**/index.md", base: "./src/content/galerie" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      cover: image(),
      photos: z.array(z.object({ src: image(), alt: z.string().default("") })),
    }),
});
const stranky = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/stranky" }),
  schema: z.object({ title: z.string() }),
});
export const collections = { clanky, galerie, stranky };
