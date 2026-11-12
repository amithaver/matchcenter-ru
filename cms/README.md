# Live Football CMS (Payload)

Админка на Payload 3: страницы из блоков, статьи, медиа, связи, SEO-поля.

## Коллекции
- **pages** — страницы: заголовок, URL, статус, дата, блоки, SEO
- **articles** — новости/статьи: обложка, теги, блоки, связи с командами и матчами
- **media** — картинки (папка `public/media`)
- **countries / leagues / teams / matches** — данные: используются блоками и перелинковкой

## Блоки
hero, text, image, gallery, quote, list, table, matchEmbed, related, html.
Добавить новый блок = дописать объект в массив `Blocks` (payload.config.ts) — админка подхватит автоматически.

## Запуск (локально или в CI)
```
npm install
npm run dev
```
Нужны переменные: `PAYLOAD_SECRET`, `DATABASE_URI` (по умолчанию `file:./cms.db`).

## Публикация
Payload хранит контент в SQLite. Экспорт в статику: сгенерировать JSON из коллекций и прогнать `scripts/build-static.mjs` — сайт остаётся быстрым и индексируемым.
