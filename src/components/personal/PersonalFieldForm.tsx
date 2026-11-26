'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { PersonalData, PersonalField } from '@/lib/api/account'
import { FIRST_BIRTH_DATE, PERSONAL_FIELDS } from '@/lib/personal'

import { useToast } from './Toast'

interface PersonalFieldFormProps {
  field: PersonalField
  initial: string
  today: string
}

/** Форма одного поля особистих даних: збереження, очищення й помилка, як у Mini App. */
export function PersonalFieldForm({ field, initial, today }: PersonalFieldFormProps) {
  const form = PERSONAL_FIELDS[field]
  const router = useRouter()
  const [value, setValue] = useState(initial)
  const [stored, setStored] = useState(initial)
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, showToast] = useToast()

  const save = async (next: string) => {
    setBusy(true)
    try {
      const response = await fetch('/api/me/personal-data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value: next.trim() || null }),
      })
      if (response.status === 401) {
        router.refresh()
        return
      }
      if (response.status === 422 || response.status === 400) {
        setError(true)
        return
      }
      if (!response.ok) throw new Error(String(response.status))
      const data = (await response.json()) as PersonalData
      const saved = data[field] ?? ''
      setValue(saved)
      setStored(saved)
      setError(false)
      showToast('Збережено')
      router.refresh()
    } catch {
      showToast('Не вдалося зберегти. Спробуйте ще раз')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      className="c-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void save(value)
      }}
    >
      <div className="c-menu">
        <label className="c-field">
          <span className="c-field__label">{form.label}</span>
          <input
            className="c-field__input"
            name="value"
            type={form.inputType}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            maxLength={form.maxLength}
            autoComplete={form.autoComplete}
            placeholder={form.placeholder}
            min={form.inputType === 'date' ? FIRST_BIRTH_DATE : undefined}
            max={form.inputType === 'date' ? today : undefined}
            aria-invalid={error || undefined}
            aria-describedby={error ? 'personal-error' : undefined}
          />
        </label>
      </div>
      {error ? (
        <p id="personal-error" className="c-form__error" role="alert">
          {form.error}
        </p>
      ) : null}

      <div className="c-form__actions">
        <button type="submit" className="c-button" disabled={busy}>
          Зберегти
        </button>
        {stored ? (
          <button type="button" className="c-button c-button--plain" disabled={busy} onClick={() => void save('')}>
            Очистити
          </button>
        ) : null}
      </div>
      {toast}
    </form>
  )
}
