import type { ApiGuideModel } from '../introspect/model.js'

export function generateAgentJson(model: ApiGuideModel): Record<string, unknown> {
  return {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    title: model.title,
    apiBase: model.apiBase,
    queryGuide: {
      fetchBySlug:
        'Use where[slug][equals]=<value> — never use /api/<collection>/<slug> directly',
      fetchById: 'GET /api/<collection>/<id>',
      fetchList: 'GET /api/<collection>?limit=10&page=1',
      filterSyntax: 'Use qs-esm to serialize where objects. Example: qs.stringify({ where: { slug: { equals: "my-post" } } })',
      depth: 'Use depth=0 for IDs only, depth=1 for one level of relationships populated (default), depth=2+ for nested',
      select: 'Use select[fieldName]=true to return only specific fields',
      sort: 'Use sort=createdAt for ascending, sort=-createdAt for descending',
      pagination: 'Response includes: totalDocs, totalPages, hasNextPage, hasPrevPage, nextPage, prevPage',
      drafts: 'Pass draft=true to include unpublished draft documents',
      locale: 'Pass locale=en (or other locale code) for localized fields',
    },
    collections: model.collections.map((col) => ({
      slug: col.slug,
      labels: col.labels,
      isAuth: col.isAuth,
      isDraft: col.isDraft,
      isUpload: col.isUpload,
      hasTimestamps: col.timestamps,
      hasSlugField: col.hasSlugField,
      slugField: col.slugField ?? null,
      endpoints: {
        list: `GET ${model.apiBase}/${col.slug}`,
        create: `POST ${model.apiBase}/${col.slug}`,
        getById: `GET ${model.apiBase}/${col.slug}/{id}`,
        update: `PATCH ${model.apiBase}/${col.slug}/{id}`,
        delete: `DELETE ${model.apiBase}/${col.slug}/{id}`,
        ...(col.hasSlugField && col.slugField
          ? {
              getBySlug: `GET ${model.apiBase}/${col.slug}?where[${col.slugField}][equals]={slug}`,
            }
          : {}),
      },
      fields: col.fields.map((f) => ({
        name: f.name,
        type: f.type,
        required: f.required,
        localized: f.localized,
        isRelationship: f.isRelationship,
        relationTo: f.relationTo ?? null,
        isUpload: f.isUpload,
        enumOptions: f.enumOptions ?? null,
      })),
    })),
    globals: model.globals.map((g) => ({
      slug: g.slug,
      label: g.label,
      endpoints: {
        get: `GET ${model.apiBase}/globals/${g.slug}`,
        update: `POST ${model.apiBase}/globals/${g.slug}`,
      },
      fields: g.fields.map((f) => ({
        name: f.name,
        type: f.type,
        required: f.required,
        localized: f.localized,
        isRelationship: f.isRelationship,
        relationTo: f.relationTo ?? null,
      })),
    })),
  }
}
