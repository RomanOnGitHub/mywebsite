# Pro Tips

Инсайты из анализа проектов и документации.

---

## 2026-01-10: Критические изменения в финальном плане

### ⚠️ Ошибка анализа: ClientRouter

**Было (неверно):** "ClientRouter не обязателен, prefetch достаточно"

**Стало (верно):** Для проекта с графом знаний ClientRouter **обязателен**

```astro
---
import { ClientRouter } from 'astro:transitions';
---
<head>
  <ClientRouter />
</head>
<body>
  <Sidebar transition:persist="sidebar" />
</body>
```

**Причина ошибки:** Анализировали паттерны из ScrewFast/Starlight без учёта core feature проекта — графа знаний. Для исследования связей через backlinks нужны View Transitions.

**Правило:** Core Feature First — см. `docs/ruleanalysis.md`

---

### Архитектурные решения

2. **reference() — экспериментальная фича, не использовать в production**
   ```typescript
   // ПЛОХО: экспериментально, не протестировано сообществом
   relatedCases: z.array(reference('cases')).optional(),

   // ХОРОШО: строковые slugs с валидацией в скрипте
   relatedCases: z.array(z.string()).optional(),
   ```
   **Суть:** Ни ScrewFast, ни Starlight не используют `reference()`. Риск битых ссылок без двусторонних связей.

3. **vis-network слишком тяжёлая для production**
   ```typescript
   // ПЛОХО: ~400KB
   import vis from 'vis-network/standalone';

   // ХОРОШО: альтернативы по весу
   // force-graph (~50KB) > d3-force (~30KB) > cytoscape (~300KB)
   ```
   **Суть:** Для графа знаний выбирай лёгкие библиотеки. vis-network — для прототипов.

4. **OG-изображения — динамическая генерация обязательна**
   ```typescript
   // ПЛОХО: статичные (как в ScrewFast)
   // ХОРОШО: satori + sharp
   import satori from 'satori';
   import sharp from 'sharp';
   ```
   **Суть:** Динамические OG лучше статичных для SEO и вовлечённости.

5. **Astro Integration для генерации graph-data.json**
   ```typescript
   export default function graphIntegration(): AstroIntegration {
     return {
       name: 'graph-integration',
       hooks: {
         'astro:build:done': async () => {
           // Генерация JSON после сборки
         },
       },
     };
   }
   ```
   **Суть:** Лучше pre-build скрипта. Официальный паттерн из astro-main/integration.

6. **Content Collections — использовать glob loader**
   ```typescript
   import { glob } from 'astro/loaders';

   const blog = defineCollection({
     loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
     schema: ({ image }) => z.object({
       pubDate: z.coerce.date(), // Автопреобразование строк в Date
       heroImage: image().optional(), // Типизированные метаданные
     }),
   });
   ```
   **Суть:** `glob()` — явный путь. `z.coerce.date()` — автоматическое преобразование. `image()` — типизация.

7. **Dark mode — blocking script в <head>**
   ```html
   <script is:inline>
     // Выполняется до рендера страницы
     const getThemePreference = () => {
       if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
         return localStorage.getItem('theme');
       }
       return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
     };
     // MutationObserver для персистентности
   </script>
   ```
   **Суть:** `is:inline` предотвращает FOUC. MutationObserver отслеживает изменения.

---

## 2026-01-10: Анализ официального репозитория Astro

### Ключевые находки из `astro-main/examples/`

1. **Content Collections с glob loader** (не просто defineCollection)
   ```typescript
   import { glob } from 'astro/loaders';
   
   const blog = defineCollection({
     loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
     // ...
   });
   ```
   **Суть:** Явный путь через `glob()` вместо неявного.

2. **z.coerce.date()** для дат в frontmatter
   ```typescript
   pubDate: z.coerce.date(),
   ```
   **Суть:** Автоматически преобразует строки в Date объекты.

3. **image()** функция для типизации изображений
   ```typescript
   schema: ({ image }) => z.object({
     heroImage: image().optional(),
   }),
   ```
   **Суть:** Получаешь типизированный ImageMetadata с src, width, height.

4. **Dark mode — blocking script**
   ```html
   <script is:inline>
     // Код в <head>, выполняется до рендера
   </script>
   ```
   **Суть:** `is:inline` + MutationObserver для персистентности.

5. **Astro Integration — шаблон для hooks**
   ```typescript
   import type { AstroIntegration } from 'astro';
   
   export default function myIntegration(): AstroIntegration {
     return {
       name: 'my-integration',
       hooks: {
         'astro:build:done': () => { /* генерация */ },
       },
     };
   }
   ```
   **Суть:** Лучше, чем pre-build скрипт для production.

6. **RSS — официальный паттерн**
   ```javascript
   import rss from '@astrojs/rss';
   
   export async function GET(context) {
     return rss({ site: context.site, items: [...] });
   }
   ```
   **Суть:** `context.site` вместо хардкода URL.

7. **Canonical URL — правильный способ**
   ```typescript
   const canonicalURL = new URL(Astro.url.pathname, Astro.site);
   ```
   **Суть:** Не `import.meta.env.SITE`, а `Astro.site`.

---

## Версии пакетов (январь 2026)

| Пакет | Версия | Источник |
|-------|--------|----------|
| astro | ^5.16.8 | astro-main/examples/blog |
| tailwindcss | ^4.1.18 | astro-main/examples/with-tailwindcss |
| @tailwindcss/vite | ^4.1.18 | astro-main/examples/with-tailwindcss |
| @astrojs/mdx | ^4.3.13 | astro-main/examples/blog |
| @astrojs/rss | ^4.0.14 | astro-main/examples/blog |
| @astrojs/sitemap | ^3.6.1 | astro-main/examples/blog |
| sharp | ^0.34.3 | astro-main/examples/blog |
| satori | ^0.12.0 | npm (не latest!) |
| force-graph | ^1.43.0 | npm |
| typescript | ~5.9.3 | astro-main/package.json |

---

## 2026-01-10: Критические архитектурные решения

### ⚠️ Требование к Node.js

**Обязательно:** Node.js ≥ 18.20.8

**Причина:** Astro 5.18.x не работает на более старых версиях  
**Источник:** astro.build/blog/astro-580

---

### ⚠️ Архитектурная ошибка: импорт graph-data.json

**Проблема:** Нельзя импортировать `dist/graph-data.json` напрямую — файл генерируется ПОСЛЕ компиляции компонентов.

**Неправильно:**
```typescript
// ❌ НЕВЕРНО — файл генерируется ПОСЛЕ сборки
import graphData from '../../dist/graph-data.json';
```

**Правильно (вариант 1 — генерация в public/):**
```typescript
// ✅ ВЕРНО — генерация в pre-render hook
hooks: {
  'astro:build:setup': async ({ vite, logger }) => {
    const graphData = await generateGraphData();
    await fs.writeFile('./public/graph-data.json', JSON.stringify(graphData));
  }
}
```

**Правильно (вариант 2 — динамическая загрузка):**
```astro
<script>
  const graphData = await fetch('/graph-data.json').then(r => r.json());
</script>
```

**Суть:** Build order критичен. Компоненты компилируются ДО `astro:build:done`, поэтому импорт не сработает.

---

### ⚠️ transition:persist с динамическим контентом

**Проблема:** `transition:persist` сохраняет DOM-элемент "как есть", но backlinks зависят от текущего slug страницы.

**Решение:**
```astro
<aside transition:persist="sidebar">
  <Backlinks slug={slug} client:load />
</aside>

<script>
  // Обновляем backlinks при навигации
  document.addEventListener('astro:page-load', () => {
    const slug = window.location.pathname.split('/').pop();
    // Обновляем компонент
  });
</script>
```

**Суть:** Для динамического контента в persist-элементах нужен механизм обновления через `astro:page-load`.

---

### ⚠️ satori требует конкретную версию

**Проблема:** `"satori": "latest"` — плохая практика, может сломать сборку.

**Правильно:**
```json
"satori": "^0.12.0"
```

**Суть:** Всегда фиксируй версии зависимостей, особенно для build-time генерации.

---

### ⚠️ OG-генерация требует обработки ошибок

**Проблема:** satori требует массив fonts (не пустой), отсутствует fallback при ошибке.

**Правильно:**
```typescript
export const GET: APIRoute = async ({ props }) => {
  try {
    const { title, description } = props;
    
    // Загрузка шрифта (обязательно!)
    const fontData = await fetch('https://..../Inter.ttf').then(r => r.arrayBuffer());
    
    const svg = await satori(/* ... */, {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Inter', data: fontData, style: 'normal' }]
    });
    
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return new Response(png, { headers: { 'Content-Type': 'image/png' } });
  } catch (error) {
    // Fallback — статическое изображение
    const fallback = await fs.readFile('./public/og-default.png');
    return new Response(fallback, { headers: { 'Content-Type': 'image/png' } });
  }
};
```

**Суть:** Всегда добавляй try/catch и fallback для build-time генерации изображений.

---

### ⚡ Рекомендация: разделить Pagefind в отдельную интеграцию

**Проблема:** Смешение ответственностей (SRP violation) — graph-integration делает и граф, и Pagefind.

**Рекомендация:**
```typescript
// src/integrations/pagefind-integration.ts
export default function pagefindIntegration(): AstroIntegration {
  return {
    name: 'pagefind-integration',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        logger.info('Running Pagefind...');
        // ... spawn pagefind
      }
    }
  };
}
```

**Суть:** Разделение ответственностей упрощает тестирование и поддержку.

---

## 2026-01-11: Справочник по примерам кода

### ⚠️ Sites_reference.md — критически важен для разработки

**Проблема:** Удалил `Sites_reference.md`, думая, что он устарел из-за переноса `sites/` в `.local/`.

**Исправление:** Восстановлен с обновлёнными путями.

**Важность:**
- `Sites_reference.md` — единственный справочник, который показывает, **где искать примеры кода** для каждой задачи
- Без него разработчик не знает, в каком файле какого примера искать нужный паттерн
- Все пути обновлены: `sites/` → `.local/sites/`

**Структура:**
- Референсы для каждого блока задач (A, B, C, D, E, F)
- Конкретные пути к файлам с примерами
- Приоритеты копирования кода (высший/средний/низкий)

**Суть:** Справочники по примерам кода нужно сохранять, даже если исходные файлы переносятся. Обновляй пути, н