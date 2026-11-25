import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const config = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { ignoreRestSiblings: true, varsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'src/lib/api/schema.d.ts', 'next-env.d.ts'],
  },
]

export default config
