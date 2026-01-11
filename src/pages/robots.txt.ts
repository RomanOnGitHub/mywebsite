import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = site ? new URL('sitemap-index.xml', site) : '/sitemap-index.xml';
  
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${sitemapUrl.href}
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
