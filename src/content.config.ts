import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/utils/slugs';

/**
 * ⚠️ БЕЗОПАСНОСТЬ: Content Sanitization
 * 
 * Текущая конфигурация предполагает, что весь MDX контент из доверенных источников
 * (content collections в src/content/). Astro автоматически экранирует HTML в Markdown.
 * 
 * Если в будущем планируется принимать контент от пользователей или из внешних источников:
 * 1. Используйте DOMPurify или серверный санитизатор перед рендерингом
 * 2. Отключите raw HTML в markdown (dangerouslySetHtml)
 * 3. Добавьте валидацию через Zod схемы для всех полей
 * 4. Рассмотрите использование rehype-sanitize плагина
 * 
 * См. также: https://docs.astro.build/en/guides/markdown-content/#security
 */

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
      // ⚠️ ВАЛИДАЦИЯ: Строковые slugs вместо reference() (экспериментальная фича)
      // Валидация битых ссылок выполняется в graph-integration.ts при генерации графа
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
      lang: z.enum(SUPPORTED_LOCALES).default(DEFAULT_LOCALE),
      heroImage: image().optional(),
      // ⚠️ ВАЛИДАЦИЯ: Строковые slugs вместо reference() (экспериментальная фича)
      // Валидация битых ссылок выполняется в graph-integration.ts при генерации графа
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
      // ⚠️ ВАЛИДАЦИЯ: Строковые slugs вместо reference() (экспериментальная фича)
      // Валидация битых ссылок выполняется в graph-integration.ts при генерации графа
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
