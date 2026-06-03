import type { ApiGuideModel, CollectionMeta } from '../introspect/model.js'
import type { ResolvedApiGuidePluginOptions } from '../types.js'

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; line-height: 1.6; background: #f9fafb; }
  .container { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem; }
  header { background: #0f172a; color: #f8fafc; padding: 2rem 1.5rem; }
  header .inner { max-width: 960px; margin: 0 auto; }
  header h1 { font-size: 1.75rem; font-weight: 700; }
  header p { margin-top: 0.5rem; color: #94a3b8; font-size: 0.95rem; }
  nav { background: #1e293b; padding: 0.75rem 1.5rem; border-bottom: 1px solid #334155; }
  nav .inner { max-width: 960px; margin: 0 auto; display: flex; gap: 1.5rem; flex-wrap: wrap; }
  nav a { color: #7dd3fc; text-decoration: none; font-size: 0.85rem; font-family: monospace; }
  nav a:hover { color: #e0f2fe; }
  h2 { font-size: 1.25rem; font-weight: 600; margin: 2rem 0 0.75rem; }
  h3 { font-size: 1rem; font-weight: 600; margin: 1.5rem 0 0.5rem; color: #374151; }
  .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.25rem 1.5rem; margin-bottom: 1.25rem; }
  .card h2 { margin-top: 0; }
  .badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.72rem; font-weight: 600; margin-left: 0.35rem; vertical-align: middle; text-transform: uppercase; }
  .badge-auth { background: #dbeafe; color: #1d4ed8; }
  .badge-draft { background: #fef9c3; color: #92400e; }
  .badge-upload { background: #d1fae5; color: #065f46; }
  table { width: 100%; border-collapse: collapse; font-size: 0.875rem; margin-top: 0.75rem; }
  th { text-align: left; padding: 0.5rem 0.75rem; background: #f1f5f9; font-weight: 600; font-size: 0.8rem; color: #475569; border-bottom: 1px solid #e2e8f0; }
  td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #f1f5f9; }
  tr:last-child td { border-bottom: none; }
  code, pre { font-family: 'Menlo', 'Consolas', monospace; }
  .endpoint { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.75rem 1rem; margin: 0.5rem 0; font-size: 0.85rem; }
  .method { font-weight: 700; margin-right: 0.5rem; }
  .method-get { color: #059669; }
  .method-post { color: #2563eb; }
  .method-patch { color: #d97706; }
  .method-delete { color: #dc2626; }
  .url { color: #374151; word-break: break-all; }
  .tip { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 0.75rem 1rem; border-radius: 0 6px 6px 0; font-size: 0.875rem; margin: 1rem 0; }
  .tip strong { color: #1d4ed8; }
  pre { background: #0f172a; color: #e2e8f0; padding: 1rem; border-radius: 6px; overflow-x: auto; font-size: 0.82rem; margin: 0.75rem 0; }
  a { color: #2563eb; }
`

function colCard(col: CollectionMeta, apiBase: string): string {
  const badges = [
    col.isAuth ? '<span class="badge badge-auth">auth</span>' : '',
    col.isDraft ? '<span class="badge badge-draft">drafts</span>' : '',
    col.isUpload ? '<span class="badge badge-upload">upload</span>' : '',
  ]
    .filter(Boolean)
    .join('')

  const fieldRows = col.fields
    .map(
      (f) =>
        `<tr><td><code>${f.name}</code></td><td>${f.type}</td><td>${f.required ? '✓' : ''}</td><td>${f.localized ? '✓' : ''}</td><td>${f.isRelationship ? `→ ${Array.isArray(f.relationTo) ? f.relationTo.join(', ') : f.relationTo}` : ''}</td></tr>`,
    )
    .join('')

  const slugExample = col.hasSlugField && col.slugField
    ? `<h3>Fetch by slug</h3>
<div class="endpoint"><span class="method method-get">GET</span><span class="url">${apiBase}/${col.slug}?where[${col.slugField}][equals]=my-slug&amp;limit=1&amp;depth=1</span></div>
<div class="tip"><strong>Note:</strong> Always use <code>where</code> to fetch by slug. <code>/api/${col.slug}/my-slug</code> will not work.</div>`
    : ''

  return `<div class="card">
  <h2><code>${col.slug}</code>${badges}</h2>
  <table>
    <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Localized</th><th>Relation</th></tr></thead>
    <tbody>${fieldRows || '<tr><td colspan="5">No named fields</td></tr>'}</tbody>
  </table>
  <h3>Fetch list</h3>
  <div class="endpoint"><span class="method method-get">GET</span><span class="url">${apiBase}/${col.slug}?limit=10&amp;depth=1</span></div>
  ${slugExample}
  <h3>Fetch by ID</h3>
  <div class="endpoint"><span class="method method-get">GET</span><span class="url">${apiBase}/${col.slug}/{id}?depth=1</span></div>
  <h3>Create</h3>
  <div class="endpoint"><span class="method method-post">POST</span><span class="url">${apiBase}/${col.slug}</span></div>
  <h3>Update</h3>
  <div class="endpoint"><span class="method method-patch">PATCH</span><span class="url">${apiBase}/${col.slug}/{id}</span></div>
  <h3>Delete</h3>
  <div class="endpoint"><span class="method method-delete">DELETE</span><span class="url">${apiBase}/${col.slug}/{id}</span></div>
</div>`
}

export function generateHumanGuide(
  model: ApiGuideModel,
  options: ResolvedApiGuidePluginOptions,
): string {
  const base = `${model.apiBase}${options.basePath}`

  const collectionCards = model.collections.map((col) => colCard(col, model.apiBase)).join('\n')

  const globalCards = model.globals
    .map(
      (g) => `<div class="card">
  <h2>Global: <code>${g.slug}</code></h2>
  <p>${g.label}</p>
  <h3>Fetch</h3>
  <div class="endpoint"><span class="method method-get">GET</span><span class="url">${model.apiBase}/globals/${g.slug}?depth=1</span></div>
  <h3>Update</h3>
  <div class="endpoint"><span class="method method-post">POST</span><span class="url">${model.apiBase}/globals/${g.slug}</span></div>
</div>`,
    )
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${model.title}</title>
  <style>${CSS}</style>
</head>
<body>
<header>
  <div class="inner">
    <h1>${model.title}</h1>
    <p>Live API reference generated from the Payload CMS configuration.</p>
  </div>
</header>
<nav>
  <div class="inner">
    <a href="${base}">Guide</a>
    <a href="${base}/reference">Reference UI</a>
    <a href="${base}/openapi.json">OpenAPI JSON</a>
    <a href="${base}/agent.md">agent.md</a>
    <a href="${base}/agent.json">agent.json</a>
    <a href="${base}/llms.txt">llms.txt</a>
    <a href="${base}/query-recipes.json">Query Recipes</a>
  </div>
</nav>
<div class="container">

  <h2>Quick start</h2>
  <pre>import qs from 'qs-esm'

// Fetch a list
const res = await fetch('${model.apiBase}/${model.collections[0]?.slug ?? 'posts'}?depth=1&limit=10')
const { docs } = await res.json()

// Fetch by slug (correct way)
const query = qs.stringify({ where: { slug: { equals: 'my-slug' } }, limit: 1 })
const res2 = await fetch(\`${model.apiBase}/${model.collections[0]?.slug ?? 'posts'}?\${query}\`)
const { docs: results } = await res2.json()
const item = results[0]</pre>

  <div class="tip">
    <strong>For AI agents:</strong> Read <a href="${base}/agent.md">agent.md</a> and <a href="${base}/agent.json">agent.json</a>
    before writing fetch code. They contain the exact field names and query patterns for this project.
  </div>

  <h2>Collections (${model.collections.length})</h2>
  ${collectionCards}

  ${model.globals.length ? `<h2>Globals (${model.globals.length})</h2>\n  ${globalCards}` : ''}

  <h2>Common mistakes</h2>
  <div class="card">
    <table>
      <thead><tr><th>Wrong</th><th>Correct</th></tr></thead>
      <tbody>
        <tr><td><code>GET /api/posts/my-slug</code></td><td><code>GET /api/posts?where[slug][equals]=my-slug&amp;limit=1</code></td></tr>
        <tr><td>Build query strings manually</td><td>Use <code>qs-esm</code> to serialize <code>where</code> objects</td></tr>
        <tr><td>Read <code>response.title</code> from list</td><td>Read <code>response.docs[0].title</code></td></tr>
        <tr><td>Omit <code>depth</code></td><td>Set <code>depth=1</code> to populate relationships</td></tr>
      </tbody>
    </table>
  </div>

</div>
</body>
</html>`
}
