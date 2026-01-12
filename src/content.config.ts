import { defineCollection, z, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/utils/slugs';

// Используем zh-cn (lowercase) для соответствия BCP 47 стандарту
const LANG_PATTERN = '{ru,en,de,tr,zh-cn,es,fr,pt,it,ar}';

const blog = defineCollection({
  loader: glob({ 
    base: './src/content/blog', 
    pattern: `**/${LANG_PATTERN}.{md,mdx}` 
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      lang: z.enum(SUPPORTED_LOCALES).default(DEFAULT_LOCALE),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),
      tags: z.array(z.string()).optional(),
      relatedCases: z.array(reference('cases')).optional(),
      relatedServices: z.array(reference('services')).optional(),
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
      lang: z.enum(SUPPORTED_LOCALES).default(DEFAULT_LOCALE),
      heroImage: image().optional(),
      relatedServices: z.array(reference('services')).optional(),
      relatedIndustries: z.array(reference('industries')).optional(),
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
      lang: z.enum(SUPPORTED_LOCALES).default(DEFAULT_LOCALE),
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
      lang: z.enum(SUPPORTED_LOCALES).default(DEFAULT_LOCALE),
      icon: z.string().optional(),
      heroImage: image().optional(),
      relatedServices: z.array(reference('services')).optional(),
      relatedCases: z.array(reference('cases')).optional(),
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
    lang: z.enum(SUPPORTED_LOCALES).default(DEFAULT_LOCALE),
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
