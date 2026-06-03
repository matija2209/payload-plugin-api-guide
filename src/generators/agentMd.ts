import type { ApiGuideModel, CollectionMeta, FieldMeta } from '../introspect/model.js'

function fieldsTable(fields: FieldMeta[]): string {
  if (fields.length === 0) return '_No named fields_\n'
  const rows = fields.map(
    (f) =>
      `| \`${f.name}\` | ${f.type} | ${f.required ? 'yes' : ''} | ${f.localized ? 'yes' : ''} | ${f.isRelationship ? `→ ${Array.isArray(f.relationTo) ? f.relationTo.join(', ') : f.relationTo}` : ''} |`,
  )
  return [
    '| Field | Type | Required | Localized | Relation |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n') + '\n'
}

function collectionSection(col: CollectionMeta, apiBase: string): string {
  const lines: string[] = []
  lines.push(`## \`${col.slug}\``)
  lines.push('')

  const badges: string[] = []
  if (col.isAuth) badges.push('auth')
  if (col.isDraft) badges.push('drafts')
  if (col.isUpload) badges.push('upload')
  if (badges.length) lines.push(`**Traits:** ${badges.join(', ')}`)

  lines.push('')
  lines.push(fieldsTable(col.fields))

  lines.push('**Fetch list:**')
  lines.push('```')
  lines.push(`GET ${apiBase}/${col.slug}?limit=10&depth=1`)
  lines.push('```')
  lines.push('')

  if (col.hasSlugField && col.slugField) {
    lines.push('**Fetch by slug** (always use `where`, never `/api/slug-value`):')
    lines.push('```')
    lines.push(`GET ${apiBase}/${col.slug}?where[${col.slugField}][equals]=my-slug&depth=1&limit=1`)
    lines.push('```')
    lines.push('')
  }

  lines.push('**Fetch by ID:**')
  lines.push('```')
  lines.push(`GET ${apiBase}/${col.slug}/{id}?depth=1`)
  lines.push('```')
  lines.push('')

  return lines.join('\n')
}

export function generateAgentMd(model: ApiGuideModel): string {
  const lines: string[] = []

  lines.push(`# ${model.title} — Agent API Guide`)
  lines.push('')
  lines.push('> This document is generated from the live Payload CMS configuration.')
  lines.push('> Use it to write correct data-fetching code without guessing.')
  lines.push('')

  lines.push('## Project overview')
  lines.push('')
  lines.push(`**API base:** \`${model.apiBase}\``)
  lines.push('')
  lines.push(
    `**Collections (${model.collections.length}):** ${model.collections.map((c) => `\`${c.slug}\``).join(', ')}`,
  )
  if (model.globals.length) {
    lines.push(
      `**Globals (${model.globals.length}):** ${model.globals.map((g) => `\`${g.slug}\``).join(', ')}`,
    )
  }
  lines.push('')

  lines.push('## Critical rules')
  lines.push('')
  lines.push(
    '1. **Never fetch by slug as a path segment.** `/api/posts/my-slug` returns 404 or wrong data.',
  )
  lines.push(
    '   Use: `GET /api/posts?where[slug][equals]=my-slug&limit=1` then read `response.docs[0]`.',
  )
  lines.push(
    '2. **Use `qs-esm` to serialize `where` objects** — do not hand-build query strings.',
  )
  lines.push(
    '3. **`depth` controls relationship population.** `depth=0` returns IDs. `depth=1` populates one level (default).',
  )
  lines.push(
    '4. **`select` reduces response size.** `select[title]=true&select[slug]=true` returns only those fields.',
  )
  lines.push(
    '5. **List responses are paginated.** Always read `docs` array, not the root response.',
  )
  lines.push('6. **Draft documents** require `draft=true` query param.')
  lines.push('')

  lines.push('## qs-esm example')
  lines.push('')
  lines.push('```ts')
  lines.push("import qs from 'qs-esm'")
  lines.push('')
  lines.push('const query = qs.stringify({')
  lines.push('  where: { slug: { equals: "my-post" } },')
  lines.push('  depth: 1,')
  lines.push('  limit: 1,')
  lines.push('})')
  lines.push(`const res = await fetch(\`\${apiBase}/posts?\${query}\`)`)
  lines.push('const { docs } = await res.json()')
  lines.push('const post = docs[0]')
  lines.push('```')
  lines.push('')

  lines.push('## Collections')
  lines.push('')
  for (const col of model.collections) {
    lines.push(collectionSection(col, model.apiBase))
  }

  if (model.globals.length) {
    lines.push('## Globals')
    lines.push('')
    for (const global of model.globals) {
      lines.push(`## \`${global.slug}\` (global)`)
      lines.push('')
      lines.push(`**Label:** ${global.label}`)
      lines.push('')
      lines.push(fieldsTable(global.fields))
      lines.push('**Fetch:**')
      lines.push('```')
      lines.push(`GET ${model.apiBase}/globals/${global.slug}?depth=1`)
      lines.push('```')
      lines.push('')
    }
  }

  lines.push('## Common mistakes')
  lines.push('')
  lines.push('| Wrong | Correct |')
  lines.push('|---|---|')
  lines.push(
    '| `GET /api/posts/my-slug` | `GET /api/posts?where[slug][equals]=my-slug&limit=1` |',
  )
  lines.push('| Build query string manually | Use `qs-esm` to serialize `where` |')
  lines.push('| Read `response.title` from list | Read `response.docs[0].title` |')
  lines.push('| Skip `depth` param | Set `depth=1` to populate relationships |')
  lines.push('| Assume field exists | Check the fields table above for this project |')
  lines.push('')

  return lines.join('\n')
}
