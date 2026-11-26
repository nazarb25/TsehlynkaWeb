import type { PersonalData, PersonalField } from '@/lib/api/account'

export interface PersonalFieldForm {
  label: string
  inputType: 'email' | 'tel' | 'date'
  error: string
  maxLength?: number
  autoComplete: string
  placeholder?: string
}

export const FIRST_BIRTH_DATE = '1900-01-01'

/** Форми полів особистих даних, як у Mini App. */
export const PERSONAL_FIELDS: Record<PersonalField, PersonalFieldForm> = {
  email: {
    label: 'Email',
    inputType: 'email',
    error: 'Перевірте адресу електронної пошти.',
    maxLength: 254,
    autoComplete: 'email',
    placeholder: 'name@example.com',
  },
  phone: {
    label: 'Телефон',
    inputType: 'tel',
    error: 'Перевірте номер телефону.',
    maxLength: 32,
    autoComplete: 'tel',
    placeholder: '+380 67 123 4567',
  },
  birth_date: {
    label: 'Дата народження',
    inputType: 'date',
    error: 'Вкажіть дату від 01.01.1900 до сьогодні.',
    autoComplete: 'bday',
  },
}

export function isPersonalField(value: string): value is PersonalField {
  return value in PERSONAL_FIELDS
}

/** Дата народження «17.05.1990». */
export function birthDate(value: string | null): string {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  return `${day}.${month}.${year}`
}

export function displayValue(data: PersonalData, field: PersonalField): string {
  return field === 'birth_date' ? birthDate(data.birth_date) : (data[field] ?? '')
}

export function filledCount(data: PersonalData): number {
  return [data.email, data.phone, data.birth_date].filter(Boolean).length
}
