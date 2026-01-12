# Инструкции по деплою

## Требования к окружению

### Node.js и зависимости

- **Node.js**: >= 18.0.0 (проверьте через `node --version`)
- **npm**: >= 9.0.0

### Нативные зависимости

#### Sharp (для генерации OG изображений)

`sharp` требует нативных бинарников (libvips). Убедитесь, что они установлены:

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install libvips-dev
```

**macOS:**
```bash
brew install vips
```

**Windows:**
- Sharp автоматически скачивает предкомпилированные бинарники
- Если возникают проблемы, установите [Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe)

**CI/CD (GitHub Actions, GitLab CI):**
- Большинство образов уже включают libvips
- Если нет, добавьте установку в `.github/workflows/*.yml`:
  ```yaml
  - name: Install libvips
    run: sudo apt-get update && sudo apt-get install -y libvips-dev
  ```

**Альтернатива:** Если sharp не устанавливается, можно использовать альтернативу:
- Использовать внешний сервис для генерации OG изображений
- Использовать статические OG изображения вместо динамических

---

## Переменные окружения

### Обязательные для production

Создайте файл `.env` или настройте переменные в вашем хостинге:

```bash
# Абсолютный URL сайта (для OG tags, canonical, sitemap)
SITE_URL=https://yourdomain.com

# Twitter handle для Twitter Cards
PUBLIC_TWITTER_HANDLE=@yourhandle

# Web3Forms ключи (для формы запроса перевода)
# Серверный ключ (только для SSR, если используется)
WEB3FORMS_KEY=your_server_key_here

# Публичный ключ для клиентских форм
PUBLIC_WEB3FORMS_KEY=your_public_key_here
```

### Важно о секретах

- **WEB3FORMS_KEY** — серверный секрет, **НИКОГДА** не попадает в клиентский bundle
- **PUBLIC_WEB3FORMS_KEY** — публичный ключ, попадает в клиентский код
- Используйте **разные ключи** для серверных и клиентских запросов

---

## Content Security Policy (CSP)

### Настройка для Netlify

Создайте файл `netlify.toml` в корне проекта:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = """
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mc.yandex.ru;
      worker-src 'self' blob:;
      connect-src 'self' https://api.web3forms.com https://mc.yandex.ru;
      img-src 'self' data: https:;
      style-src 'self' 'unsafe-inline';
      font-src 'self' data:;
      frame-src 'none';
      object-src 'none';
      base-uri 'self';
      form-action 'self' https://api.web3forms.com;
    """
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
```

### Настройка для Vercel

Создайте файл `vercel.json` в корне проекта:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mc.yandex.ru; worker-src 'self' blob:; connect-src 'self' https://api.web3forms.com https://mc.yandex.ru; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://api.web3forms.com;"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### Partytown и CSP

Partytown требует разрешения для worker скриптов:

- `worker-src 'self' blob:` — для Partytown workers
- `script-src 'unsafe-inline' 'unsafe-eval'` — для Partytown (требуется для изоляции third-party скриптов)

**Важно:** Partytown изолирует third-party скрипты (Yandex Metrika) в Web Worker, что безопаснее, чем прямой запуск в основном потоке.

---

## Деплой

### Netlify

1. Подключите репозиторий к Netlify
2. Настройте переменные окружения в Netlify Dashboard → Site settings → Environment variables
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Убедитесь, что `netlify.toml` настроен (см. выше)

### Vercel

1. Подключите репозиторий к Vercel
2. Настройте переменные окружения в Vercel Dashboard → Settings → Environment Variables
3. Build command: `npm run build`
4. Output directory: `dist`
5. Убедитесь, что `vercel.json` настроен (см. выше)

### Другие платформы

Для других платформ (Cloudflare Pages, GitHub Pages и т.д.):

1. Установите переменные окружения
2. Настройте CSP заголовки через конфигурацию платформы
3. Убедитесь, что Node.js версия >= 18.0.0
4. Проверьте, что sharp устанавливается корректно (см. раздел "Нативные зависимости")

---

## Проверка после деплоя

### Чеклист

- [ ] Сайт открывается без ошибок
- [ ] OG изображения генерируются (проверьте через [Open Graph Debugger](https://www.opengraph.xyz/))
- [ ] Форма запроса перевода работает
- [ ] Граф знаний загружается и отображается
- [ ] View Transitions работают при навигации
- [ ] RSS фиды доступны (`/rss-ru.xml`, `/rss-en.xml` и т.д.)
- [ ] Sitemap доступен (`/sitemap-index.xml`)
- [ ] CSP заголовки установлены (проверьте через DevTools → Network → Headers)

### Тестирование безопасности

1. Проверьте, что секреты не попадают в клиентский bundle:
   ```bash
   # После сборки проверьте dist/_astro/*.js
   grep -r "WEB3FORMS_KEY" dist/_astro/ || echo "OK: секреты не найдены в bundle"
   ```

2. Проверьте CSP через [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

---

## Troubleshooting

### Sharp не устанавливается

**Проблема:** `npm install` падает с ошибкой sharp

**Решение:**
1. Установите libvips (см. раздел "Нативные зависимости")
2. Или используйте альтернативу для генерации OG изображений

### OG изображения не генерируются

**Проблема:** `/og/[collection]/[...slug].png` возвращает 404

**Решение:**
1. Проверьте, что sharp установлен корректно
2. Проверьте логи сборки на наличие ошибок
3. Убедитесь, что шрифт `public/fonts/Inter-Regular.ttf` существует (или fallback работает)

### CSP блокирует скрипты

**Проблема:** Скрипты не загружаются, ошибки в консоли

**Решение:**
1. Проверьте CSP заголовки в DevTools
2. Добавьте необходимые домены в `script-src` или `connect-src`
3. Убедитесь, что Partytown workers разрешены (`worker-src 'self' blob:`)

---

## Дополнительные ресурсы

- [Astro Deployment Guide](https://docs.astro.build/en/guides/deploy/)
- [Sharp Installation](https://sharp.pixelplumbing.com/install)
- [Content Security Policy Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Partytown Documentation](https://partytown.builder.io/)
