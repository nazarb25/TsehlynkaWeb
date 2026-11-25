import type { Metadata } from 'next'

import { ThemesPage } from '@/components/themes/ThemesPage'
import { pageMetadata } from '@/lib/seo'

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Архів тем LEGO',
    description: 'Теми LEGO, які вже не виходять: роки випуску й усі набори кожної теми.',
    path: '/themes/archive',
  })
}

export default function Page() {
  return <ThemesPage archive />
}
