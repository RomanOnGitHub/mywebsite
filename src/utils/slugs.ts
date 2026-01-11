/**
 * Slug utilities для i18n с поддержкой Leaf Bundles и RTL
 * 
 * Leaf Bundle структура: slug/lang.mdx (например, "my-article/ru.mdx")
 */

export const SUPPORTED_LOCALES = ['ru', 'en', 'de', 'tr', 'zh-CN', 'es', 'fr', 'pt', 'it', 'ar'] as const;
export const RTL_LOCALES = ['ar'] as const;
export const DEFAULT_LOCALE = 'ru';

export type Locale = typeof SUPPORTED_LOCALES[number];

/**
 * Fallback список RTL языков для Firefox (который не поддерживает Intl.Locale.textInfo)
 */
const wellKnownRTL = ['ar', 'fa', 'he', 'prs', 'ps', 'syc', 'ug', 'ur'];

/**
 * Извлекает язык из slug
 * @param slug - slug вида "ru/blog/my-post" или "my-post/ru"
 * @returns Locale или undefined
 */
export function slugToLocale(slug: string): Locale | undefined {
  const first = slug.split('/')[0];
  return SUPPORTED_LOCALES.includes(first as Locale) ? first as Locale : undefined;
}

/**
 * Определяет направление текста (ltr/rtl) для локали
 * Использует Intl.Locale API с fallback на wellKnownRTL список
 * @param locale - код языка (например, "ar", "ru")
 * @returns 'ltr' | 'rtl'
 */
export function localeToDir(locale: string): 'ltr' | 'rtl' {
  if (RTL_LOCALES.includes(locale as any)) {
    return 'rtl';
  }
  
  try {
    const intlLocale = new Intl.Locale(locale);
    
    // V8-based environments (Chrome, Node)
    if ('textInfo' in intlLocale) {
      // @ts-expect-error - textInfo не типизирован, но доступен в v8
      return intlLocale.textInfo.direction;
    }
    
    // Some non-v8 environments
    if ('getTextInfo' in intlLocale) {
      // @ts-expect-error - getTextInfo не типизирован
      return intlLocale.getTextInfo().direction;
    }
  } catch {
    // Если Intl.Locale не поддерживается, используем fallback
  }
  
  // Firefox fallback
  return wellKnownRTL.includes(locale) ? 'rtl' : 'ltr';
}

/**
 * Конвертирует slug в другой язык
 * @param slug - текущий slug
 * @param targetLocale - целевой язык
 * @returns локализованный slug
 */
export function localizedSlug(slug: string, targetLocale: Locale): string {
  const current = slugToLocale(slug);
  if (current === targetLocale) return slug;
  if (current) return slug.replace(current + '/', targetLocale + '/');
  return targetLocale + '/' + slug;
}

/**
 * Парсит Leaf Bundle ID в slug и lang
 * @param id - ID вида "my-article/ru" (из коллекции)
 * @returns объект с slug и lang
 * @example
 * parseLeafBundleId("my-article/ru") // => { slug: "my-article", lang: "ru" }
 */
export function parseLeafBundleId(id: string): { slug: string; lang: Locale } {
  // id = "my-article/ru" → { slug: "my-article", lang: "ru" }
  const parts = id.split('/');
  const lang = parts.pop()! as Locale;
  const slug = parts.join('/');
  return { slug, lang };
}

/**
 * Конвертирует slug в route param (убирает index, нормализует)
 * @param slug - content collection slug
 * @returns param совместимый с Astro router
 */
export function slugToParam(slug: string): string | undefined {
  return slug === 'index' || slug === '' || slug === '/'
    ? undefined
    : (slug.endsWith('/index') ? slug.slice(0, -6) : slug).normalize();
}

/**
 * Конвертирует slug в pathname
 * @param slug - content collection slug
 * @returns URL pathname
 */
export function slugToPathname(slug: string): string {
  const param = slugToParam(slug);
  return param ? '/' + param + '/' : '/';
}
