import { visit } from 'unist-util-visit';
import type { Root, Link } from 'mdast';
import path from 'path';

/**
 * Резолвит относительный путь с учётом структуры Leaf Bundles.
 * 
 * Leaf Bundle: src/content/blog/my-article/ru.mdx
 * Ссылка: ../services/seo/
 * Результат: services/seo
 * 
 * @param filePath - путь к текущему файлу (src/content/blog/my-article/ru.mdx)
 * @param linkUrl - относительная ссылка (../services/seo/)
 */
function resolveLeafBundlePath(filePath: string, linkUrl: string): string {
  // filePath = "src/content/blog/my-article/ru.mdx"
  const fileDir = path.dirname(filePath);  // "src/content/blog/my-article"
  const parentDir = path.dirname(fileDir); // "src/content/blog"
  
  // Для Leaf Bundles: резолвим относительно ПАПКИ статьи
  // ../services/seo/ → относительно blog/, не my-article/
  const resolved = path.resolve(parentDir, linkUrl);
  
  // Извлекаем collection/slug
  const contentIndex = resolved.indexOf('/content/');
  if (contentIndex === -1) return '';
  
  const relativePath = resolved.slice(contentIndex + '/content/'.length);
  return relativePath.replace(/\/$/, '');
}

export function remarkExtractLinks() {
  return (tree: Root, file: any) => {
    const links: string[] = [];
    const filePath = file.history?.[0] || file.path || '';
    
    visit(tree, 'link', (node: Link) => {
      const url = node.url;
      
      // Пропускаем внешние, якоря, mailto
      if (url.startsWith('http') || url.startsWith('#') || url.startsWith('mailto:')) {
        return;
      }
      
      let resolved = url;
      
      // Относительные пути — резолвим с учётом Leaf Bundles
      if (url.startsWith('./') || url.startsWith('../')) {
        resolved = resolveLeafBundlePath(filePath, url);
      } else if (url.startsWith('/')) {
        // Абсолютные пути — убираем ведущий слеш
        resolved = url.slice(1).replace(/\/$/, '');
      }
      
      // Убираем trailing slash и расширение
      resolved = resolved.replace(/\/$/, '').replace(/\.(md|mdx)$/, '');
      
      if (resolved) links.push(resolved);
    });
    
    // Используем outboundLinks (терминология из ТЗ!)
    file.data.astro = file.data.astro || {};
    file.data.astro.frontmatter = file.data.astro.frontmatter || {};
    file.data.astro.frontmatter.outboundLinks = [...new Set(links)];
  };
}
