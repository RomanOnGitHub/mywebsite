import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const LANG_PATTERN = '{ru,en,de,tr,zh-CN,es,fr,pt,it,ar}';

const blog = defineCollection({
  loader: glob({ 
    base: './src/content/blog', 
    pattern: `**/${LANG_PATTERN}.{md,mdx}` 
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),
      tags: z.array(z.string()).optional(),
      relatedCases: z.array(z.string()).optional(),
      relatedServices: z.array(z.string()).optional(),
    }),
});

const cases = defineCollection({
  loader: glob({ 
    base: './src/content/cases', 
    pattern: `**/${LANG_PATTERN}.{md,mdx}` 
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      heroImage: image().optional(),
      relatedServices: z.array(z.string()).optional(),
      relatedIndustries: z.array(z.string()).optional(),
    }),
});

const services = defineCollection({
  loader: glob({ 
    base: './src/content/services', 
    pattern: `**/${LANG_PATTERN}.{md,mdx}` 
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      icon: z.string().optional(),
      heroImage: image().optional(),
    }),
});

const industries = defineCollection({
  loader: glob({ 
    base: './src/content/industries', 
    pattern: `**/${LANG_PATTERN}.{md,mdx}` 
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      icon: z.string().optional(),
      heroImage: image().optional(),
      relatedServices: z.array(z.string()).optional(),
      relatedCases: z.array(z.string()).optional(),
    }),
});

const legal = defineCollection({
  loader: glob({ 
    base: './src/content/legal', 
    pattern: `**/${LANG_PATTERN}.{md,mdx}` 
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
  }),
});

export const collections = { 
  blog,
  cases,
  services,
  industries,
  legal,
};
