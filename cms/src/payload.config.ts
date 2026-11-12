import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Блоки страниц: собираются в админке, рендерятся статикой.
const Blocks = [
  { slug: 'hero', labels: { singular: 'Шапка', plural: 'Шапки' }, fields: [
    { name: 'title', type: 'text', required: true, label: 'Заголовок' },
    { name: 'subtitle', type: 'textarea', label: 'Подзаголовок' },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Картинка' }
  ]},
  { slug: 'text', labels: { singular: 'Текст', plural: 'Тексты' }, fields: [
    { name: 'body', type: 'richText', label: 'Текст' }
  ]},
  { slug: 'image', labels: { singular: 'Картинка', plural: 'Картинки' }, fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true, label: 'Файл' },
    { name: 'caption', type: 'text', label: 'Подпись' }
  ]},
  { slug: 'gallery', labels: { singular: 'Галерея', plural: 'Галереи' }, fields: [
    { name: 'images', type: 'array', label: 'Изображения', fields: [
      { name: 'image', type: 'upload', relationTo: 'media' },
      { name: 'caption', type: 'text' }
    ]}
  ]},
  { slug: 'quote', labels: { singular: 'Цитата', plural: 'Цитаты' }, fields: [
    { name: 'text', type: 'textarea', required: true },
    { name: 'author', type: 'text' }
  ]},
  { slug: 'list', labels: { singular: 'Список', plural: 'Списки' }, fields: [
    { name: 'items', type: 'array', fields: [{ name: 'text', type: 'text' }] }
  ]},
  { slug: 'table', labels: { singular: 'Таблица', plural: 'Таблицы' }, fields: [
    { name: 'rows', type: 'array', fields: [
      { name: 'cells', type: 'array', fields: [{ name: 'value', type: 'text' }] }
    ]}
  ]},
  { slug: 'matchEmbed', labels: { singular: 'Матч', plural: 'Матчи' }, fields: [
    { name: 'match', type: 'relationship', relationTo: 'matches', label: 'Матч' }
  ]},
  { slug: 'related', labels: { singular: 'Похожие материалы', plural: 'Похожие' }, fields: [
    { name: 'articles', type: 'relationship', relationTo: 'articles', hasMany: true },
    { name: 'pages', type: 'relationship', relationTo: 'pages', hasMany: true }
  ]},
  { slug: 'html', labels: { singular: 'HTML-вставка', plural: 'HTML' }, fields: [
    { name: 'code', type: 'code', admin: { language: 'html' } }
  ]}
]

const seo = [
  { name: 'seoTitle', type: 'text', label: 'SEO: title' },
  { name: 'seoDescription', type: 'textarea', label: 'SEO: description' },
  { name: 'canonical', type: 'text', label: 'Canonical URL' },
  { name: 'noindex', type: 'checkbox', label: 'Закрыть от индексации' },
  { name: 'ogImage', type: 'upload', relationTo: 'media', label: 'OG-картинка' }
]

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'change-me',
  editor: lexicalEditor(),
  db: sqliteAdapter({ client: { url: process.env.DATABASE_URI || 'file:./cms.db' }, push: true }),
  admin: { user: 'users', meta: { titleSuffix: ' — Live Football CMS' } },
  collections: [
    { slug: 'users', auth: true, admin: { useAsTitle: 'email' }, fields: [{ name: 'name', type: 'text' }] },
    {
      slug: 'media', upload: { staticDir: path.resolve(dirname, '../public/media') },
      admin: { useAsTitle: 'filename' },
      fields: [{ name: 'alt', type: 'text', label: 'Alt-текст' }]
    },
    {
      slug: 'pages', admin: { useAsTitle: 'title' },
      access: { read: () => true },
      fields: [
        { name: 'title', type: 'text', required: true, label: 'Заголовок' },
        { name: 'slug', type: 'text', required: true, unique: true, label: 'URL' },
        { name: 'status', type: 'select', defaultValue: 'draft', options: ['draft', 'published'], label: 'Статус' },
        { name: 'publishedAt', type: 'date', label: 'Дата публикации' },
        { name: 'layout', type: 'blocks', blocks: Blocks, label: 'Блоки страницы' },
        ...seo.map(f => ({ ...f, admin: { ...(f.admin || {}), position: 'sidebar' } }))
      ]
    },
    {
      slug: 'articles', admin: { useAsTitle: 'title' },
      access: { read: () => true },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true, unique: true },
        { name: 'excerpt', type: 'textarea', label: 'Краткое описание' },
        { name: 'cover', type: 'upload', relationTo: 'media', label: 'Обложка' },
        { name: 'tags', type: 'array', fields: [{ name: 'tag', type: 'text' }] },
        { name: 'publishedAt', type: 'date' },
        { name: 'status', type: 'select', defaultValue: 'draft', options: ['draft', 'published'] },
        { name: 'layout', type: 'blocks', blocks: Blocks, label: 'Блоки' },
        { name: 'relatedTeams', type: 'relationship', relationTo: 'teams', hasMany: true, label: 'Связанные команды' },
        { name: 'relatedMatches', type: 'relationship', relationTo: 'matches', hasMany: true, label: 'Связанные матчи' },
        ...seo.map(f => ({ ...f, admin: { ...(f.admin || {}), position: 'sidebar' } }))
      ]
    },
    {
      slug: 'countries', admin: { useAsTitle: 'name' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true, unique: true },
        { name: 'confed', type: 'text' },
        { name: 'flag', type: 'text', label: 'Код флага' }
      ]
    },
    {
      slug: 'leagues', admin: { useAsTitle: 'name' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true, unique: true },
        { name: 'country', type: 'relationship', relationTo: 'countries' },
        { name: 'season', type: 'text' }
      ]
    },
    {
      slug: 'teams', admin: { useAsTitle: 'name' },
      fields: [
        { name: 'name', type: 'text', required: true, label: 'Название (рус)' },
        { name: 'original', type: 'text', label: 'Оригинал' },
        { name: 'slug', type: 'text', required: true, unique: true },
        { name: 'league', type: 'relationship', relationTo: 'leagues' },
        { name: 'city', type: 'text' },
        { name: 'stadium', type: 'text' }
      ]
    },
    {
      slug: 'matches', admin: { useAsTitle: 'slug' },
      fields: [
        { name: 'slug', type: 'text', required: true, unique: true },
        { name: 'league', type: 'relationship', relationTo: 'leagues' },
        { name: 'home', type: 'relationship', relationTo: 'teams' },
        { name: 'away', type: 'relationship', relationTo: 'teams' },
        { name: 'date', type: 'date', required: true },
        { name: 'status', type: 'select', defaultValue: 'scheduled', options: ['scheduled', 'live', 'finished'] },
        { name: 'scoreHome', type: 'number' },
        { name: 'scoreAway', type: 'number' },
        { name: 'venue', type: 'text' },
        { name: 'preview', type: 'textarea', label: 'Анонс' },
        { name: 'report', type: 'textarea', label: 'Отчёт' }
      ]
    }
  ]
})
