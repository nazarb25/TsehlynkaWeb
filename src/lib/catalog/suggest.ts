export interface SuggestedTheme {
  name: string
  href: string
  image: string | null
  setCount: number
}

export interface SuggestedSet {
  name: string
  href: string
  image: string | null
  number: string | null
  year: number | null
}

export interface Suggestions {
  theme: SuggestedTheme | null
  sets: SuggestedSet[]
  total: number
}
