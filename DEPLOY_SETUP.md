# Настройка Deploy Preview

Инструкции по настройке deploy-preview на Vercel или Netlify для проверки Stub и графа на реальном окружении.

## Vercel

### 1. Установка Vercel CLI

```bash
npm install -g vercel
```

### 2. Логин в Vercel

```bash
vercel login
```

### 3. Инициализация проекта

```bash
vercel
```

### 4. Конфигурация (vercel.json)

Создайте файл `vercel.json` в корне проекта:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "astro",
  "installCommand": "npm install"
}
```

### 5. Переменные окружения

В настройках проекта Vercel добавьте:
- `PUBLIC_WEB3FORMS_KEY` - ключ для Web3Forms (если используется)

### 6. Проверка после деплоя

После успешного деплоя проверьте:

1. **Stub компонент:**
   - Откройте страницу без перевода (например, `/de/blog/test-post/`)
   - Убедитесь, что отображается форма "Запросить перевод"
   - Проверьте, что форма работает корректно

2. **Граф знаний:**
   - Откройте `/ru/graph/` или `/en/graph/`
   - Убедитесь, что граф загружается и отображается
   - Проверьте фильтры (type, tags)

3. **Все языки:**
   - Проверьте главные страницы для всех 10 языков
   - Убедитесь, что контент фильтруется по языку

4. **RTL для арабского:**
   - Откройте `/ar/`
   - Проверьте, что `dir="rtl"` установлен
   - Убедитесь, что стили применяются корректно

5. **View Transitions:**
   - Перейдите между страницами
   - Проверьте плавность переходов
   - Убедитесь, что sidebar сохраняется

## Netlify

### 1. Установка Netlify CLI

```bash
npm install -g netlify-cli
```

### 2. Логин в Netlify

```bash
netlify login
```

### 3. Инициализация проекта

```bash
netlify init
```

### 4. Конфигурация (netlify.toml)

Создайте файл `netlify.toml` в корне проекта:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
```

### 5. Переменные окружения

В настройках проекта Netlify добавьте:
- `PUBLIC_WEB3FORMS_KEY` - ключ для Web3Forms

### 6. Проверка после деплоя

Аналогично Vercel, проверьте все компоненты системы.

## GitHub Actions (опционально)

Для автоматического деплоя при push в main:

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Чеклист проверки

- [ ] Сборка проходит без ошибок
- [ ] Все 10 языков доступны
- [ ] Stub компонент работает на страницах без перевода
- [ ] Граф знаний загружается и отображается
- [ ] Фильтры графа работают
- [ ] RTL для арабского языка работает
- [ ] View Transitions работают плавно
- [ ] Backlinks компонент обновляется при навигации
- [ ] Cookie Consent сохраняет выбор
- [ ] OG-изображения генерируются
- [ ] Sitemap не содержит Stub страниц
- [ ] RSS фиды работают (если реализованы)

## Troubleshooting

### Проблема: Граф не загружается

**Решение:** Убедитесь, что `graph-data-{lang}.json` файлы доступны в `dist/`. Проверьте, что интеграция запускается после сборки.

### Проблема: Stub страницы попадают в sitemap

**Решение:** Проверьте фильтр в `astro.config.mjs` для sitemap. Убедитесь, что Stub страницы исключены.

### Проблема: View Transitions не работают

**Решение:** Убедитесь, что `<ClientRouter />` подключен в BaseHead и что сборка использует правильный output mode.
