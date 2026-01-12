# Рекомендации по обновлению codereviewrule.mdc

Дата: 2026-01-12  
Анализ: Сравнение текущих правил с спецификой проекта

## Анализ текущего состояния

### ✅ Что уже покрыто правилами

1. **Базовые Astro 5.x правила** - полностью покрыты
2. **TypeScript & Data Flow** - покрыты
3. **Content Collections** - покрыты (но нужно дополнить для Leaf Bundles)
4. **i18n** - покрыты базовые правила
5. **Forms & Actions** - покрыты, но нужно добавить исключение для static sites

### ❌ Что отсутствует и нужно добавить

## Критические дополнения

### 1. Leaf Bundles Pattern (КРИТИЧЕСКИ ВАЖНО для проекта)

**Проблема:** Проект использует Leaf Bundles паттерн (`slug/lang.mdx`), но правила не проверяют корректность его использования.

**Что добавить в Stage 1:**

```markdown
### Content Collections - Leaf Bundles
- [ ] Leaf Bundle структура: `slug/lang.mdx` (например, `my-article/ru.mdx`)
- [ ] Использование `parseLeafBundleId()` для парсинга ID из коллекций
- [ ] Группировка по slug в `getStaticPaths()` для всех языков
- [ ] Fallback на default locale при отсутствии перевода
- [ ] Генерация путей для ВСЕХ языков × ВСЕХ slugs (даже без перевода для Stub)
- [ ] Использование `filterByLang()` для фильтрации коллекций
- [ ] Правильная обработка Leaf Bundle ID в graph-integration
```

**Где проверить:**
- `src/pages/[lang]/blog/[...slug].astro` и аналогичные страницы
- `src/integrations/graph-integration.ts`
- `src/utils/slugs.ts` (функция `parseLeafBundleId`)
- `src/content.config.ts` (pattern должен включать все языки)

---

### 2. Knowledge Graph Integration

**Проблема:** Проект имеет специфичную graph-integration, но правила не проверяют её корректность.

**Что добавить в Stage 1:**

```markdown
### Knowledge Graph System
- [ ] graph-integration.ts использует `astro:build:done` hook
- [ ] Генерация мультиязычных `graph-data-{lang}.json` файлов (10 языков)
- [ ] Фильтрация nodes и edges по языку при генерации
- [ ] Валидация битых ссылок (explicit edges → ошибка, outbound → warning)
- [ ] Legal коллекция исключена из графа (только blog, cases, services, industries)
- [ ] Использование `parseLeafBundleId()` для парсинга ID в графе
- [ ] Типизация Node и Edge (не `any[]`)
- [ ] Pagefind интеграция с lang-фильтрами (`--glob` для всех языков)
```

**Где проверить:**
- `src/integrations/graph-integration.ts`
- `public/graph-data-*.json` файлы (должно быть 10 файлов)
- `src/pages/[lang]/graph.astro` (клиентская загрузка графа)
- `src/components/Backlinks.astro` и `Recommendations.astro` (использование графа)

---

### 3. Custom Elements для клиентских компонентов

**Проблема:** Проект использует Custom Elements для Backlinks и Recommendations, но правила не проверяют их корректность.

**Что добавить в Stage 1:**

```markdown
### Client Components - Custom Elements
- [ ] Custom Elements используют `astro:page-load` для обновления при View Transitions
- [ ] Custom Elements загружают данные из `/graph-data-{lang}.json`
- [ ] Обработка ошибок при загрузке данных (try/catch, fallback UI)
- [ ] Использование `data-*` атрибутов для передачи props в Custom Elements
- [ ] Правильная типизация данных из graph-data (не `any`)
```

**Где проверить:**
- `src/components/Backlinks.astro`
- `src/components/Recommendations.astro`

---

### 4. Forms в Static Mode (исключение для Web3Forms)

**Проблема:** Правила требуют Astro Actions, но проект использует static mode и Web3Forms API.

**Что модифицировать в Stage 1:**

```markdown
### Forms & Actions
- [ ] Forms use Astro Actions (astro:actions), not API routes
  - **ИСКЛЮЧЕНИЕ:** Для static sites (`output: 'static'`) допустимо использование внешних API (Web3Forms) с клиентской валидацией
  - **Требования для исключения:**
    - [ ] Клиентская валидация через Zod
    - [ ] Защита от ботов (honeypot, rate limiting, form timestamp, JS token)
    - [ ] Использование `astro:env` для API ключей (не `import.meta.env`)
    - [ ] Обработка ошибок и loading states
- [ ] Actions defined in src/actions/index.ts with Zod schemas (astro:schema) - только для SSR
- [ ] Client-side checks isInputError for validation errors - только для Actions
- [ ] Manual redirects after successful submission (cookie-redirects removed)
```

**Где проверить:**
- `src/components/Stub.astro` (форма запроса перевода)
- `src/utils/form-validation.ts` (Zod схемы)
- `src/utils/form-protection.ts` (защита от ботов)

---

### 5. Stub Component Pattern

**Проблема:** Проект использует Stub компонент для непереведённого контента, но правила не проверяют его корректность.

**Что добавить в Stage 1:**

```markdown
### Stub Component Pattern
- [ ] Stub компонент используется для страниц без перевода
- [ ] `<meta name="robots" content="noindex, nofollow" />` в Stub компоненте
- [ ] Stub страницы исключены из sitemap (filter в sitemap config)
- [ ] Stub компонент получает props: slug, lang, collection
- [ ] Форма в Stub использует правильную защиту от ботов
```

**Где проверить:**
- `src/components/Stub.astro`
- `astro.config.mjs` (sitemap filter)
- Динамические страницы (blog, cases, services, industries, legal)

---

### 6. Force-Graph клиентская загрузка

**Проблема:** Правила не проверяют корректность загрузки библиотек, требующих DOM/Window.

**Что добавить в Stage 1:**

```markdown
### Performance - Client Libraries
- [ ] Библиотеки, требующие DOM/Window (force-graph, d3-force), загружаются только на клиенте
- [ ] Использование `<script>` или `client:only` для избежания ошибок `window is not defined`
- [ ] Проверка `typeof window !== 'undefined'` перед использованием DOM API
- [ ] Обработчик `astro:page-load` для обновления при View Transitions
```

**Где проверить:**
- `src/pages/[lang]/graph.astro`

---

## Средние дополнения

### 7. Мультиязычный RSS

**Проблема:** Правила не проверяют мультиязычность RSS фидов.

**Что добавить в Stage 1:**

```markdown
### RSS & Feeds
- [ ] RSS фиды мультиязычные (отдельные фиды для каждого языка или параметр `?lang=`)
- [ ] Фильтрация постов по языку в RSS
- [ ] Правильные ссылки с языковыми префиксами в RSS items
```

**Где проверить:**
- `src/pages/rss.xml.ts` (или `rss-[lang].xml.ts`)

---

### 8. Graph Data типизация

**Проблема:** Правила проверяют `any` типы, но не специфично для graph data.

**Что добавить в Gap Analysis (Stage 2):**

```markdown
1. What did you miss?
   - [ ] Graph data типизация (Node, Edge интерфейсы)
   - [ ] Типизация Custom Elements props (data-* атрибуты)
   - [ ] Типизация graph-integration (nodes, edges массивы)
```

---

### 9. Pagefind интеграция

**Проблема:** Правила не проверяют корректность Pagefind интеграции.

**Что добавить в Stage 1:**

```markdown
### Search & Pagefind
- [ ] Pagefind запускается в graph-integration после генерации графа
- [ ] `data-pagefind-body` и `data-pagefind-meta="lang:{lang}"` на body
- [ ] Pagefind `--glob` включает все языки
- [ ] Логирование результатов Pagefind (языки, страницы, слова)
```

**Где проверить:**
- `src/integrations/graph-integration.ts`
- `src/layouts/Layout.astro` (data-pagefind атрибуты)

---

## Низкие дополнения

### 10. Тестирование

**Проблема:** Правила не проверяют наличие тестов.

**Что добавить в Stage 1 (опционально):**

```markdown
### Testing
- [ ] Unit-тесты для утилит (Vitest)
- [ ] E2E-тесты для критичных компонентов (Playwright)
- [ ] Тесты покрывают: slugs, form-validation, form-protection
- [ ] E2E тесты для: View Transitions, граф, формы
```

---

## Рекомендуемые изменения в codereviewrule.mdc

### Изменение 1: Добавить секцию "Project-Specific Features"

После секции "Content Collections" добавить:

```markdown
### Leaf Bundles Pattern (Project-Specific)
- [ ] Leaf Bundle структура: `slug/lang.mdx` используется корректно
- [ ] `parseLeafBundleId()` используется для парсинга ID
- [ ] Группировка по slug в `getStaticPaths()` для всех языков
- [ ] Fallback на default locale при отсутствии перевода
- [ ] Генерация путей для ВСЕХ языков × ВСЕХ slugs (для Stub)

### Knowledge Graph System (Project-Specific)
- [ ] graph-integration.ts генерирует мультиязычные `graph-data-{lang}.json`
- [ ] Валидация битых ссылок (explicit → error, outbound → warning)
- [ ] Legal коллекция исключена из графа
- [ ] Типизация Node и Edge (не `any[]`)
- [ ] Pagefind интеграция с lang-фильтрами

### Custom Elements (Project-Specific)
- [ ] Custom Elements используют `astro:page-load` для обновления
- [ ] Загрузка данных из `/graph-data-{lang}.json` с обработкой ошибок
- [ ] Правильная типизация данных (не `any`)
```

### Изменение 2: Модифицировать секцию "Forms & Actions"

Заменить:

```markdown
### Forms & Actions
- [ ] Forms use Astro Actions (astro:actions), not API routes
```

На:

```markdown
### Forms & Actions
- [ ] Forms use Astro Actions (astro:actions), not API routes
  - **ИСКЛЮЧЕНИЕ для static sites:** Допустимо использование внешних API (Web3Forms) с:
    - [ ] Клиентской валидацией через Zod
    - [ ] Защитой от ботов (honeypot, rate limiting, form timestamp, JS token)
    - [ ] Использованием `astro:env` для API ключей
    - [ ] Обработкой ошибок и loading states
```

### Изменение 3: Добавить в "Performance"

После "client:visible" добавить:

```markdown
- [ ] Client libraries (force-graph, d3-force) загружаются только на клиенте
- [ ] Проверка `typeof window !== 'undefined'` перед использованием DOM API
```

### Изменение 4: Добавить в Gap Analysis (Stage 2)

В раздел "What did you miss?" добавить:

```markdown
   - [ ] Leaf Bundle паттерн корректность (parseLeafBundleId, группировка)
   - [ ] Graph data типизация (Node, Edge интерфейсы)
   - [ ] Custom Elements обновление при View Transitions
   - [ ] Stub компонент исключение из sitemap
   - [ ] Мультиязычный RSS (отдельные фиды или параметр)
   - [ ] Pagefind интеграция корректность
```

---

## Приоритеты обновления

### Критично (добавить немедленно):
1. ✅ Leaf Bundles Pattern проверки
2. ✅ Knowledge Graph System проверки
3. ✅ Forms в Static Mode исключение
4. ✅ Custom Elements проверки

### Важно (добавить в ближайшее время):
5. ✅ Stub Component Pattern
6. ✅ Force-Graph клиентская загрузка
7. ✅ Graph Data типизация

### Желательно (можно добавить позже):
8. Мультиязычный RSS
9. Pagefind интеграция детали
10. Тестирование проверки

---

## Итоговые рекомендации

1. **Добавить проект-специфичные секции** в Stage 1 для:
   - Leaf Bundles Pattern
   - Knowledge Graph System
   - Custom Elements
   - Stub Component

2. **Модифицировать существующие секции:**
   - Forms & Actions (добавить исключение для static sites)
   - Performance (добавить проверку клиентских библиотек)

3. **Расширить Gap Analysis** в Stage 2 для проект-специфичных проверок

4. **Добавить примеры** в правила для Leaf Bundle паттерна и graph-integration

Эти изменения сделают правила более релевантными для данного проекта и помогут выявлять специфичные для него проблемы.
