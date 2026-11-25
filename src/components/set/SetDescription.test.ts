import { describe, expect, it } from 'vitest'

import { descriptionParagraphs } from './SetDescription'

describe('descriptionParagraphs', () => {
  it('splits paragraphs on blank lines and lines on newlines', () => {
    expect(descriptionParagraphs('Перший.\nДругий рядок.\n\nНовий абзац.')).toEqual([['Перший.', 'Другий рядок.'], ['Новий абзац.']])
  })

  it('starts a new line before inline bullets', () => {
    expect(descriptionParagraphs('Вступ. • ПЕРШЕ – опис • ДРУГЕ – опис')).toEqual([['Вступ.', '• ПЕРШЕ – опис', '• ДРУГЕ – опис']])
  })

  it('drops empty paragraphs', () => {
    expect(descriptionParagraphs('\n\n  \n\nТекст\n\n')).toEqual([['Текст']])
  })
})
