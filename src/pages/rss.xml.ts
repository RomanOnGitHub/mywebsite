import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { DEFAULT_LOCALE, filterByLang, parseLeafBundleId } from '@/utils/slugs';
import type { RSSFeedContext } from '@astrojs/rss';

/**
 * Legacy RSS feed для обратной совместимости
 * Перенаправляет на локализованный фид для default locale
 * Рекомендуется использовать /rss-[lang].xml для конкретного языка
 */
export async function GET(context: RSSFeedContext) {
  const posts = await getCollection('blog');
  
  // Фильтруем посты по языку (используем default locale)
  // Используем filterByLang для консистентности с остальным кодом
  const localePosts = filterByLang(posts, DEFAULT_LOCALE)
    .filter(post => post.data.pubDate)
    .sort((a, b) => b.data.pubDate!.getTime() - a.data.pubDate!.getTime());
  
  return rss({
    title: 'Knowledge Graph Site',
    description: 'Блог и материалы сайта',
    site: context.site || 'https://example.com',
    items: localePosts.map((post) => {
      const { slug } = parseLeafBundleId(post.id);
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: `/${DEFAULT_LOCALE}/blog/${slug}/`,
      };
    }),
    customData: `<language>${DEFAULT_LOCALE}</language>`,
  });
}
