import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().min(1),
    summary: z.string().min(1).max(160),
    tags: z.array(z.string().min(1)).min(1),
    role: z.string().min(1),
    timeframe: z.string().min(1),
    stack: z.array(z.string().min(1)).min(1),
    featured: z.boolean().default(false),
    order: z.number().int(),
    links: z
      .object({ repo: z.string().url().optional(), demo: z.string().url().optional() })
      .default({}),
  }),
})

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1).max(200),
    pubDate: z.coerce.date(),
    tags: z.array(z.string().min(1)).default([]),
    draft: z.boolean().default(false),
  }),
})

export const collections = { projects, blog }
