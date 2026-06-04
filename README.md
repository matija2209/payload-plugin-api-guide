# @matija2209/payload-agent-api-guide

Generate a live API reference and agent-first query guide from your Payload CMS configuration.

This plugin reads your live Payload config and turns it into practical API documentation, an OpenAPI reference, and agent-readable instructions — so developers and AI coding agents can understand how to query your project without guessing.

---

## Why

Payload's REST API is powerful, but beginners and AI agents often get the details wrong. They may assume generic REST patterns — for example, fetching a post by slug with `/api/posts/my-slug` — instead of using Payload's actual query syntax with `where.slug.equals`.

This plugin solves that by generating project-specific documentation directly from your Payload setup.

---

## Routes

All routes are served under `{payload.routes.api}/api-guide` (default: `/api/api-guide`).

| Route | Description |
|---|---|
| `/api/api-guide` | Human-readable HTML guide |
| `/api/api-guide/reference` | Interactive API browser (Scalar UI) |
| `/api/api-guide/openapi.json` | OpenAPI 3.1 spec |
| `/api/api-guide/agent.md` | Concise rules guide for AI coding agents |
| `/api/api-guide/agent.json` | Structured project map (collections, fields, endpoints) |
| `/api/api-guide/llms.txt` | LLM entry point with links to all resources |
| `/api/api-guide/query-recipes.json` | Common query patterns per collection |

---

## Installation

```bash
npm install @matija2209/payload-agent-api-guide
# or
pnpm add @matija2209/payload-agent-api-guide
```

**Peer dependency:** `payload >= 3.85.0`

---

## Usage

```ts
import { buildConfig } from 'payload'
import { apiGuidePlugin } from '@matija2209/payload-agent-api-guide'

export default buildConfig({
  plugins: [
    apiGuidePlugin({
      title: 'My Project API Guide',
    }),
  ],
  // ...rest of config
})
```

---

## Options

```ts
type ApiGuidePluginOptions = {
  /** Disable the plugin without removing it. Default: true */
  enabled?: boolean

  /** Base path under the Payload API route. Default: '/api-guide' */
  basePath?: string

  /** Title shown in the HTML guide and OpenAPI spec. Default: 'Payload API Guide' */
  title?: string

  /** Include auth-enabled collections. Default: true */
  includeAuth?: boolean
}
```

---

## What gets generated

### From your collections

For each collection the plugin reads:

- slug, labels (singular/plural)
- all field names, types, required status, localization
- relationship fields and their targets
- upload fields
- whether a `slug` field exists (for slug-based fetch recipes)
- whether drafts are enabled
- whether auth is enabled
- whether it is an upload collection

### From your globals

For each global:

- slug, label
- all field names and types

### Generated outputs

**`/api/api-guide`** — A self-contained HTML page explaining how to use the REST API for this specific project. Includes field tables per collection, fetch examples, and a common-mistakes section.

**`/api/api-guide/reference`** — Scalar UI loaded from CDN, pointed at the generated OpenAPI spec.

**`/api/api-guide/openapi.json`** — A complete OpenAPI 3.1 spec with:
- Paths for every collection (`GET`, `POST`, `PATCH`, `DELETE`) and global (`GET`, `POST`)
- Slug-based fetch path for collections that have a `slug` field
- Shared query parameter components (`where`, `depth`, `select`, `limit`, `page`, `sort`, `locale`, `draft`)
- Schema components per collection derived from field definitions

**`/api/api-guide/agent.md`** — A markdown guide written for AI coding agents. Includes:
- Critical rules (slug fetch pattern, qs-esm usage, depth, select, pagination)
- `qs-esm` code example
- Per-collection field tables and fetch examples
- Common mistakes table

**`/api/api-guide/agent.json`** — A structured JSON project map. Includes:
- `apiBase`, `collections`, `globals`
- Per-collection: field list, endpoint URLs, slug field name, draft/auth/upload traits
- `queryGuide` block explaining Payload REST conventions in machine-readable form

**`/api/api-guide/llms.txt`** — An entry-point file for LLMs following the [llms.txt](https://llmstxt.org) convention. Lists all generated resources with links.

**`/api/api-guide/query-recipes.json`** — An array of concrete query recipes per collection:
- List documents
- Fetch by ID
- Fetch by slug (where-based)
- Paginated fetch
- Fetch only published (for draft-enabled collections)
- Fetch with populated relationships
- Fetch with selected fields only
- Fetch global

---

## Agent workflow

The recommended agent workflow when entering a Payload project with this plugin:

1. Read `/api/api-guide/llms.txt` for an overview of available resources
2. Read `/api/api-guide/agent.md` for the rules of how to query this project
3. Inspect `/api/api-guide/agent.json` for collections, fields, and endpoint patterns
4. Use `/api/api-guide/openapi.json` for formal endpoint reference
5. Write fetch code using the project-specific field names and query patterns

---

## Key rule

> Never fetch by slug as a path segment.

This is the most common Payload REST mistake:

```ts
// Wrong — returns 404 or wrong data
fetch('/api/posts/my-slug')

// Correct — use where query
fetch('/api/posts?where[slug][equals]=my-slug&limit=1')
  .then(r => r.json())
  .then(({ docs }) => docs[0])
```

Use [`qs-esm`](https://www.npmjs.com/package/qs-esm) to build `where` queries safely:

```ts
import qs from 'qs-esm'

const query = qs.stringify({
  where: { slug: { equals: 'my-post' } },
  depth: 1,
  limit: 1,
})
const res = await fetch(`/api/posts?${query}`)
const { docs } = await res.json()
const post = docs[0]
```

---

## Requirements

- Payload `>= 3.85.0`
- Node.js `>= 18.20.2`

---

## Release process

The package is intended to publish compiled output from `dist/`.

Before publishing locally:

```bash
pnpm install
pnpm build
pnpm test:int
npm pack --dry-run
npm publish --dry-run
```

For the first public release, publish manually:

```bash
npm publish --access public
```

After the package exists on npm, configure npm trusted publishing for
`@matija2209/payload-agent-api-guide` and use the GitHub Actions workflows in
`.github/workflows/`.

Recommended release flow:

1. Open a PR and let `.github/workflows/ci.yml` run build, lint, integration tests, and e2e.
2. Bump `package.json` to the next version and commit it.
3. Create a matching tag like `v1.0.1`.
4. Push the commit and the tag.
5. `.github/workflows/publish.yml` publishes only if the tag matches the package version exactly.

---

## License

MIT
