import { defineConfig, envField } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import tailwindcss from '@tailwindcss/vite';
import remarkGfm from 'remark-gfm';
import rehypeExternalLinks from 'rehype-external-links';
import { remarkExtractLinks } from './src/plugins/remark-extract-links.ts';
import graphIntegration from './src/integrations/graph-integration.ts';

// Используем import.meta.env для единого источника правды (не process.env)
// В конфиге доступны только PUBLIC_* переменные через import.meta.env
const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'https://example.com';

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
      PUBLIC_SITE_URL: envField.string({ 
        context: 'client', 
        access: 'public',
        optional: true,
        default: 'https://example.com',
      }),
      // ⚠️ БЕЗОПАСНОСТЬ: WEB3FORMS_KEY - серверный секрет, НИКОГДА не попадает в клиентский bundle
      // Используется только на сервере (SSR) или в build-time для генерации статических страниц
      // Для клиентских форм используйте PUBLIC_WEB3FORMS_KEY
      WEB3FORMS_KEY: envField.string({ 
        context: 'server', 
        access: 'secret',
        optional: true,
        default: '',
      }),
      // ⚠️ БЕЗОПАСНОСТЬ: PUBLIC_WEB3FORMS_KEY - публичный ключ для клиентских форм
      // Этот ключ попадает в клиентский bundle, поэтому используйте отдельный публичный ключ
      // от Web3Forms (не тот же, что для серверных запросов)
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
