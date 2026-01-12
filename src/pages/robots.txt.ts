import type { APIRoute } from 'astro';
import { SUPPORTED_LOCALES } from '@/utils/slugs';

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site || 'https://example.com';
  const sitemapUrl = new URL('sitemap-index.xml', baseUrl);
  
  // Генерируем список RSS фидов для всех языков
  const rssFeeds = SUPPORTED_LOCALES.map(lang => {
    const rssUrl = new URL(`rss-${lang}.xml`, baseUrl);
    return `Sitemap: ${rssUrl.href}`;
  }).join('\n');
  
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${sitemapUrl.href}
${rssFeeds}
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
