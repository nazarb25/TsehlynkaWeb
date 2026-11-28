type Schema = Record<string, unknown>

/** Одна схема в окремому блоці: кожен блок JSON-LD — об'єкт із власним `@context`. */
export function JsonLd({ data }: { data: Schema }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
