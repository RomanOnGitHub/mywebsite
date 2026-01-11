import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/utils/slugs';

export async function GET(context: any) {
  const posts = await getCollection('blog');
  
  // Фильтруем посты по языку (используем default locale)
  const localePosts = posts.filter(post => {
    const id = post.id;
    const lang = id.split('/').pop()?.replace(/\.(md|mdx)$/, '');
    return lang === DEFAULT_LOCALE;
  });
  
  return rss({
    title: 'Knowledge Graph Site',
    description: 'Блог и материалы сайта',
    site: context.site || 'https://example.com',
    items: localePosts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/${DEFAULT_LOCALE}/blog/${post.id.split('/').slice(0, -1).join('/')}/`,
    })),
    customData: '<language>ru</language>',
  });
}
