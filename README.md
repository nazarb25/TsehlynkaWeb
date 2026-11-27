# TsehlynkaWeb

Публічний сайт-каталог наборів LEGO з порівнянням цін. Next.js (App Router), standalone-збірка; у майбутньому на ньому ж працюватиме Telegram Mini App.

## Як влаштовано

- Усі запити до API йдуть лише з сервера (`src/lib/api`, `server-only`). Браузер бачить тільки власні маршрути сайту (`/api/suggest`, `/api/count`, `/api/sets`), справжня адреса API в Network не з'являється.
- SEO: canonical, Open Graph, JSON-LD (WebSite, Organization, BreadcrumbList, ItemList, Product з AggregateOffer без продавця), sitemap-індекс по кореневих темах. Посилання на магазини мають `rel="sponsored nofollow"`. Поки `SITE_INDEXABLE` не `true`, сайт віддає `noindex` і `Disallow: /`.
- Telegram: відкритий у Telegram, сайт вмикає режим Mini App (`data-platform="telegram"`), ховає веб-елементи й тегує Sentry і PostHog. URL Web App бота ще не перемкнено.
- Sentry: помилки, трейси, логи, метрики, профілювання в браузері й на сервері, тунель через сайт.
- PostHog: перегляди сторінок, події R1 (`src/lib/analytics.ts`: відкриття й перехід з бота за `?src=`, пошук, режим, сортування, фільтри, тема, набір, «Де купити», перехід у магазин, обране, стеження, помилки) і записи сесій через проксі `/ingest`. Текст пошуку в події не потрапляє: лише тип і довжина запиту, а `q` у адресах подій замінюється на «…». Запис вмикається в налаштуваннях проєкту PostHog; поля вводу маскуються.

## Локально

```bash
npm ci
cp .env.example .env.local   # API_BASE_URL на ваш API
just mock-api                # або макет API на :8787 без бекенду
just dev
```

## Деплой

Merge у `main` публікує образ `ghcr.io/nazarb25/tsehlynka-web` з тегами `main` і `sha-<коміт>`. На сервері:

```bash
just deploy
```

Змінні збирання беруться з оточення GitHub `production`:

| Назва | Тип | Що це |
| --- | --- | --- |
| `NEXT_PUBLIC_SENTRY_DSN` | variable | DSN проєкту `tsehlynka-web` |
| `SENTRY_AUTH_TOKEN` | secret | токен для завантаження source maps |
| `NEXT_PUBLIC_POSTHOG_KEY` | variable | ключ проєкту PostHog |
| `POSTHOG_HOST`, `NEXT_PUBLIC_POSTHOG_UI_HOST` | variable | лише якщо PostHog не EU |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | variable | за замовчуванням 0.2 |

Рантайм-змінні в `.env` поруч із `docker-compose.yml`: `SITE_URL` (обов'язкова), `SITE_INDEXABLE`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_CLIENT_ID` і `TELEGRAM_CLIENT_SECRET` (вхід через Telegram, BotFather → Login Widget → OpenID Connect; Redirect URI — `${SITE_URL}/auth/telegram/callback`), `GOOGLE_SITE_VERIFICATION`, `CONTACT_EMAIL` і `CONTACT_TELEGRAM_URL` (контакти на `/contacts`; Telegram — повне посилання, наприклад `https://t.me/tsehlynka_ua?direct`, а на сторінці видно `@tsehlynka_ua`; щоб змінити, поправте `.env` і перезапустіть контейнер), `WEB_PORT` (за замовчуванням 3001). `API_BASE_URL` на сервері не задавайте: типове `http://tsehlynka-api:8000/api/v1` веде до API через мережу `tsehlynka`, а `localhost` усередині контейнера — це сам сайт.
