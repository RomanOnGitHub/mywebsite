/**
 * Unit-тесты для remark-extract-links plugin
 * Проверяет кроссплатформенность (Windows + POSIX) и обработку различных URL
 */
import { describe, it, expect } from 'vitest';
import { remarkExtractLinks } from './remark-extract-links';
import type { Root } from 'mdast';
import type { VFile } from 'vfile';

// Создаём mock VFile
function createMockFile(filePath: string, links: string[] = []): VFile {
  const tree: Root = {
    type: 'root',
    children: links.map(url => ({
      type: 'link',
      url,
      children: [{ type: 'text', value: 'Link' }],
    })),
  } as Root;

  return {
    path: filePath,
    history: [filePath],
    data: {
      astro: {
        frontmatter: {},
      },
    },
  } as VFile;
}

describe('remark-extract-links', () => {
  describe('Кроссплатформенность путей', () => {
    it('должен обрабатывать POSIX пути (Linux/Mac)', () => {
      const file = createMockFile('src/content/blog/my-article/ru.mdx', [
        '../services/seo/',
        './related-post',
      ]);
      const tree = {
        type: 'root',
        children: [
          {
            type: 'link',
            url: '../services/seo/',
            children: [{ type: 'text', value: 'SEO' }],
          },
          {
            type: 'link',
            url: './related-post',
            children: [{ type: 'text', value: 'Related' }],
          },
        ],
      } as Root;

      remarkExtractLinks()(tree, file);

      expect(file.data.astro?.frontmatter?.outboundLinks).toContain('services/seo');
      expect(file.data.astro?.frontmatter?.outboundLinks).toContain('blog/related-post');
    });

    it('должен обрабатывать Windows пути', () => {
      // Windows путь с обратными слешами
      const file = createMockFile('src\\content\\blog\\my-article\\ru.mdx');
      const tree = {
        type: 'root',
        children: [
          {
            type: 'link',
            url: '../services/seo/',
            children: [{ type: 'text', value: 'SEO' }],
          },
          {
            type: 'link',
            url: './related-post',
            children: [{ type: 'text', value: 'Related' }],
          },
        ],
      } as Root;

      remarkExtractLinks()(tree, file);

      // Должны нормализоваться к POSIX
      expect(file.data.astro?.frontmatter?.outboundLinks).toContain('services/seo');
      expect(file.data.astro?.frontmatter?.outboundLinks).toContain('blog/related-post');
    });
  });

  describe('Обработка внешних URL', () => {
    it('должен пропускать http:// URLs', () => {
      const file = createMockFile('src/content/blog/post/ru.mdx');
      const tree = {
        type: 'root',
        children: [
          {
            type: 'link',
            url: 'http://example.com',
            children: [{ type: 'text', value: 'External' }],
          },
          {
            type: 'link',
            url: '/blog/internal',
            children: [{ type: 'text', value: 'Internal' }],
          },
        ],
      } as Root;

      remarkExtractLinks()(tree, file);

      expect(file.data.astro?.frontmatter?.outboundLinks).not.toContain('http://example.com');
      expect(file.data.astro?.frontmatter?.outboundLinks).toContain('blog/internal');
    });

    it('должен пропускать https:// URLs', () => {
      const file = createMockFile('src/content/blog/post/ru.mdx');
      const tree = {
        type: 'root',
        children: [
          {
            type: 'link',
            url: 'https://example.com/page',
            children: [{ type: 'text', value: 'External' }],
          },
        ],
      } as Root;

      remarkExtractLinks()(tree, file);

      expect(file.data.astro?.frontmatter?.outboundLinks).not.toContain('https://example.com');
    });

    it('должен пропускать protocol-relative URLs (//)', () => {
      const file = createMockFile('src/content/blog/post/ru.mdx');
      const tree = {
        type: 'root',
        children: [
          {
            type: 'link',
            url: '//example.com/page',
            children: [{ type: 'text', value: 'External' }],
          },
        ],
      } as Root;

      remarkExtractLinks()(tree, file);

      expect(file.data.astro?.frontmatter?.outboundLinks).not.toContain('//example.com');
    });

    it('должен пропускать mailto: URLs', () => {
      const file = createMockFile('src/content/blog/post/ru.mdx');
      const tree = {
        type: 'root',
        children: [
          {
            type: 'link',
            url: 'mailto:test@example.com',
            children: [{ type: 'text', value: 'Email' }],
          },
        ],
      } as Root;

      remarkExtractLinks()(tree, file);

      expect(file.data.astro?.frontmatter?.outboundLinks).not.toContain('mailto:');
    });

    it('должен пропускать tel: URLs', () => {
      const file = createMockFile('src/content/blog/post/ru.mdx');
      const tree = {
        type: 'root',
        children: [
          {
            type: 'link',
            url: 'tel:+1234567890',
            children: [{ type: 'text', value: 'Phone' }],
          },
        ],
      } as Root;

      remarkExtractLinks()(tree, file);

      expect(file.data.astro?.frontmatter?.outboundLinks).not.toContain('tel:');
    });
  });

  describe('Обработка фрагментов и query параметров', () => {
    it('должен удалять фрагменты (#section) из URL', () => {
      const file = createMockFile('src/content/blog/post/ru.mdx');
      const tree = {
        type: 'root',
        children: [
          {
            type: 'link',
            url: '/blog/article#section',
            children: [{ type: 'text', value: 'Link' }],
          },
        ],
      } as Root;

      remarkExtractLinks()(tree, file);

      expect(file.data.astro?.frontmatter?.outboundLinks).toContain('blog/article');
      expect(file.data.astro?.frontmatter?.outboundLinks).not.toContain('#section');
    });

    it('должен удалять query параметры (?param=value) из URL', () => {
      const file = createMockFile('src/content/blog/post/ru.mdx');
      const tree = {
        type: 'root',
        children: [
          {
            type: 'link',
            url: '/blog/article?utm=source',
            children: [{ type: 'text', value: 'Link' }],
          },
        ],
      } as Root;

      remarkExtractLinks()(tree, file);

      expect(file.data.astro?.frontmatter?.outboundLinks).toContain('blog/article');
      expect(file.data.astro?.frontmatter?.outboundLinks).not.toContain('?utm');
    });

    it('должен удалять и фрагменты, и query параметры', () => {
      const file = createMockFile('src/content/blog/post/ru.mdx');
      const tree = {
        type: 'root',
        children: [
          {
            type: 'link',
            url: '/blog/article?utm=source#section',
            children: [{ type: 'text', value: 'Link' }],
          },
        ],
      } as Root;

      remarkExtractLinks()(tree, file);

      expect(file.data.astro?.frontmatter?.outboundLinks).toContain('blog/article');
      expect(file.data.astro?.frontmatter?.outboundLinks).not.toContain('?');
      expect(file.data.astro?.frontmatter?.outboundLinks).not.toContain('#');
    });
  });

  describe('Обработка якорей', () => {
    it('должен пропускать якоря (только #)', () => {
      const file = createMockFile('src/content/blog/post/ru.mdx');
      const tree = {
        type: 'root',
        children: [
          {
            type: 'link',
            url: '#section',
            children: [{ type: 'text', value: 'Anchor' }],
          },
          {
            type: 'link',
            url: '/blog/article',
            children: [{ type: 'text', value: 'Link' }],
          },
        ],
      } as Root;

      remarkExtractLinks()(tree, file);

      expect(file.data.astro?.frontmatter?.outboundLinks).not.toContain('#section');
      expect(file.data.astro?.frontmatter?.outboundLinks).toContain('blog/article');
    });
  });

  describe('Обработка расширений файлов', () => {
    it('должен удалять .md расширения', () => {
      const file = createMockFile('src/content/blog/post/ru.mdx');
      const tree = {
        type: 'root',
        children: [
          {
            type: 'link',
            url: '/blog/article.md',
            children: [{ type: 'text', value: 'Link' }],
          },
        ],
      } as Root;

      remarkExtractLinks()(tree, file);

      expect(file.data.astro?.frontmatter?.outboundLinks).toContain('blog/article');
      expect(file.data.astro?.frontmatter?.outboundLinks).not.toContain('.md');
    });

    it('должен удалять .mdx расширения', () => {
      const file = createMockFile('src/content/blog/post/ru.mdx');
      const tree = {
        type: 'root',
        children: [
          {
            type: 'link',
            url: '/blog/article.mdx',
            children: [{ type: 'text', value: 'Link' }],
          },
        ],
      } as Root;

      remarkExtractLinks()(tree, file);

      expect(file.data.astro?.frontmatter?.outboundLinks).toContain('blog/article');
      expect(file.data.astro?.frontmatter?.outboundLinks).not.toContain('.mdx');
    });
  });

  describe('Сохранение существующих данных', () => {
    it('должен объединять с существующими outboundLinks', () => {
      const file = createMockFile('src/content/blog/post/ru.mdx');
      file.data.astro = {
        frontmatter: {
          outboundLinks: ['existing/link'],
        },
      };

      const tree = {
        type: 'root',
        children: [
          {
            type: 'link',
            url: '/blog/new-link',
            children: [{ type: 'text', value: 'New' }],
          },
        ],
      } as Root;

      remarkExtractLinks()(tree, file);

      expect(file.data.astro?.frontmatter?.outboundLinks).toContain('existing/link');
      expect(file.data.astro?.frontmatter?.outboundLinks).toContain('blog/new-link');
    });

    it('должен удалять дубликаты', () => {
      const file = createMockFile('src/content/blog/post/ru.mdx');
      const tree = {
        type: 'root',
        children: [
          {
            type: 'link',
            url: '/blog/article',
            children: [{ type: 'text', value: 'Link 1' }],
          },
          {
            type: 'link',
            url: '/blog/article',
            children: [{ type: 'text', value: 'Link 2' }],
          },
        ],
      } as Root;

      remarkExtractLinks()(tree, file);

      const links = file.data.astro?.frontmatter?.outboundLinks || [];
      const uniqueLinks = new Set(links);
      expect(links.length).toBe(uniqueLinks.size);
    });
  });
});
