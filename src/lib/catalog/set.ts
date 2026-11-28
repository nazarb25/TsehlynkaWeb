import type { Inventory, InventoryFigure, SetDetails, SetImage, SetInstruction } from '@/lib/api/types'

export const LIFECYCLE_LABELS: Record<string, string> = {
  announced: 'Анонсовано',
  upcoming: 'Скоро у продажу',
  active: 'У виробництві',
  retiring: 'Випуск завершується',
  retired: 'Знято з виробництва',
  discontinued: 'Випуск припинено',
}

export const INSTRUCTION_LABELS: Record<string, string> = {
  pdf: 'PDF',
  paper: 'Паперова',
  lego_builder_3d: '3D',
  video: 'Відео',
  interactive: 'Інтерактивна',
  fan_instructions: 'Фанатська',
}

export const LANGUAGE_LABELS: Record<string, string> = {
  uk: 'укр.',
  en: 'англ.',
  de: 'нім.',
  pl: 'пол.',
  fr: 'фр.',
  es: 'ісп.',
  it: 'італ.',
  nl: 'нід.',
  cs: 'чес.',
}

const MODEL_ORDER: Record<string, number> = { detail: 1, figures: 2, dimensions: 3, promotional: 4 }
const CAPTIONS: Record<string, string> = {
  packaging: 'Паковання',
  detail: 'Особливість',
  figures: 'Фігурки',
  dimensions: 'Розміри',
  promotional: 'Промо',
}
const NUMBER_TYPES = new Set(['official_set_number', 'catalog_set_id', 'lego_item_number'])

function isHttpsImage(url: string | null | undefined): url is string {
  return Boolean(url && url.startsWith('https://'))
}

export function imageSrc(image: SetImage): string {
  const large = image.variants?.large
  return isHttpsImage(large) ? large : image.url
}

export function imageCaption(image: SetImage): string {
  return CAPTIONS[image.role] ?? 'Модель'
}

export interface Gallery {
  model: SetImage[]
  packaging: SetImage[]
  all: SetImage[]
}

/** Фото моделі за роллю, далі паковання; лише https. */
export function gallery(details: SetDetails): Gallery {
  const images = details.images.filter((image) => isHttpsImage(image.url))
  const model = images
    .filter((image) => image.role !== 'packaging')
    .sort((a, b) => (MODEL_ORDER[a.role] ?? 0) - (MODEL_ORDER[b.role] ?? 0))
  const packaging = images.filter((image) => image.role === 'packaging')
  return { model, packaging, all: [...model, ...packaging] }
}

export function originalName(details: SetDetails): string | null {
  return details.canonical_name && details.canonical_name !== details.name ? details.canonical_name : null
}

export function otherNumbers(details: SetDetails): string[] {
  const numbers = new Set(
    details.identifiers
      .filter((identifier) => NUMBER_TYPES.has(identifier.identifier_type))
      .map((identifier) => (identifier.variant_suffix ? `${identifier.value}-${identifier.variant_suffix}` : identifier.value)),
  )
  numbers.delete(details.official_number_display ?? '')
  return [...numbers]
}

export interface Packaging {
  code: string
  /** Назва з довідника; `null`, якщо паковання невідоме, «інше» чи ще не перекладене. */
  label: string | null
}

/** Паковання типового видання. */
export function packaging(details: SetDetails): Packaging | null {
  const edition = details.editions.find((item) => item.is_default) ?? details.editions[0]
  if (!edition) return null
  return {
    code: edition.packaging_type,
    label: edition.packaging_type === 'other' ? null : edition.packaging_name,
  }
}

export function linkedInstructions(details: SetDetails): SetInstruction[] {
  return details.instructions.filter((instruction) => instruction.url && /^https?:\/\//.test(instruction.url))
}

export interface FigureSet {
  figures: InventoryFigure[]
  randomFigures: InventoryFigure[]
  randomPick: number | null
  figureCount: number
}

/** Склад фігурок: випадкові — з груп `random`; точна кількість — лише в одній групі з рівними межами. */
export function figureSet(inventory: Inventory | null): FigureSet {
  if (!inventory) return { figures: [], randomFigures: [], randomPick: null, figureCount: 0 }
  const groups = inventory.choice_groups.filter(
    (group) => group.selection_type === 'random' && group.options.some((option) => option.figures.length),
  )
  const random = new Map<string, InventoryFigure>()
  for (const group of groups) {
    for (const option of group.options) {
      for (const figure of option.figures) random.set(figure.figure_id, figure)
    }
  }
  const [only] = groups
  const exact = groups.length === 1 && only && only.selection_count_min === only.selection_count_max
  return {
    figures: inventory.figures,
    randomFigures: [...random.values()],
    randomPick: exact && only ? only.selection_count_max : null,
    figureCount: inventory.figures.reduce((sum, figure) => sum + figure.quantity, 0),
  }
}

export function isHttpsUrl(url: string | null | undefined): url is string {
  return isHttpsImage(url)
}
