# Конкретные рекомендации по обновлению codereviewrule.mdc

## Резюме анализа

**Текущее состояние:** Правила покрывают ~70% специфики проекта. Отсутствуют проверки для:
- Leaf Bundles паттерна
- Knowledge Graph системы
- Custom Elements
- Static site forms (Web3Forms)
- Stub компонента

**Рекомендация:** Добавить проект-специфичные секции и модифицировать существующие.

---

## Конкретные изменения

### 1. Добавить после секции "Content Collections" (строка 66)

**Вставить после:**
```markdown
- [ ] filterByLang() used for i18n content filtering
```

**Добавить:**
```markdown
- [ ] Leaf Bundle структура: `slug/lang.mdx` (например, `my-article/ru.mdx`)
- [ ] Использование `parseLeafBundleId()` для парсинга ID из коллекций
- [ ] Группировка по slug в `getStaticPaths()` для всех языков
- [ ] Генерация путей для ВСЕХ языков × ВСЕХ slugs (даже без перевода для Stub)
- [ ] Fallback на default locale при отсутствии перевода
```

---

### 2. Добавить новую секцию после "Content Collections"

**Вставить после секции "Content Collections" (после строки 66):**

```markdown
### Leaf Bundles Pattern (Project-Specific)
- [ ] Leaf Bundle структура корректна: `slug/lang.mdx` в файловой системе
- [ ] `parseLeafBundleId()` используется везде для парсинга ID
- [ ] Группировка по slug в `getStaticPaths()` для всех языков
- [ ] Fallback на default locale при отсутствии перевода
- [ ] Генерация путей для ВСЕХ языков × ВСЕХ slugs (для Stub компонента)

### Knowledge Graph System (Project-Specific)
- [ ] graph-integration.ts использует `astro:build:done` hook
- [ ] Генерация мультиязычных `graph-data-{lang}.json` файлов (10 языков)
- [ ] Фильтрация nodes и edges по языку при генерации
- [ ] Валидация битых ссылок (explicit edges → ошибка, outbound → warning)
- [ ] Legal коллекция явно исключена из графа (только blog, cases, services, industries)
- [ ] Типизация Node и Edge (не `any[]`, использовать интерфейсы)
- [ ] Pagefind интеграция с lang-фильтрами (`--glob` для всех языков)
- [ ] Использование `parseLeafBundleId()` для парсинга ID в графе

### Custom Elements (Project-Specific)
- [ ] Custom Elements используют `astro:page-load` для обновления при View Transitions
- [ ] Custom Elements загружают данные из `/graph-data-{lang}.json`
- [ ] Обработка ошибок при загрузке данных (try/catch, fallback UI)
- [ ] Использование `data-*` атрибутов для передачи props
- [ ] Правильная типизация данных из graph-data (не `any`)
```

---

### 3. Модифицировать секцию "Forms & Actions" (строка 44)

**Заменить:**
```markdown
### Forms & Actions
- [ ] Forms use Astro Actions (astro:actions), not API routes
- [ ] Actions defined in src/actions/index.ts with Zod schemas (astro:schema)
- [ ] Client-side checks isInputError for validation errors
- [ ] Manual redirects after successful submission (cookie-redirects removed)
```

**На:**
```markdown
### Forms & Actions
- [ ] Forms use Astro Actions (astro:actions), not API routes
  - **ИСКЛЮЧЕНИЕ для static sites (`output: 'static'`):** Допустимо использование внешних API (Web3Forms) с:
    - [ ] Клиентской валидацией через Zod
    - [ ] Защитой от ботов (honeypot, rate limiting, form timestamp, JS token)
    - [ ] Использованием `astro:env` для API ключей (не `import.meta.env`)
    - [ ] Обработкой ошибок и loading states
- [ ] Actions defined in src/actions/index.ts with Zod schemas (astro:schema) - только для SSR
- [ ] Client-side checks isInputError for validation errors - только для Actions
- [ ] Manual redirects after successful submission (cookie-redirects removed)
```

---

### 4. Добавить в секцию "Performance" (после строки 58)

**Добавить после:**
```markdown
- [ ] font-display: swap in @font-face, critical fonts preloaded
```

**Новую строку:**
```markdown
- [ ] Client libraries (force-graph, d3-force) загружаются только на клиенте
- [ ] Проверка `typeof window !== 'undefined'` перед использованием DOM API
- [ ] Обработчик `astro:page-load` для обновления клиентских библиотек при View Transitions
```

---

### 5. Добавить новую секцию после "Performance"

**Вставить после секции "Performance" (после строки 59):**

```markdown
### Stub Component Pattern (Project-Specific)
- [ ] Stub компонент используется для страниц без перевода
- [ ] `<meta name="robots" content="noindex, nofollow" />` в Stub компоненте
- [ ] Stub страницы исключены из sitemap (filter в sitemap config)
- [ ] Stub компонент получает props: slug, lang, collection
- [ ] Форма в Stub использует правильную защиту от ботов
```

---

### 6. Расширить Gap Analysis в Stage 2 (строка 108)

**Добавить в список "What did you miss?":**

После строки 113 добавить:
```markdown
   - [ ] Leaf Bundle паттерн корректность (parseLeafBundleId, группировка в getStaticPaths)
   - [ ] Graph data типизация (Node, Edge интерфейсы вместо any[])
   - [ ] Custom Elements обновление при View Transitions (astro:page-load)
   - [ ] Stub компонент исключение из sitemap
   - [ ] Мультиязычный RSS (отдельные фиды или параметр ?lang=)
   - [ ] Pagefind интеграция корректность (lang-фильтры, glob pattern)
   - [ ] Force-graph клиентская загрузка (избегание window is not defined)
```

---

### 7. Добавить в секцию "RSS & Feeds" (если отсутствует)

**Добавить новую секцию после "SEO & A11y":**

```markdown
### RSS & Feeds
- [ ] RSS фиды мультиязычные (отдельные фиды для каждого языка или параметр `?lang=`)
- [ ] Фильтрация постов по языку в RSS
- [ ] Правильные ссылки с языковыми префиксами в RSS items
- [ ] Использование `filterByLang()` для фильтрации контента
```

---

## Приоритет внедрения

### Критично (внедрить немедленно):
1. ✅ Leaf Bundles Pattern секция
2. ✅ Knowledge Graph System секция
3. ✅ Модификация Forms & Actions (исключение для static)
4. ✅ Custom Elements секция

### Важно (внедрить в ближайшее время):
5. ✅ Stub Component Pattern секция
6. ✅ Расширение Performance секции
7. ✅ Расширение Gap Analysis

### Желательно (можно позже):
8. RSS & Feeds секция
9. Дополнительные примеры в комментариях

---

## Пример обновлённой структуры

После изменений структура Stage 1 будет:

```
### Config & Environment
### Structure & Imports
### Routing & Transitions
### TypeScript & Data Flow
### Forms & Actions (обновлено)
### Security
### Performance (расширено)
### Content Collections (расширено)
### Leaf Bundles Pattern (НОВОЕ)
### Knowledge Graph System (НОВОЕ)
### Custom Elements (НОВОЕ)
### Stub Component Pattern (НОВОЕ)
### i18n
### SEO & A11y
### RSS & Feeds (НОВОЕ)
### Deprecations & v6 Readiness
```

---

## Дополнительные рекомендации

### 1. Добавить примеры кода

В комментариях к правилам добавить примеры:

```markdown
<!-- Пример Leaf Bundle структуры -->
<!-- src/content/blog/my-article/ru.mdx -->
<!-- src/content/blog/my-article/en.mdx -->

<!-- Пример parseLeafBundleId -->
<!-- parseLeafBundleId("my-article/ru") → { slug: "my-article", lang: "ru" } -->

<!-- Пример graph-integration -->
<!-- Генерация graph-data-{lang}.json для каждого языка -->
```

### 2. Уточнить проверку reference()

В секции "Content Collections" уточнить:

```markdown
- [ ] ОБЯЗАТЕЛЬНО `reference()` для связей между коллекциями (не z.string())
- [ ] Использование `reference('cases')`, `reference('services')` и т.д.
```

### 3. Добавить проверку мультиязычности

В секции "Knowledge Graph System" добавить:

```markdown
- [ ] Генерация 10 файлов `graph-data-{lang}.json` (по одному на язык)
- [ ] Фильтрация nodes по `lang` при генерации
- [ ] Фильтрация edges по языку узлов (from и to должны быть одного языка)
```

---

## Итоговая оценка

**Текущее покрытие:** ~70%  
**После обновления:** ~95%

**Критические пробелы закрыты:** ✅  
**Проект-специфичные правила добавлены:** ✅  
**Исключения для static sites документированы:** ✅
