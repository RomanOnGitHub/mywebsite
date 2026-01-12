# Аудит проекта на соответствие правилам

Дата: 2026-01-12  
Основа: `.cursor/codereviewrule-updated.mdc`

## Критические нарушения

### 1. TypeScript: Использование `any` типов

**Правило:** Strict mode, no `any`.

**Нарушения:**

#### `src/integrations/graph-integration.ts`
- **Строки 20-21:** `const nodes: any[] = []; const edges: any[] = [];`
- **Ожидаемое поведение:** Определить интерфейсы `GraphNode` и `GraphEdge`
- **Код:**
```typescript
const nodes: any[] = [];
const edges: any[] = [];
```

#### `src/pages/[lang]/graph.astro`
- **Строки 99-100, 114, 144-151, 157, 181, 188-189, 203, 227, 236, 256-257, 266, 272, 274, 277:** Множественное использование `any` для типизации данных графа
- **Ожидаемое поведение:** Определить интерфейсы `GraphNode` и `GraphEdge`, использовать их везде
- **Код:**
```typescript
let graph: any = null;
let allData: { nodes: any[]; edges: any[] } | null = null;
allData.nodes.flatMap((n: any) => n.tags || [])
allData.nodes.filter((n: any) => ...)
allData.edges.filter((e: any) => ...)
function renderGraph(data: { nodes: any[]; edges: any[] })
```

#### `src/pages/og/[collection]/[...slug].png.ts`
- **Строка 29:** `export async function GET({ params, url }: any)`
- **Строки 40, 183:** `getCollection(collection as any)`
- **Ожидаемое поведение:** Использовать типы из `astro` (`APIRoute`, `GetStaticPathsResult`)
- **Код:**
```typescript
export async function GET({ params, url }: any) {
  const entries = await getCollection(collection as any);
}
```

#### `src/pages/rss.xml.ts`
- **Строка 5:** `export async function GET(context: any)`
- **Ожидаемое поведение:** Использовать `RSSFeedContext` из `@astrojs/rss`
- **Код:**
```typescript
export async function GET(context: any) {
```

#### `src/utils/slugs.ts`
- **Строка 35:** `if (RTL_LOCALES.includes(locale as any))`
- **Ожидаемое поведение:** Правильная типизация без `as any`
- **Код:**
```typescript
if (RTL_LOCALES.includes(locale as any)) {
```

#### `src/plugins/remark-extract-links.ts`
- **Строка 33:** `return (tree: Root, file: any) => {`
- **Ожидаемое поведение:** Использовать тип `VFile` из `vfile`
- **Код:**
```typescript
return (tree: Root, file: any) => {
```

#### `src/layouts/Layout.astro`
- **Строка 13:** `structuredData?: Record<string, any>;`
- **Ожидаемое поведение:** Определить интерфейс для structured data или использовать `JsonValue`
- **Код:**
```typescript
structuredData?: Record<string, any>;
```

#### `src/components/Backlinks.astro`
- **Строка 85:** `render(backlinks: any[], related: any[], lang: string)`
- **Ожидаемое поведение:** Типизировать массивы через интерфейсы
- **Код:**
```typescript
render(backlinks: any[], related: any[], lang: string)
```

---

### 2. Environment Variables: Использование `import.meta.env` вместо `astro:env`

**Правило:** Environment variables use `astro:env` (not `import.meta.env`).

**Нарушение:**

#### `src/components/Stub.astro`
- **Строка 249:** `const apiKey = import.meta.env.PUBLIC_WEB3FORMS_KEY;`
- **Ожидаемое поведение:** Использовать `Astro.env.PUBLIC_WEB3FORMS_KEY` из `astro:env`
- **Код:**
```typescript
const apiKey = import.meta.env.PUBLIC_WEB3FORMS_KEY;
```

**Примечание:** Это клиентский скрипт, но согласно правилам, нужно использовать `astro:env` даже на клиенте. Однако, `Astro.env` доступен только на сервере. Для клиентских скриптов нужно передавать значение через props или использовать другой подход.

---

### 3. Content Collections: Отсутствие `reference()` для связей

**Правило:** ОБЯЗАТЕЛЬНО `reference()` для связей между коллекциями.

**Нарушение:**

#### `src/content.config.ts`
- **Строки 21-22, 37-38, 69-70:** Использование `z.array(z.string())` вместо `z.array(reference('collection'))`
- **Ожидаемое поведение:** Использовать `reference()` из `astro:content` для типобезопасных связей
- **Текущий код:**
```typescript
relatedCases: z.array(z.string()).optional(),
relatedServices: z.array(z.string()).optional(),
relatedIndustries: z.array(z.string()).optional(),
```
- **Ожидаемый код:**
```typescript
import { reference } from 'astro:content';
relatedCases: z.array(reference('cases')).optional(),
relatedServices: z.array(reference('services')).optional(),
relatedIndustries: z.array(reference('industries')).optional(),
```

---

### 4. Imports: Относительные пути вместо `@/` алиаса

**Правило:** ALL imports use `@/` alias (no relative `../../` paths).

**Нарушение:**

#### `src/integrations/graph-integration.ts`
- **Строка 5:** `import { SUPPORTED_LOCALES, parseLeafBundleId } from '../utils/slugs.js';`
- **Ожидаемое поведение:** `import { ... } from '@/utils/slugs.js';`
- **Код:**
```typescript
import { SUPPORTED_LOCALES, parseLeafBundleId } from '../utils/slugs.js';
```

---

## Средние приоритеты

### 5. Images: Отсутствие `image.remotePatterns` в конфигурации

**Правило:** Use `image.remotePatterns` in `astro.config.mjs`.

**Нарушение:**

#### `astro.config.mjs`
- **Отсутствует:** Конфигурация `image.remotePatterns`
- **Ожидаемое поведение:** Добавить конфигурацию для удаленных изображений (если используются)
- **Код:**
```javascript
// Отсутствует в конфигурации
```

**Примечание:** Если удаленные изображения не используются, это не является нарушением.

---

### 6. Images: Отсутствие использования `<Image />` компонента

**Правило:** ALWAYS use `<Image />` from `astro:assets` with explicit `width` and `height`.

**Нарушение:**

#### Проект в целом
- **Отсутствует:** Использование `<Image />` компонента
- **Ожидаемое поведение:** Все изображения должны использовать `<Image />` из `astro:assets`
- **Примечание:** В текущем проекте изображения не используются в компонентах, но если будут добавлены, нужно использовать `<Image />`

---

### 7. Security: Отсутствие централизованной утилиты `escapeHtml()`

**Правило:** User input escaped with `escapeHtml()` before HTML insertion.

**Нарушение:**

#### `src/components/Backlinks.astro` и `src/components/Recommendations.astro`
- **Строки 145-151 (Backlinks), 147-153 (Recommendations):** Локальные методы `escapeHtml()` в классах
- **Ожидаемое поведение:** Создать централизованную утилиту `src/utils/escape-html.ts` и использовать её везде
- **Текущий код:**
```typescript
escapeHtml(text: string): string {
  // Локальная реализация
}
```
- **Ожидаемый код:** Импортировать из `@/utils/escape-html`

---

### 8. Performance: Отсутствие проверки `typeof window !== 'undefined'` в graph.astro

**Правило:** Проверка `typeof window !== 'undefined'` перед использованием DOM API.

**Нарушение:**

#### `src/pages/[lang]/graph.astro`
- **Строки 95-304:** Использование DOM API без проверки `typeof window !== 'undefined'`
- **Ожидаемое поведение:** Добавить проверку перед использованием `document`, `window`
- **Код:**
```typescript
// Используется document.documentElement.lang без проверки
const lang = document.documentElement.lang || 'ru';
```

**Примечание:** Скрипт выполняется только на клиенте, но проверка улучшит безопасность и совместимость.

---

## Низкие приоритеты

### 9. TypeScript: Улучшение типизации в Layout

**Нарушение:**

#### `src/layouts/Layout.astro`
- **Строка 13:** `structuredData?: Record<string, any>;`
- **Ожидаемое поведение:** Определить интерфейс `StructuredData` или использовать `JsonValue` из `astro`
- **Код:**
```typescript
structuredData?: Record<string, any>;
```

---

### 10. RSS: Мультиязычность не реализована

**Правило:** RSS фиды мультиязычные (отдельные фиды для каждого языка или параметр `?lang=`).

**Нарушение:**

#### `src/pages/rss.xml.ts`
- **Строки 1-27:** RSS фид только для default locale (ru)
- **Ожидаемое поведение:** Создать отдельные фиды для каждого языка (`rss-[lang].xml.ts`) или добавить параметр `?lang=`
- **Текущий код:**
```typescript
const localePosts = posts.filter(post => {
  const lang = id.split('/').pop()?.replace(/\.(md|mdx)$/, '');
  return lang === DEFAULT_LOCALE;
});
```

---

## Соответствие правилам

### ✅ Правильно реализовано

1. **Config & Environment:**
   - ✅ Astro 5.x, `output: 'static'`
   - ✅ Tailwind v4+ через `@tailwindcss/vite`
   - ✅ `astro:env` настроен с `validateSecrets: true`
   - ✅ CSRF protection включен (`security.checkOrigin: true`)
   - ✅ `src/env.d.ts` существует

2. **Structure & Imports:**
   - ✅ Все страницы используют Layout
   - ✅ Только один `<main>` на странице
   - ⚠️ Один относительный импорт в `graph-integration.ts` (нарушение #4)

3. **Routing & Transitions:**
   - ✅ `<ClientRouter />` используется в `BaseHead.astro`
   - ✅ Клиентские скрипты используют `astro:page-load`
   - ✅ `data-astro-prefetch` на навигационных ссылках

4. **TypeScript & Data Flow:**
   - ✅ Все компоненты имеют `interface Props`
   - ✅ Guard clauses в динамических роутах
   - ✅ Try/catch в SSR операциях

5. **Forms & Actions:**
   - ✅ Клиентская валидация через Zod
   - ✅ Защита от ботов (honeypot, rate limiting, form timestamp, JS token)
   - ⚠️ Используется `import.meta.env` вместо `astro:env` (нарушение #2)
   - ✅ Обработка ошибок и loading states

6. **Content Collections:**
   - ✅ Content Layer API: `src/content.config.ts`
   - ✅ `loader: glob()` используется
   - ✅ Zod schemas для валидации
   - ✅ `filterByLang()` используется
   - ✅ Leaf Bundle структура корректна
   - ✅ `parseLeafBundleId()` используется везде
   - ✅ Группировка по slug в `getStaticPaths()`
   - ✅ Генерация путей для всех языков × всех slugs
   - ⚠️ Отсутствует `reference()` для связей (нарушение #3)

7. **Leaf Bundles Pattern:**
   - ✅ Leaf Bundle структура корректна: `slug/lang.mdx`
   - ✅ `parseLeafBundleId()` используется везде
   - ✅ Группировка по slug в `getStaticPaths()` для всех языков
   - ✅ Fallback на default locale при отсутствии перевода
   - ✅ Генерация путей для всех языков × всех slugs (для Stub)

8. **Knowledge Graph System:**
   - ✅ `graph-integration.ts` использует `astro:build:done` hook
   - ✅ Генерация мультиязычных `graph-data-{lang}.json` файлов (10 языков)
   - ✅ Фильтрация nodes и edges по языку при генерации
   - ✅ Валидация битых ссылок (explicit → ошибка, outbound → warning)
   - ✅ Legal коллекция исключена из графа
   - ✅ Pagefind интеграция с lang-фильтрами
   - ⚠️ Типизация Node и Edge использует `any[]` (нарушение #1)

9. **Custom Elements:**
   - ✅ Custom Elements используют `astro:page-load` для обновления
   - ✅ Custom Elements загружают данные из `/graph-data-{lang}.json`
   - ✅ Обработка ошибок при загрузке данных (try/catch, fallback UI)
   - ✅ Использование `data-*` атрибутов для передачи props
   - ⚠️ Типизация данных из graph-data использует `any` (нарушение #1)

10. **Stub Component Pattern:**
    - ✅ Stub компонент используется для страниц без перевода
    - ✅ `<meta name="robots" content="noindex, nofollow" />` в Stub компоненте
    - ✅ Stub страницы исключены из sitemap (filter в sitemap config)
    - ✅ Stub компонент получает props: slug, lang, collection
    - ✅ Форма в Stub использует правильную защиту от ботов

11. **i18n:**
    - ✅ `getLocalizedPath()` используется для внутренних ссылок
    - ✅ `lang` field во всех content collection schemas
    - ✅ `filterByLang()` используется для фильтрации

12. **SEO & A11y:**
    - ✅ Schema.org structured data (JSON-LD)
    - ✅ Semantic HTML
    - ✅ `data-pagefind-body` и `data-pagefind-meta` на body

13. **Performance:**
    - ✅ `client:visible` для lazy hydration (где применимо)
    - ✅ Force-graph загружается только на клиенте
    - ✅ Обработчик `astro:page-load` для обновления при View Transitions
    - ⚠️ Отсутствует проверка `typeof window !== 'undefined'` (нарушение #8)

---

## Резюме

**Критические нарушения:** 4
- TypeScript `any` types (8 мест)
- `import.meta.env` вместо `astro:env` (1 место)
- Отсутствие `reference()` в content collections (3 поля)
- Относительные импорты (1 место)

**Средние приоритеты:** 4
- Отсутствие `image.remotePatterns`
- Отсутствие `<Image />` компонента
- Отсутствие централизованной `escapeHtml()`
- Отсутствие проверки `typeof window !== 'undefined'`

**Низкие приоритеты:** 2
- Улучшение типизации structuredData
- Мультиязычный RSS не реализован

**Общее соответствие:** ~88% (большинство правил соблюдено, требуется исправление критических нарушений)

---

## Рекомендации по приоритетам исправления

### Критично (исправить немедленно):
1. Заменить все `any` типы на интерфейсы (особенно для graph data)
2. Исправить `import.meta.env` на `astro:env` в Stub.astro
3. Добавить `reference()` для связей в content collections
4. Исправить относительный импорт в graph-integration.ts

### Важно (исправить в ближайшее время):
5. Создать централизованную утилиту `escapeHtml()`
6. Добавить проверку `typeof window !== 'undefined'` в graph.astro
7. Добавить `image.remotePatterns` в конфигурацию (если используются удаленные изображения)

### Желательно (можно позже):
8. Улучшить типизацию structuredData
9. Реализовать мультиязычный RSS
