# Knowledge Graph Site

Система связей и граф знаний на Astro 5.x с поддержкой 10 языков и Leaf Bundles паттерном.

## Быстрый старт

```bash
npm install
npm run dev
```

## Требования

- Node.js >= 18.0.0
- npm >= 9.0.0

### Нативные зависимости

**Sharp** (для генерации OG изображений) требует libvips:

- **Linux**: `sudo apt-get install libvips-dev`
- **macOS**: `brew install vips`
- **Windows**: Автоматически (предкомпилированные бинарники)

Подробнее см. [DEPLOYMENT.md](./DEPLOYMENT.md)

## Переменные окружения

Создайте `.env` файл:

```bash
SITE_URL=https://yourdomain.com
PUBLIC_TWITTER_HANDLE=@yourhandle
PUBLIC_WEB3FORMS_KEY=your_public_key
```

## Скрипты

- `npm run dev` — запуск dev сервера
- `npm run build` — сборка production
- `npm run preview` — предпросмотр production сборки
- `npm run typecheck` — проверка типов
- `npm run lint` — линтинг
- `npm run test` — unit тесты
- `npm run test:e2e` — E2E тесты

## Документация

- [DEPLOYMENT.md](./DEPLOYMENT.md) — инструкции по деплою и настройке CSP
