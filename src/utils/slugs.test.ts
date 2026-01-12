import { describe, it, expect } from 'vitest';
import {
  slugToLocale,
  localeToDir,
  localizedSlug,
  parseLeafBundleId,
  filterByLang,
  getLocalizedPath,
  SUPPORTED_LOCALES,
  RTL_LOCALES,
} from './slugs';

describe('slugs utilities', () => {
  describe('slugToLocale', () => {
    it('should extract locale from slug with prefix', () => {
      expect(slugToLocale('ru/blog/my-post')).toBe('ru');
      expect(slugToLocale('en/cases/test')).toBe('en');
    });

    it('should return undefined for invalid locale', () => {
      expect(slugToLocale('invalid/blog/post')).toBeUndefined();
      expect(slugToLocale('blog/my-post')).toBeUndefined();
    });
  });

  describe('localeToDir', () => {
    it('should return rtl for RTL locales', () => {
      expect(localeToDir('ar')).toBe('rtl');
    });

    it('should return ltr for LTR locales', () => {
      expect(localeToDir('ru')).toBe('ltr');
      expect(localeToDir('en')).toBe('ltr');
      expect(localeToDir('de')).toBe('ltr');
    });
  });

  describe('localizedSlug', () => {
    it('should convert slug to target locale', () => {
      expect(localizedSlug('ru/blog/my-post', 'en')).toBe('en/blog/my-post');
      expect(localizedSlug('en/cases/test', 'ru')).toBe('ru/cases/test');
    });

    it('should return same slug if locale matches', () => {
      expect(localizedSlug('ru/blog/my-post', 'ru')).toBe('ru/blog/my-post');
    });

    it('should add locale prefix if not present', () => {
      expect(localizedSlug('blog/my-post', 'ru')).toBe('ru/blog/my-post');
    });
  });

  describe('parseLeafBundleId', () => {
    it('should parse Leaf Bundle ID correctly', () => {
      expect(parseLeafBundleId('my-article/ru')).toEqual({
        slug: 'my-article',
        lang: 'ru',
      });
      expect(parseLeafBundleId('blog/my-post/en')).toEqual({
        slug: 'blog/my-post',
        lang: 'en',
      });
    });
  });

  describe('filterByLang', () => {
    it('should filter items by lang from data.lang', () => {
      const items = [
        { id: 'post1/ru', data: { lang: 'ru' as const } },
        { id: 'post2/en', data: { lang: 'en' as const } },
        { id: 'post3/ru', data: { lang: 'ru' as const } },
      ];

      const filtered = filterByLang(items, 'ru');
      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe('post1/ru');
      expect(filtered[1].id).toBe('post3/ru');
    });

    it('should filter items by lang from ID if data.lang not available', () => {
      const items = [
        { id: 'post1/ru' },
        { id: 'post2/en' },
        { id: 'post3/ru' },
      ];

      const filtered = filterByLang(items, 'ru');
      expect(filtered).toHaveLength(2);
    });
  });

  describe('getLocalizedPath', () => {
    it('should create localized path with lang prefix', () => {
      expect(getLocalizedPath('blog/my-post', 'ru')).toBe('/ru/blog/my-post/');
      expect(getLocalizedPath('graph/', 'en')).toBe('/en/graph/');
    });

    it('should handle empty path', () => {
      expect(getLocalizedPath('', 'ru')).toBe('/ru/');
      expect(getLocalizedPath('/', 'en')).toBe('/en/');
    });

    it('should normalize path slashes', () => {
      expect(getLocalizedPath('/blog/my-post/', 'ru')).toBe('/ru/blog/my-post/');
      expect(getLocalizedPath('blog/my-post', 'en')).toBe('/en/blog/my-post/');
    });
  });
});
