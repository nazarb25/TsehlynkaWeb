// Локальна заміна Tsehlynka API для розробки й скриншотів: `node scripts/mock-api.mjs`.
// API — http://localhost:8787/api/v1, фото — https://localhost:8788 (самопідписаний сертифікат).
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createServer as createHttpsServer } from 'node:https'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const API_PORT = Number(process.env.MOCK_API_PORT ?? 8787)
const MEDIA_PORT = Number(process.env.MOCK_MEDIA_PORT ?? 8788)
const MEDIA = `https://localhost:${MEDIA_PORT}`

const uuid = (n, kind = 1) => `${String(kind).padStart(8, '0')}-0000-4000-8000-${String(n).padStart(12, '0')}`
const image = (key) => ({ large: `${MEDIA}/img/${key}.svg?s=l`, medium: `${MEDIA}/img/${key}.svg?s=m`, thumb: `${MEDIA}/img/${key}.svg?s=t` })

const TALL = new Set(['75313', '75375'])
const DESCRIPTION = [
  'Величезна колекційна модель крокохода AT-AT з рухомими ногами, відсіком для десанту й 9 фігурками. Модель стоїть на чотирьох ногах із шарнірами, голова повертається, а з боків відкриваються люки.',
  'Набір створено для дорослих фанатів: детальна збірка займе кілька вечорів.',
  '• КОЛЕКЦІЙНА МОДЕЛЬ — понад 6700 деталей і висота 62 см\n• 9 ФІГУРОК — генерал Вірс, Люк Скайвокер і снігові штурмовики\n• РУХОМІ ДЕТАЛІ — ноги, голова й гармати',
].join('\n\n')

const THEME_ROWS = [
  ['star-wars', 'Star Wars', null, 128, 14, 1999, 2026, true],
  ['city', 'City', null, 211, 38, 2005, 2026, true],
  ['technic', 'Technic', null, 96, 12, 1977, 2026, true],
  ['harry-potter', 'Harry Potter', null, 87, 9, 2001, 2026, true],
  ['ninjago', 'Ninjago', null, 142, 21, 2011, 2026, true],
  ['icons', 'Icons', null, 54, 7, 2020, 2026, true],
  ['friends', 'Friends', null, 84, 16, 2012, 2026, true],
  ['creator', 'Creator', null, 79, 11, 2001, 2026, true],
  ['marvel', 'Marvel', null, 73, 10, 2012, 2026, true],
  ['speed-champions', 'Speed Champions', null, 41, 8, 2015, 2026, true],
  ['ideas', 'Ideas', null, 38, 4, 2008, 2026, true],
  ['disney', 'Disney', null, 66, 9, 2016, 2026, true],
  ['bionicle', 'Bionicle', null, 312, 0, 2001, 2016, false],
  ['castle', 'Castle', null, 254, 0, 1978, 2014, false],
  ['pirates', 'Pirates', null, 132, 0, 1989, 2015, false],
  ['ultimate-collector-series', 'Ultimate Collector Series', 'star-wars', 24, 3, 2000, 2026, true],
  ['microfighters', 'Microfighters', 'star-wars', 31, 4, 2014, 2026, true],
  ['diorama-collection', 'Diorama Collection', 'star-wars', 8, 2, 2022, 2026, true],
  ['helmet-collection', 'Helmet Collection', 'star-wars', 16, 3, 2020, 2026, true],
  ['saga', 'Saga', 'star-wars', 49, 2, 1999, 2026, true],
]

const themes = THEME_ROWS.map(([slug, name, parent, count, recent, first, last, current], index) => ({
  id: uuid(index + 1, 2),
  parent_id: null,
  _parent: parent,
  name,
  slug,
  set_count: count,
  specialized_set_count: Math.round(count / 10),
  recent_set_count: recent,
  first_set_year: first,
  last_set_year: last,
  is_current: current,
  groups: [],
  image: image(`theme-${slug}`),
}))
for (const theme of themes) {
  theme.parent_id = theme._parent ? themes.find((item) => item.slug === theme._parent).id : null
  delete theme._parent
}
const themeBySlug = (slug) => themes.find((theme) => theme.slug === slug)

const SHOP_ROWS = [
  ['kubyk', 'Кубик', true, 42],
  ['bricktown', 'Бриктаун', true, 18],
  ['mega-toys', 'Мега Тойз', false, 25],
  ['budynochok', 'Будиночок', false, 12],
  ['marketplace', 'Маркетплейс', false, 30],
  ['toymarket', 'ТойМаркет', true, 9],
  ['bloky', 'Блоки', true, 7],
  ['brickhouse', 'BrickHouse', false, 5],
]
const shops = SHOP_ROWS.map(([slug, name, official, count], index) => ({
  id: uuid(index + 1, 3),
  slug,
  name,
  logo_url: null,
  logo: slug === 'kubyk' ? image('logo-kubyk') : null,
  is_official: official,
  in_stock_sets_count: count,
  max_discount_percent: 42,
  last_checked_at: new Date(Date.now() - 3600_000).toISOString(),
  site_url: `https://${slug}.example`,
}))

const today = new Date()
const isoDays = (days) => new Date(today.getTime() + days * 86400_000).toISOString().slice(0, 10)

// [номер, назва, оригінальна назва, тема, рік, деталі, вік, ціна, стара ціна, магазинів, дата виходу]
const SET_ROWS = [
  ['75313', 'AT-AT', 'AT-AT', 'ultimate-collector-series', 2021, 6785, 216, 31999, 35999, 2, null],
  ['75375', 'Тисячолітній сокіл', 'Millennium Falcon', 'microfighters', 2024, 921, 216, 729, 1259, 1, null],
  ['75389', 'Темний сокіл', 'The Dark Falcon', 'star-wars', 2024, 1579, 120, 18749, 24999, 1, null],
  ['75331', 'Лезо Бритви', 'The Razor Crest', 'ultimate-collector-series', 2022, 6187, 216, 13299, 16999, 1, null],
  ['75367', 'Крейсер «Венатор»', 'Venator-Class Republic Attack Cruiser', 'ultimate-collector-series', 2023, 5374, 216, 24990, null, 3, null],
  ['75192', 'Тисячолітній сокіл UCS', 'Millennium Falcon', 'ultimate-collector-series', 2017, 7541, 192, 32499, null, 4, null],
  ['75302', 'Шаттл «Тайдіріум»', 'Imperial Shuttle', 'star-wars', 2021, 660, 108, 2199, 2599, 1, null],
  ['75373', 'Бойовий пакет мандалорців', 'Ambush on Mandalore Battle Pack', 'star-wars', 2024, 109, 72, 799, null, 5, null],
  ['75304', 'Шолом Дарта Вейдера', 'Darth Vader Helmet', 'helmet-collection', 2021, 834, 216, 2999, null, 2, null],
  ['75355', 'Винищувач X-wing', 'X-Wing Starfighter', 'ultimate-collector-series', 2023, 1949, 216, 9499, 10999, 1, null],
  ['75388', 'Імперський шатл', "Jedi Bob's Starfighter", 'star-wars', 2025, 1361, 108, 3499, null, 3, null],
  ['75376', 'Корабель «Тантів IV»', 'Tantive IV', 'microfighters', 2024, 654, 216, 2899, 3299, 1, null],
  ['75398', 'C-3PO', 'C-3PO', 'star-wars', 2026, 1138, 216, 6499, null, 0, isoDays(-20), 'preorder'],
  ['10354', 'Шир: Торба-в-Кінці', 'The Lord of the Rings: The Shire', 'icons', 2026, 2470, 216, null, null, 0, isoDays(6)],
  ['75419', 'Зірка Смерті', 'Death Star', 'ultimate-collector-series', 2026, 1890, 216, null, null, 0, isoDays(-24)],
  ['76446', 'Нічний автобус «Лицар»', 'Knight Bus Adventure', 'harry-potter', 2026, 499, 96, 1899, null, 2, isoDays(-55)],
  ['76240', 'Бетмобіль «Тумблер»', 'Batmobile Tumbler', 'icons', 2026, 2049, 216, 9999, null, 1, isoDays(-85)],
  ['42176', 'Порше 911 GT3 RS', 'Porsche GT4 e-Performance', 'technic', 2026, 1580, 120, 7299, 7999, 2, isoDays(-116)],
  ['60380', 'Центр міста', 'Downtown', 'city', 2025, 2010, 84, 5499, null, 4, null],
  ['60337', 'Пасажирський експрес', 'Express Passenger Train', 'city', 2022, 764, 84, 4999, 5999, 2, null],
  ['42115', 'Lamborghini Sián FKP 37', 'Lamborghini Sián FKP 37', 'technic', 2020, 3696, 216, 15999, null, 2, null],
  ['71799', 'Нічний ринок Ніндзяго', 'NINJAGO City Markets', 'ninjago', 2023, 6163, 168, 11999, 13999, 1, null],
  ['76419', 'Замок Гоґвортс і околиці', 'Hogwarts Castle and Grounds', 'harry-potter', 2023, 2660, 216, 6499, null, 3, null],
  ['41757', 'Ботанічний сад', 'Botanical Garden', 'friends', 2023, 1072, 144, 3299, null, 2, null],
  ['31139', 'Затишний будинок', 'Cosy House', 'creator', 2023, 808, 96, 1999, 2299, 1, null],
  ['10497', 'Галактичний дослідник', 'Galaxy Explorer', 'icons', 2022, 1254, 216, 3499, null, 2, null],
  ['76269', 'Вежа Месників', 'Avengers Tower', 'marvel', 2023, 5201, 216, 17999, null, 1, null],
  ['76916', 'Porsche 963', 'Porsche 963', 'speed-champions', 2024, 280, 108, 999, null, 4, null],
  ['21348', 'Підземелля й дракони', 'Dungeons & Dragons', 'ideas', 2024, 3745, 216, 13499, null, 1, null],
  ['43222', 'Замок Діснея', 'Disney Castle', 'disney', 2023, 4837, 216, 14999, 16999, 1, null],
]

const sets = SET_ROWS.map((row, index) => {
  const [number, name, canonical, themeSlug, year, pieces, age, priceValue, oldPrice, shopCount, released, kind] = row
  const theme = themeBySlug(themeSlug)
  const id = uuid(index + 1, 1)
  const preorder = kind === 'preorder'
  const inStock = Boolean(priceValue) && shopCount > 0 && !preorder
  const deal = inStock && oldPrice ? shops[index % 4] : null
  return {
    id,
    name,
    canonical_name: canonical,
    official_number_display: number,
    set_type: { code: 'set', name: 'Набір' },
    theme: { id: theme.id, name: theme.name, slug: theme.slug },
    intro_year: year,
    age_min_months: age,
    age_max_months: null,
    age_label: null,
    declared_piece_count: pieces,
    image: image(TALL.has(number) ? `set-${number}-tall` : `set-${number}`),
    release_date: released ?? `${year}-03-01`,
    release_date_precision: 'day',
    has_in_stock_offer: inStock,
    min_in_stock_price: inStock ? String(priceValue) : null,
    offers_count: Math.max(shopCount, preorder ? 1 : 0),
    in_stock_offers_count: inStock ? shopCount : 0,
    in_stock_shops_count: inStock ? shopCount : 0,
    has_official_in_stock_offer: inStock,
    has_preorder_offer: preorder,
    min_preorder_price: preorder ? String(priceValue) : null,
    best_deal: deal
      ? {
          price: String(priceValue),
          old_price: String(oldPrice),
          discount_percent: Math.round((1 - priceValue / oldPrice) * 100),
          shop_id: deal.id,
          shop_name: deal.name,
          shop_logo_url: null,
          shop_logo: deal.logo,
        }
      : null,
    _themePath: [themes.find((t) => t.id === theme.parent_id), theme].filter(Boolean),
  }
})

function catalogItem(set) {
  const { _themePath, has_in_stock_offer, min_in_stock_price, offers_count, in_stock_offers_count, in_stock_shops_count, has_official_in_stock_offer, has_preorder_offer, min_preorder_price, best_deal, ...item } = set
  return item
}

function retailItem(set) {
  const { _themePath, ...item } = set
  return item
}

function descendants(themeId) {
  const ids = new Set([themeId])
  let grew = true
  while (grew) {
    grew = false
    for (const theme of themes) {
      if (theme.parent_id && ids.has(theme.parent_id) && !ids.has(theme.id)) {
        ids.add(theme.id)
        grew = true
      }
    }
  }
  return ids
}

function filterSets(query, retail) {
  let list = [...sets]
  const ids = query.getAll('set_id')
  if (ids.length) list = list.filter((set) => ids.includes(set.id))
  const number = query.get('number')
  const search = query.get('search')?.toLocaleLowerCase('uk')
  if (number) list = list.filter((set) => set.official_number_display === number.replace(/\s+/g, ''))
  if (search) list = list.filter((set) => `${set.name} ${set.canonical_name} ${set.theme.name}`.toLocaleLowerCase('uk').includes(search))
  const themeId = query.get('theme_id')
  if (themeId) {
    const ids = descendants(themeId)
    list = list.filter((set) => ids.has(set.theme.id))
  }
  const num = (name) => (query.get(name) ? Number(query.get(name)) : null)
  if (num('year_from')) list = list.filter((set) => set.intro_year >= num('year_from'))
  if (num('year_to')) list = list.filter((set) => set.intro_year <= num('year_to'))
  if (num('pieces_min') !== null) list = list.filter((set) => set.declared_piece_count >= num('pieces_min'))
  if (num('pieces_max') !== null) list = list.filter((set) => set.declared_piece_count <= num('pieces_max'))
  if (num('age_mark_months')) list = list.filter((set) => set.age_min_months === num('age_mark_months'))
  if (query.get('released_from')) list = list.filter((set) => set.release_date >= query.get('released_from'))
  if (retail) {
    if (query.get('in_stock') === 'true') list = list.filter((set) => set.has_in_stock_offer)
    if (query.get('preorder') === 'true') list = list.filter((set) => set.has_preorder_offer)
    if (query.get('on_sale') === 'true') list = list.filter((set) => set.best_deal)
  }
  const sort = query.get('sort') ?? 'year_desc'
  const price = (set) => Number(set.min_in_stock_price ?? set.min_preorder_price ?? Infinity)
  const sorters = {
    name_asc: (a, b) => a.name.localeCompare(b.name, 'uk'),
    year_asc: (a, b) => a.intro_year - b.intro_year,
    year_desc: (a, b) => b.intro_year - a.intro_year || b.release_date.localeCompare(a.release_date),
    release_desc: (a, b) => b.release_date.localeCompare(a.release_date),
    price_asc: (a, b) => price(a) - price(b),
    price_desc: (a, b) => price(b) - price(a),
    discount_desc: (a, b) => (b.best_deal?.discount_percent ?? -1) - (a.best_deal?.discount_percent ?? -1),
  }
  list.sort(sorters[sort] ?? sorters.year_desc)
  const limit = Number(query.get('limit') ?? 20)
  const offset = Number(query.get('offset') ?? 0)
  return { items: list.slice(offset, offset + limit).map(retail ? retailItem : catalogItem), total: list.length, limit, offset }
}

function details(set) {
  const number = set.official_number_display
  const roles = ['primary', 'gallery', 'gallery', 'detail', 'figures', 'packaging']
  return {
    ...catalogItem(set),
    description: number === '75313' ? DESCRIPTION : null,
    theme_path: set._themePath.map(({ id, name, slug }) => ({ id, name, slug })),
    declared_figure_count: number === '75313' ? 9 : null,
    lifecycle_status: set.intro_year >= 2025 ? 'active' : 'retired',
    identifiers: [{ identifier_type: 'official_set_number', value: number, variant_suffix: null }],
    editions: [
      {
        edition_name: 'Стандартне',
        edition_type: 'standard',
        release_date: set.release_date,
        release_date_precision: 'day',
        region_scope: null,
        packaging_type: 'box',
        is_default: true,
      },
    ],
    images: roles.map((role, index) => ({
      url: `${MEDIA}/img/set-${number}-${index}.svg`,
      width: 1200,
      height: 800,
      alt: null,
      role,
      variants: image(TALL.has(number) && index === 1 ? `set-${number}-${index}-tall` : `set-${number}-${index}`),
    })),
    instructions:
      number === '75313'
        ? [1, 2].map((part) => ({
            title: `Інструкція ${part}`,
            instruction_type: 'pdf',
            language_code: 'en',
            part_number: part,
            total_parts: 2,
            url: `https://lego.example/instructions/75313-${part}.pdf`,
          }))
        : [],
  }
}

const FIGURES = ['Люк Скайвокер', 'Генерал Вієрс', 'Водій AT-AT', 'Сніговий штурмовик', 'Боєць повстанців', 'Пілот сніголіта', 'Генерал Рікан', 'Імперський офіцер', 'Дроїд-зонд']

function inventory(set) {
  const count = set.official_number_display === '75313' ? 9 : (set.declared_piece_count % 5) + 1
  return {
    set_id: set.id,
    edition_name: 'Стандартне',
    inventory_kind: 'official',
    declared_total_pieces: set.declared_piece_count,
    revision_code: null,
    elements: [],
    figures: FIGURES.slice(0, count).map((name, index) => ({
      figure_id: uuid(index + 1, 9),
      name,
      character_name: name,
      quantity: index === 2 ? 2 : 1,
      inventory_role: 'regular',
      image_url: `${MEDIA}/img/fig-${index}.svg`,
    })),
    spare_elements: [],
    guaranteed_figure_count: count,
    choice_groups: [],
  }
}

function offers(set) {
  if (!set.offers_count) return []
  const hoursAgo = (hours) => new Date(Date.now() - hours * 3600_000).toISOString()
  if (set.has_preorder_offer) {
    return [
      { shop: shops[1], price: set.min_preorder_price, old: null, availability: 'preorder', hours: 3 },
      { shop: shops[5], price: String(Number(set.min_preorder_price) + 500), old: null, availability: 'preorder', hours: 5 },
    ].map(toOffer)
  }
  const base = Number(set.min_in_stock_price)
  const rows = []
  for (let index = 0; index < set.in_stock_shops_count; index += 1) {
    const shop = set.best_deal && index === 0 ? shops.find((item) => item.id === set.best_deal.shop_id) : shops[(index + 1) % shops.length]
    rows.push({ shop, price: String(base + index * 1451), old: index === 0 && set.best_deal ? set.best_deal.old_price : null, availability: 'in_stock', hours: 2 + index * 3 })
  }
  if (set.official_number_display === '75313') {
    rows[0].shop = shops[0]
    rows[0].old = '35999'
    rows[1] = { shop: shops[4], price: '33450', old: null, availability: 'in_stock', hours: 5, seller: 'ToyLand' }
    rows.push({ shop: shops[6], price: '30990', old: null, availability: 'preorder', hours: 6 })
    rows.push({ shop: shops[7], price: '34100', old: null, availability: 'unknown', hours: 96, seller: 'Brick House', broken: true })
    rows.push({ shop: shops[5], price: '32500', old: null, availability: 'out_of_stock', hours: 24 })
  }
  return rows.map(toOffer)

  function toOffer(row) {
    return {
      shop_id: row.shop.id,
      shop_name: row.shop.name,
      logo_url: null,
      logo: row.shop.logo,
      is_official: row.shop.is_official,
      is_sold_by_shop: !row.seller,
      seller_name: row.seller ?? null,
      price: row.price,
      old_price: row.old,
      currency: 'UAH',
      availability: row.availability,
      last_checked_at: hoursAgo(row.hours),
      product_url: row.broken ? 'not-a-url' : `https://${row.shop.slug}.example/p/${set.official_number_display}`,
    }
  }
}

const favourites = sets.slice(0, 3).map((set) => set.id)
const recent = sets.slice(2, 7).map((set) => set.id)
const personalData = { email: 'olena@example.com', phone: null, phone_source: null, birth_date: '1990-05-17' }
const byId = (id) => sets.find((set) => set.id === id)
const listItem = (id) => ({ ...catalogItem(byId(id)), favourited_at: today.toISOString(), viewed_at: today.toISOString() })
const priceAlerts = sets.slice(1, 4).map((set) => set.id)
const alertItem = (id, index) => {
  const set = byId(id)
  return { ...catalogItem(set), watched_since: today.toISOString(), baseline_price: index === 2 ? null : set.min_in_stock_price }
}

function readBody(request) {
  return new Promise((resolve) => {
    let body = ''
    request.on('data', (chunk) => (body += chunk))
    request.on('end', () => resolve(body ? JSON.parse(body) : {}))
  })
}

async function personal(path, url, request, response) {
  if (path === '/me')
    return json(response, 200, {
      telegram_id: 279058397,
      first_name: 'Олена',
      last_name: 'Коваль',
      username: 'olena_k',
      language_code: 'uk',
      personal_data: personalData,
      favourites_count: favourites.length,
      recently_viewed_count: recent.length,
    })
  if (path === '/me/favourites') {
    const limit = Number(url.searchParams.get('limit') ?? 20)
    const offset = Number(url.searchParams.get('offset') ?? 0)
    return json(response, 200, { items: favourites.slice(offset, offset + limit).map(listItem), total: favourites.length, limit, offset })
  }
  if (path === '/me/favourites/membership') return json(response, 200, { set_ids: url.searchParams.getAll('set_id').filter((id) => favourites.includes(id)) })
  const favourite = /^\/me\/favourites\/([0-9a-f-]{36})$/.exec(path)
  if (favourite) {
    const index = favourites.indexOf(favourite[1])
    if (request.method === 'PUT' && index < 0) favourites.unshift(favourite[1])
    if (request.method === 'DELETE' && index >= 0) favourites.splice(index, 1)
    return response.writeHead(204).end()
  }
  if (path === '/me/price-alerts') {
    const limit = Number(url.searchParams.get('limit') ?? 20)
    const offset = Number(url.searchParams.get('offset') ?? 0)
    return json(response, 200, { items: priceAlerts.slice(offset, offset + limit).map(alertItem), total: priceAlerts.length, limit, offset })
  }
  const alert = /^\/me\/price-alerts\/([0-9a-f-]{36})$/.exec(path)
  if (alert) {
    const index = priceAlerts.indexOf(alert[1])
    if (request.method === 'GET') return json(response, 200, { is_watching: index >= 0 })
    if (request.method === 'PUT' && index < 0) {
      if (priceAlerts.length >= 100) return json(response, 409, { error: 'price_alert_limit_reached', message: 'limit' })
      priceAlerts.unshift(alert[1])
    }
    if (request.method === 'DELETE' && index >= 0) priceAlerts.splice(index, 1)
    return response.writeHead(204).end()
  }
  if (path === '/me/recently-viewed' && request.method === 'GET') return json(response, 200, recent.map(listItem))
  if (path === '/me/recently-viewed' && request.method === 'DELETE') {
    recent.length = 0
    return response.writeHead(204).end()
  }
  const viewed = /^\/me\/recently-viewed\/([0-9a-f-]{36})$/.exec(path)
  if (viewed) {
    const index = recent.indexOf(viewed[1])
    if (index >= 0) recent.splice(index, 1)
    recent.unshift(viewed[1])
    return response.writeHead(204).end()
  }
  if (path === '/me/personal-data' && request.method === 'PATCH') {
    const body = await readBody(request)
    if (typeof body.email === 'string' && !body.email.includes('@')) return json(response, 422, { error: 'invalid_personal_data', message: 'Електронна адреса некоректна' })
    Object.assign(personalData, body)
    personalData.phone_source = personalData.phone ? 'user_input' : null
    return json(response, 200, personalData)
  }
  if (path === '/me/personal-data' && request.method === 'DELETE') {
    Object.assign(personalData, { email: null, phone: null, phone_source: null, birth_date: null })
    return response.writeHead(204).end()
  }
  return json(response, 404, { error: 'not_found' })
}

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(body))
}

const api = createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${API_PORT}`)
  const path = url.pathname.replace(/^\/api\/v1/, '')
  if (process.env.MOCK_API_DOWN === '1') return json(response, 503, { error: 'internal_error', message: 'down' })
  if (path === '/sessions/mini-app' && request.method === 'POST') {
    if (!request.headers.authorization?.startsWith('tma ')) return json(response, 401, { error: 'init_data_required' })
    return json(response, 201, { token: 'mock-session', expires_at: new Date(Date.now() + 30 * 86400000).toISOString() })
  }
  if (path === '/sessions/current' && request.method === 'DELETE') return response.writeHead(204).end()
  if (path === '/me' || path.startsWith('/me/')) {
    if (request.headers.authorization !== 'Bearer mock-session') return json(response, 401, { error: 'invalid_session' })
    return personal(path, url, request, response)
  }
  if (path === '/themes') return json(response, 200, themes)
  if (path === '/retail/shops') return json(response, 200, shops)
  if (path === '/sets') return json(response, 200, filterSets(url.searchParams, false))
  if (path === '/retail/sets') return json(response, 200, filterSets(url.searchParams, true))
  const match = /^\/(retail\/)?sets\/([0-9a-f-]{36})(\/inventory|\/offers)?$/.exec(path)
  const set = match && sets.find((item) => item.id === match[2])
  if (!set) return json(response, 404, { error: 'set_not_found', message: 'not found' })
  if (match[3] === '/offers') return json(response, 200, offers(set))
  if (match[3] === '/inventory') return json(response, 200, inventory(set))
  return json(response, 200, details(set))
})
api.listen(API_PORT, () => console.log(`mock API http://localhost:${API_PORT}/api/v1`))

const PALETTE = ['#e3000b', '#006cb7', '#ffcf00', '#00852b', '#f57d20', '#a0a19f', '#69c3e2', '#9b5de5']

function brickSvg(key) {
  if (key.startsWith('logo-')) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#fff"/><text x="32" y="30" font-family="Arial" font-weight="700" font-size="18" text-anchor="middle" fill="#1c1c1e">KУ</text><text x="32" y="50" font-family="Arial" font-weight="700" font-size="18" text-anchor="middle" fill="#2f6fd6">БИ</text></svg>'
  }
  if (key.endsWith('-tall')) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 640"><rect width="300" height="640" fill="#fff"/><rect x="110" y="40" width="80" height="80" rx="10" fill="#ffcf00"/><rect x="70" y="130" width="160" height="300" rx="12" fill="#2f6fd6"/><rect x="80" y="440" width="60" height="170" fill="#c62828"/><rect x="160" y="440" width="60" height="170" fill="#c62828"/></svg>'
  }
  let hash = 0
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  const color = (n) => PALETTE[(hash >>> n) % PALETTE.length]
  const figure = key.startsWith('fig-')
  if (figure) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#fff"/><rect x="44" y="18" width="32" height="28" rx="8" fill="#ffcf00"/><rect x="36" y="48" width="48" height="34" rx="6" fill="${color(1)}"/><rect x="38" y="82" width="20" height="24" fill="${color(3)}"/><rect x="62" y="82" width="20" height="24" fill="${color(3)}"/></svg>`
  }
  const bricks = Array.from({ length: 7 }, (_, index) => {
    const x = 60 + ((hash >>> index) % 6) * 70
    const y = 300 - index * 38
    const w = 120 + ((hash >>> (index + 2)) % 4) * 40
    return `<rect x="${x}" y="${y}" width="${w}" height="36" rx="4" fill="${color(index)}"/><rect x="${x + 18}" y="${y - 10}" width="22" height="10" rx="2" fill="${color(index)}"/><rect x="${x + w - 40}" y="${y - 10}" width="22" height="10" rx="2" fill="${color(index)}"/>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><rect width="600" height="400" fill="#fff"/>${bricks}</svg>`
}

const certDir = join(tmpdir(), 'tsehlynka-mock-cert')
if (!existsSync(join(certDir, 'cert.pem'))) {
  mkdirSync(certDir, { recursive: true })
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '30', '-subj', '/CN=localhost', '-keyout', join(certDir, 'key.pem'), '-out', join(certDir, 'cert.pem')], { stdio: 'ignore' })
}
const media = createHttpsServer({ key: readFileSync(join(certDir, 'key.pem')), cert: readFileSync(join(certDir, 'cert.pem')) }, (request, response) => {
  const key = new URL(request.url, MEDIA).pathname.replace(/^\/img\//, '').replace(/\.svg$/, '')
  response.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'max-age=3600', 'Access-Control-Allow-Origin': '*' })
  response.end(brickSvg(key))
})
media.listen(MEDIA_PORT, () => console.log(`mock media ${MEDIA}`))
