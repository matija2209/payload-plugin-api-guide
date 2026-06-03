import type { ApiGuideModel } from '../introspect/model.js'
import type { ResolvedApiGuidePluginOptions } from '../types.js'

export function generateLlmsTxt(
  model: ApiGuideModel,
  options: ResolvedApiGuidePluginOptions,
): string {
  const base = `${model.apiBase}${options.basePath}`

  return `# ${model.title}

> Agent entry point for the Payload CMS REST API.
> Read this file first to understand what data exists and how to fetch it correctly.

## API base

${model.apiBase}

## Collections

${model.collections.map((c) => `- \`${c.slug}\` — ${c.labels.plural}${c.hasSlugField ? ' (has slug field)' : ''}${c.isDraft ? ' (drafts enabled)' : ''}${c.isUpload ? ' (upload collection)' : ''}`).join('\n')}

${
  model.globals.length
    ? `## Globals\n\n${model.globals.map((g) => `- \`${g.slug}\` — ${g.label}`).join('\n')}\n`
    : ''
}
## Resources

- [Human guide](${base}) — Plain-language API documentation
- [API reference](${base}/reference) — Interactive OpenAPI browser
- [OpenAPI spec](${base}/openapi.json) — Machine-readable API spec (OpenAPI 3.1)
- [Agent guide](${base}/agent.md) — Concise rules for AI coding agents
- [Project map](${base}/agent.json) — Structured collection and field data
- [Query recipes](${base}/query-recipes.json) — Common query patterns with examples

## Key rule

Never fetch by slug as a path segment. Use \`where[slug][equals]=<value>\` with the REST API.
`
}
