import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SUPPORTED_LOCALES, filterByLang, parseLeafBundleId, type Locale } from '@/utils/slugs';
import type { RSSFeedContext } from '@astrojs/rss';

export async function getStaticPaths() {
  return SUPPORTED_LOCALES.map(lang => ({
    params: { lang }
  }));
}

export async function GET(context: RSSFeedContext & { params: { lang: Locale } }) {
  const { lang } = context.params;
  const posts = await getCollection('blog');
  
  // Фильтруем посты по языку используя filterByLang для консистентности
  const localePosts = filterByLang(posts, lang)
    .filter(post => post.data.pubDate)
    .sort((a, b) => b.data.pubDate!.getTime() - a.data.pubDate!.getTime());
  
  // Переводы названий для разных языков
  const titles: Record<Locale, string> = {
    ru: 'Граф знаний - Блог',
    en: 'Knowledge Graph - Blog',
    de: 'Wissensgraph - Blog',
    tr: 'Bilgi Grafiği - Blog',
    'zh-cn': '知识图谱 - 博客',
    es: 'Grafo de Conocimiento - Blog',
    fr: 'Graphe de Connaissance - Blog',
    pt: 'Grafo de Conhecimento - Blog',
    it: 'Grafo della Conoscenza - Blog',
    ar: 'رسم بياني للمعرفة - مدونة',
  };
  
  const descriptions: Record<Locale, string> = {
    ru: 'Блог и материалы сайта',
    en: 'Blog and site materials',
    de: 'Blog und Website-Materialien',
    tr: 'Blog ve site materyalleri',
    'zh-cn': '博客和网站材料',
    es: 'Blog y materiales del sitio',
    fr: 'Blog et matériaux du site',
    pt: 'Blog e materiais do site',
    it: 'Blog e materiali del sito',
    ar: 'المدونة ومواد الموقع',
  };
  
  return rss({
    title: titles[lang] || titles.ru,
    description: descriptions[lang] || descriptions.ru,
    site: context.site || 'https://example.com',
    items: localePosts.map((post) => {
      const { slug } = parseLeafBundleId(post.id);
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: `/${lang}/blog/${slug}/`,
      };
    }),
    customData: `<language>${lang}</language>`,
  });
}
