# Цеглинка: публічний сайт
# Використання: just [рецепт]

compose := "docker compose"

[private]
default:
    @just --list --justfile {{ justfile() }}

# ---- Запуск ----

# Запустити сайт локально з перезавантаженням
[group('run')]
dev:
    npm run dev

# Запустити локальний макет API (порт 8787) для роботи без бекенду
[group('run')]
mock-api:
    node scripts/mock-api.mjs

# Зібрати й запустити сайт у Docker
[group('run')]
up:
    {{ compose }} up -d --build --wait

# Стягнути образ з GHCR і перезапустити сайт без збирання
[group('run')]
deploy:
    {{ compose }} pull web
    {{ compose }} up -d --no-build --wait

# Зупинити контейнер
[group('run')]
down:
    {{ compose }} down

# Журнал контейнера
[group('run')]
logs:
    {{ compose }} logs -f web

# ---- Перевірки ----

# Перевірити код лінтером
[group('check')]
lint:
    npm run lint

# Перевірити типи
[group('check')]
typecheck:
    npm run typecheck

# Оновити типи API з openapi.json
[group('check')]
api-types:
    npm run api:types

# Усі перевірки перед комітом
[group('check')]
check: lint typecheck
