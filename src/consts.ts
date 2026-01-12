/**
 * Константы сайта
 * Используем env переменные с fallback на безопасные значения
 */

// SITE_URL должен быть установлен через env, fallback только для dev
export const SITE_URL = import.meta.env.SITE_URL || 
  (import.meta.env.PUBLIC_SITE_URL || 'https://example.com');

export const SITE_TITLE = 'Knowledge Graph Site';
export const SITE_DESCRIPTION = 'Система связей и граф знаний для исследования материалов';

// SEO
export const DEFAULT_OG_IMAGE = '/og/default.png';
// Twitter handle из env или fallback (не использовать в production без настройки)
export const TWITTER_HANDLE = import.meta.env.PUBLIC_TWITTER_HANDLE || '@example';

// Контент
export const POSTS_PER_PAGE = 10;
export const RECOMMENDATIONS_LIMIT = 5;
