const MONTHS_GENITIVE = [
  'січня',
  'лютого',
  'березня',
  'квітня',
  'травня',
  'червня',
  'липня',
  'серпня',
  'вересня',
  'жовтня',
  'листопада',
  'грудня',
] as const

const MONTHS_LOCATIVE = [
  'січні',
  'лютому',
  'березні',
  'квітні',
  'травні',
  'червні',
  'липні',
  'серпні',
  'вересні',
  'жовтні',
  'листопаді',
  'грудні',
] as const

const NARROW_NBSP = ' '
const NBSP = ' '

/** Форма слова для числа: 1 набір, 2 набори, 5 наборів. */
export function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

/** Ціле число з тисячами через вузький нерозривний пробіл: 1 579. */
export function thousands(count: number): string {
  return String(Math.trunc(count)).replace(/\B(?=(\d{3})+(?!\d))/g, NARROW_NBSP)
}

/** Ціна в гривнях: тисячі через вузький пробіл, «₴» через нерозривний; копійки лише ненульові. */
export function price(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return ''
  const kopecks = Math.round(Number(amount) * 100)
  const hryvnias = Math.trunc(kopecks / 100)
  const rest = Math.abs(kopecks % 100)
  const digits = thousands(hryvnias)
  const text = rest ? `${digits},${String(rest).padStart(2, '0')}` : digits
  return `${text}${NBSP}₴`
}

export function setCount(count: number): string {
  return `${thousands(count)} ${plural(count, 'набір', 'набори', 'наборів')}`
}

export function piecesCount(count: number): string {
  return `${thousands(count)} ${plural(count, 'деталь', 'деталі', 'деталей')}`
}

export function figuresCount(count: number): string {
  return `${count} ${plural(count, 'фігурка', 'фігурки', 'фігурок')}`
}

/** «в 1 магазині», «у 4 магазинах». */
export function shopsPhrase(count: number): string {
  const shops = count || 1
  return `${shops === 1 ? 'в' : 'у'} ${shops} ${plural(shops, 'магазині', 'магазинах', 'магазинах')}`
}

/** Час перевірки відносно поточного: «щойно», «2 год тому», «вчора», «4 дні тому». */
export function checkedAgo(moment: string | Date, now: Date = new Date()): string {
  const elapsed = now.getTime() - new Date(moment).getTime()
  const minutes = Math.floor(elapsed / 60000)
  if (minutes < 1) return 'щойно'
  if (minutes < 60) return `${minutes} хв тому`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} год тому`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'вчора'
  return `${days} ${plural(days, 'день', 'дні', 'днів')} тому`
}

/** Вікова позначка коробки: підпис каталогу або «N+» за мінімальним віком. */
export function ageMark(label: string | null | undefined, minMonths: number | null | undefined): string {
  if (label) return label
  if (minMonths === null || minMonths === undefined) return ''
  return minMonths % 12 === 0 ? `${minMonths / 12}+` : `${minMonths} міс.+`
}

interface LocalDate {
  year: number
  month: number
  day: number
}

function kyivToday(now: Date = new Date()): LocalDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return { year: get('year'), month: get('month'), day: get('day') }
}

function parseDate(value: string): LocalDate {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return { year: year ?? 0, month: month ?? 1, day: day ?? 1 }
}

function compare(a: number[], b: number[]): number {
  for (let index = 0; index < a.length; index += 1) {
    const diff = (a[index] ?? 0) - (b[index] ?? 0)
    if (diff) return diff
  }
  return 0
}

/** Вихід ще попереду з точністю дати: день, місяць чи рік. */
export function releaseUpcoming(value: string | null | undefined, precision: string | null | undefined, now?: Date): boolean {
  if (!value) return false
  const date = parseDate(value)
  const today = kyivToday(now)
  if (precision === 'year') return date.year > today.year
  if (precision === 'month') return compare([date.year, date.month], [today.year, today.month]) > 0
  return compare([date.year, date.month, date.day], [today.year, today.month, today.day]) > 0
}

/** «Вийде 1 грудня», «Вийшов у червні», «Вийде у 2027»; іншого року дата несе рік. */
export function release(value: string | null | undefined, precision: string | null | undefined, now?: Date): string {
  if (!value) return ''
  const date = parseDate(value)
  const today = kyivToday(now)
  const verb = releaseUpcoming(value, precision, now) ? 'Вийде' : 'Вийшов'
  if (precision === 'year') return `${verb} у ${date.year}`
  const suffix = date.year === today.year ? '' : ` ${date.year}`
  if (precision === 'month') return `${verb} у ${MONTHS_LOCATIVE[date.month - 1]}${suffix}`
  return `${verb} ${date.day} ${MONTHS_GENITIVE[date.month - 1]}${suffix}`
}

export function currentYear(now: Date = new Date()): number {
  return kyivToday(now).year
}

export function isoDateDaysAgo(days: number, now: Date = new Date()): string {
  const today = kyivToday(now)
  const date = new Date(Date.UTC(today.year, today.month - 1, today.day - days))
  return date.toISOString().slice(0, 10)
}
