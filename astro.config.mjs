import { defineConfig, envField } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import tailwindcss from '@tailwindcss/vite';
import remarkGfm from 'remark-gfm';
import rehypeExternalLinks from 'rehype-external-links';
// Astro поддерживает импорт .ts файлов напрямую
import { remarkExtractLinks } from './src/plugins/remark-extract-links.ts';
import graphIntegration from './src/integrations/graph-integration.ts';

// Используем env для site URL, fallback на example.com только для dev
const siteUrl = process.env.SITE_URL || 'https://example.com';

export default defineConfig({
  site: siteUrl,
  output: 'static',
  security: {
    checkOrigin: true,
  },
  integrations: [
    mdx(), 
    sitemap({
      // Исключить Stub-страницы (noindex) из sitemap
      // Фильтрация будет реализована через логику fallback routes
      // Stub страницы не генерируются как отдельные URL
      filter: (page) => {
        // Исключаем страницы, которые явно помечены как stub
        return !page.includes('/stub/');
      },
    }), 
    partytown(), 
    graphIntegration()
  ],
  vite: { 
    plugins: [tailwindcss()] 
  },
  markdown: {
    remarkPlugins: [remarkGfm, remarkExtractLinks],
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }]
    ],
  },
  env: {
    validateSecrets: true,
    schema: {
      SITE_URL: envField.string({ 
        context: 'client', 
        access: 'public',
        optional: true,
        default: 'https://example.com',
      }),
      WEB3FORMS_KEY: envField.string({ 
        context: 'server', 
        access: 'secret',
        optional: true,
        default: '',
      }),
      PUBLIC_WEB3FORMS_KEY: envField.string({ 
        context: 'client', 
        access: 'public',
        optional: true,
        default: '',
      }),
      PUBLIC_TWITTER_HANDLE: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        default: '@example',
      }),
    }
  }
});
