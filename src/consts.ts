/**
 * Константы сайта
 * Используем env переменные с fallback на безопасные значения
 * 
 * ⚠️ PRODUCTION: Обязательно настройте переменные окружения перед деплоем:
 * - SITE_URL или PUBLIC_SITE_URL - абсолютный URL сайта (для OG tags, canonical, sitemap)
 * - PUBLIC_TWITTER_HANDLE - Twitter handle для Twitter Cards
 * 
 * Fallback значения ('https://example.com', '@example') используются только для разработки.
 * В production они приведут к некорректным мета-тегам и SEO проблемам.
 */

// SITE_URL должен быть установлен через env, fallback только для dev
// Используем только PUBLIC_SITE_URL для единого источника правды
export const SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'https://example.com';

export const SITE_TITLE = 'Knowledge Graph Site';
export const SITE_DESCRIPTION = 'Система связей и граф знаний для исследования материалов';

// SEO
export const DEFAULT_OG_IMAGE = '/og/default.png';
// Twitter handle из env или fallback
// ⚠️ PRODUCTION: Обязательно настройте PUBLIC_TWITTER_HANDLE в переменных окружения
export const TWITTER_HANDLE = import.meta.env.PUBLIC_TWITTER_HANDLE || '@example';

// Контент
export const POSTS_PER_PAGE = 10;
export const RECOMMENDATIONS_LIMIT = 5;
