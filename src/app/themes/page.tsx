import type { Metadata } from 'next'

import { ThemesPage } from '@/components/themes/ThemesPage'
import { pageMetadata } from '@/lib/seo'

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Теми LEGO',
    description: 'Актуальні теми LEGO: Star Wars, City, Technic, Ninjago та інші, з кількістю наборів і новинками.',
    path: '/themes',
  })
}

export default function Page() {
  return <ThemesPage archive={false} />
}
