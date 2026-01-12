# Аудит кодовой базы

Дата: 2025-01-XX
Проверка по правилам: `.cursor/codereviewrule-updated.mdc`

## Резюме

**Общий статус:** ✅ Хорошо (большинство критичных проверок пройдено)

**Критичные проблемы:** 0
**Высокий приоритет:** 2
**Средний приоритет:** 3
**Низкий приоритет:** 1

---

## ✅ Критичные категории (Пройдено)

### Config & Environment
- ✅ `astro.config.ts` - корректное расширение файла
- ✅ Используется `import.meta.env.PUBLIC_SITE_URL` (не `process.env`)
- ✅ Env schema определена корректно
- ✅ `validateSecrets: true` включен
- ✅ `SUPPORTED_LOCALES` определён как `as const` для `z.enum()`
- ✅ Единый источник правды: `PUBLIC_SITE_URL` используется везде

**Примечание:** `playwright.config.ts` использует `process.env.CI` - это допустимо для тестовых конфигов.

### Cross-Platform & Path Handling
- ✅ `graph-integration.ts` использует `process.cwd()` вместо `dir.pathname + '..'`
- ✅ `remark-extract-links.ts` нормализует пути к POSIX
- ✅ Используется `path.posix` для кроссплатформенных операций
- ✅ Нет относительных путей вверх (`../`)

### Error Handling & Robustness
- ✅ `graph-integration.ts`: Pagefind обёрнут в `try/catch` с обработчиком `spawn.on('error')`
- ✅ `graph-integration.ts`: fs операции обёрнуты в try/catch
- ✅ Graceful degradation для опциональных инструментов (Pagefind)

---

## ⚠️ Высокий приоритет

### 1. ✅ Исправлено: XSS защита в graph.astro

**Файл:** `src/pages/[lang]/graph.astro:963`

**Статус:** ✅ Исправлено - используется `escapeHtml(String(pixelRatio))`

**Текущий код:**
```typescript
modalContent.innerHTML = `
  ...
  Качество (pixel ratio): <span id="pixel-ratio-value">${escapeHtml(String(pixelRatio))}</span>
  ...
`;
```

**Примечание:** Проблема была исправлена в предыдущем кодревью. Проверка подтвердила, что `escapeHtml` используется корректно.

---

### 2. Обработка ошибок в fetch запросах

**Файлы:**
- `src/components/Backlinks.astro:34`
- `src/components/Recommendations.astro:41`
- `src/pages/[lang]/graph.astro:381, 1269`
- `src/components/Stub.astro:262`

**Проблема:** Fetch запросы не имеют timeout и полной обработки ошибок.

**Текущий код:**
```typescript
// src/components/Backlinks.astro:34
const res = await fetch(`/graph-data-${lang}.json`);
if (!res.ok) {
  console.warn(`Graph data not found for lang: ${lang}`);
  this.innerHTML = '';
  return;
}
```

**Ожидаемое поведение:**
- Добавить timeout для fetch запросов
- Обрабатывать network errors (не только HTTP errors)
- Логировать ошибки для отладки

**Severity:** High

---

### 3. Отсутствие Props интерфейса в некоторых страницах

**Файлы:**
- `src/pages/404.astro` - нет Props интерфейса (но это статическая страница)
- `src/pages/index.astro` - нет Props интерфейса (но это статическая страница)
- `src/pages/[lang]/graph.astro` - нет Props интерфейса

**Проблема:** Страница `graph.astro` использует динамические параметры, но не имеет Props интерфейса.

**Текущий код:**
```typescript
// src/pages/[lang]/graph.astro
// Нет interface Props
```

**Ожидаемое поведение:**
```typescript
interface Props {
  lang?: string;
}
```

**Severity:** High (для graph.astro), Low (для статических страниц)

---

## ⚠️ Средний приоритет

### 3. Отсутствие data-astro-prefetch на некоторых ссылках

**Файлы:**
- `src/pages/404.astro:75-86` - ссылки без `data-astro-prefetch`
- `src/pages/index.astro:87-150` - некоторые ссылки без `data-astro-prefetch`

**Проблема:** Не все основные навигационные ссылки имеют `data-astro-prefetch` для улучшения производительности.

**Текущий код:**
```astro
<a href={getLocalizedPath('', lang)}>
  {t.back}
</a>
```

**Ожидаемое поведение:**
```astro
<a href={getLocalizedPath('', lang)} data-astro-prefetch>
  {t.back}
</a>
```

**Severity:** Medium

---

### 4. Отсутствие обработки пустых состояний в некоторых компонентах

**Файлы:**
- `src/components/Backlinks.astro` - обрабатывает пустое состояние
- `src/components/Recommendations.astro` - обрабатывает пустое состояние
- `src/pages/[lang]/graph.astro` - нет явной обработки пустого состояния графа

**Проблема:** Граф может быть пустым, но нет явного UI для этого случая.

**Severity:** Medium

---

### 5. Использование import.meta.env.DEV вместо Astro.logger

**Файлы:**
- `src/pages/[lang]/graph.astro:407, 470, 477, 565, 578, 1139, 1271, 1278, 1300`

**Проблема:** Используется `import.meta.env.DEV` для условного логирования вместо `Astro.logger`.

**Текущий код:**
```typescript
if (import.meta.env.DEV) {
  console.error('Error loading graph data:', error);
}
```

**Ожидаемое поведение:**
Для клиентского кода это допустимо, но можно использовать более явный подход.

**Severity:** Medium (не критично, так как это клиентский код)

---

## ℹ️ Низкий приоритет

### 6. Комментарий в consts.ts упоминает SITE_URL

**Файл:** `src/consts.ts:6`

**Проблема:** Комментарий упоминает `SITE_URL или PUBLIC_SITE_URL`, но код использует только `PUBLIC_SITE_URL`.

**Текущий код:**
```typescript
/**
 * ⚠️ PRODUCTION: Обязательно настройте переменные окружения перед деплоем:
 * - SITE_URL или PUBLIC_SITE_URL - абсолютный URL сайта
 */
```

**Ожидаемое поведение:**
Обновить комментарий, чтобы упоминать только `PUBLIC_SITE_URL`.

**Severity:** Low

---

## ✅ Пройденные проверки

### Security
- ✅ User input экранируется через `escapeHtml()` в `Stub.astro`
- ✅ `innerHTML` в `graph.astro` использует `escapeHtml()` для `pixelRatio`
- ✅ External links имеют `rel: ['noopener', 'noreferrer']`
- ✅ CSRF protection включен (`security.checkOrigin: true`)
- ✅ Secrets правильно настроены (WEB3FORMS_KEY с `context: 'server'`)

### Performance
- ✅ Images используют `<Image />` из `astro:assets` (HeroImage.astro)
- ✅ Client libraries загружаются только на клиенте (force-graph)
- ✅ Используется `astro:page-load` для обновления при View Transitions
- ✅ `data-astro-prefetch` используется на основных ссылках

### Routing & Transitions
- ✅ `<ClientRouter />` используется в `BaseHead.astro`
- ✅ Client scripts используют `astro:page-load` (не DOMContentLoaded)
- ✅ View Transitions настроены корректно

### Content Collections
- ✅ Используется `loader: glob()`
- ✅ `reference()` используется для связей между коллекциями
- ✅ Leaf Bundle структура корректна
- ✅ `parseLeafBundleId()` используется везде

### Plugins & Integrations
- ✅ Path normalization реализована
- ✅ Index file handling (`/index.md`) реализовано
- ✅ Unresolved path logging реализовано
- ✅ External URL detection поддерживает все схемы

### Knowledge Graph System
- ✅ `graph-integration.ts` использует `astro:build:done` hook
- ✅ Генерация мультиязычных JSON файлов
- ✅ Валидация битых ссылок (explicit → error, outbound → warning)
- ✅ Legal коллекция исключена из графа
- ✅ Типизация Node и Edge (интерфейсы, не `any[]`)

---

## Рекомендации

### Приоритет 1 (Высокий)
1. Добавить timeout и полную обработку ошибок для всех fetch запросов
2. Добавить Props интерфейс для `src/pages/[lang]/graph.astro`

### Приоритет 2 (Средний)
3. Добавить `data-astro-prefetch` на все основные навигационные ссылки
4. Добавить явную обработку пустого состояния для графа
5. Рассмотреть использование более явного подхода для логирования в клиентском коде

### Приоритет 3 (Низкий)
6. Обновить комментарий в `consts.ts` для соответствия фактическому коду

---

## Заключение

Кодовая база в хорошем состоянии. Большинство критичных проверок пройдено. Основные области для улучшения:
- Обработка ошибок в fetch запросах
- Добавление Props интерфейсов для динамических страниц
- Улучшение производительности через prefetch

Все найденные проблемы не критичны и могут быть исправлены постепенно.
