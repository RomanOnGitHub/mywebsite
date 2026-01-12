import { visit } from 'unist-util-visit';
import type { Root, Link } from 'mdast';
import type { VFile } from 'vfile';
import path from 'path';

/**
 * Нормализует путь к POSIX формату (для кроссплатформенности)
 * @param filePath - путь (может быть Windows или POSIX)
 * @returns POSIX путь
 */
function normalizeToPosix(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Проверяет, является ли URL внешним (http, https, protocol-relative, другие схемы)
 * @param url - URL для проверки
 * @returns true если внешний
 */
function isExternalUrl(url: string): boolean {
  // Проверяем протоколы: http://, https://, mailto:, tel:, data:, ftp:, и protocol-relative (//)
  return /^([a-z][a-z0-9+.-]*:|[/]{2})/i.test(url);
}

/**
 * Удаляет фрагменты (#section) и query параметры (?param=value) из URL
 * @param url - URL для очистки
 * @returns URL без фрагментов и query
 */
function stripFragmentAndQuery(url: string): string {
  // Удаляем всё после # или ?
  return url.split('#')[0].split('?')[0];
}

/**
 * Резолвит относительный путь с учётом структуры Leaf Bundles.
 * 
 * Leaf Bundle: src/content/blog/my-article/ru.mdx
 * Ссылка: ../services/seo/
 * Результат: services/seo
 * 
 * @param filePath - путь к текущему файлу (src/content/blog/my-article/ru.mdx)
 * @param linkUrl - относительная ссылка (../services/seo/)
 * @returns разрешённый путь или null если не удалось разрешить
 */
function resolveLeafBundlePath(filePath: string, linkUrl: string): string | null {
  // Нормализуем пути к POSIX для кроссплатформенности
  const normalizedFilePath = normalizeToPosix(filePath);
  
  // filePath = "src/content/blog/my-article/ru.mdx"
  const fileDir = path.posix.dirname(normalizedFilePath);  // "src/content/blog/my-article"
  const parentDir = path.posix.dirname(fileDir); // "src/content/blog"
  
  // Для Leaf Bundles: резолвим относительно ПАПКИ статьи
  // ../services/seo/ → относительно blog/, не my-article/
  const resolved = path.posix.resolve(parentDir, linkUrl);
  const normalizedResolved = normalizeToPosix(resolved);
  
  // Извлекаем collection/slug (используем POSIX разделитель)
  const contentIndex = normalizedResolved.indexOf('/content/');
  if (contentIndex === -1) {
    return null; // Не нашли /content/ - возвращаем null для явной обработки
  }
  
  const relativePath = normalizedResolved.slice(contentIndex + '/content/'.length);
  // Убираем trailing slash, удаляем index.md/index.mdx и расширения
  const cleaned = relativePath
    .replace(/\/$/, '') // Убираем trailing slash
    .replace(/\/index\.(md|mdx)$/, '') // Убираем /index.md или /index.mdx
    .replace(/\.(md|mdx)$/, ''); // Убираем расширения .md/.mdx
  return cleaned || null;
}

export function remarkExtractLinks() {
  return (tree: Root, file: VFile) => {
    const links: string[] = [];
    // Используем history[0] (исходный путь) или path, нормализуем к POSIX
    const filePath = file.history?.[0] || file.path || '';
    const normalizedFilePath = normalizeToPosix(filePath);
    
    visit(tree, 'link', (node: Link) => {
      let url = node.url;
      
      // Пропускаем внешние URL (http, https, protocol-relative, mailto, tel, data, ftp и т.д.)
      if (isExternalUrl(url)) {
        return;
      }
      
      // Пропускаем якоря (только #section)
      if (url.startsWith('#')) {
        return;
      }
      
      // Удаляем фрагменты и query параметры перед обработкой
      url = stripFragmentAndQuery(url);
      
      let resolved: string | null = null;
      
      // Относительные пути — резолвим с учётом Leaf Bundles
      if (url.startsWith('./') || url.startsWith('../')) {
        resolved = resolveLeafBundlePath(normalizedFilePath, url);
      } else if (url.startsWith('/')) {
        // Абсолютные пути — убираем ведущий слеш
        resolved = url.slice(1).replace(/\/$/, '');
      } else {
        // Относительные без ./ или ../ - обрабатываем как относительные
        resolved = resolveLeafBundlePath(normalizedFilePath, url);
      }
      
      if (resolved) {
        // Убираем trailing slash, удаляем index.md/index.mdx и расширения
        resolved = resolved
          .replace(/\/$/, '') // Убираем trailing slash
          .replace(/\/index\.(md|mdx)$/, '') // Убираем /index.md или /index.mdx
          .replace(/\.(md|mdx)$/, ''); // Убираем расширения .md/.mdx
        if (resolved) {
          links.push(resolved);
        }
      } else {
        // Логируем предупреждение о неразрешённых ссылках для CI/CD
        file.data.astro = file.data.astro || {};
        file.data.astro.frontmatter = file.data.astro.frontmatter || {};
        file.data.astro.frontmatter.linkWarnings = file.data.astro.frontmatter.linkWarnings || [];
        file.data.astro.frontmatter.linkWarnings.push({
          file: normalizedFilePath,
          original: node.url,
          reason: 'unresolved',
        });
      }
    });
    
    // Используем outboundLinks (терминология из ТЗ!)
    // Сохраняем существующую структуру frontmatter, если она есть
    file.data.astro = file.data.astro || {};
    file.data.astro.frontmatter = file.data.astro.frontmatter || {};
    // Объединяем с существующими ссылками (если есть) и убираем дубликаты
    const existingLinks = file.data.astro.frontmatter.outboundLinks || [];
    file.data.astro.frontmatter.outboundLinks = [...new Set([...existingLinks, ...links])];
  };
}
