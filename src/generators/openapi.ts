import type { ApiGuideModel, FieldMeta } from '../introspect/model.js'

function fieldToJsonSchema(field: FieldMeta): Record<string, unknown> {
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'email':
    case 'url':
    case 'code':
    case 'richText':
      return { type: 'string' }
    case 'number':
      return { type: 'number' }
    case 'checkbox':
      return { type: 'boolean' }
    case 'date':
      return { type: 'string', format: 'date-time' }
    case 'select':
    case 'radio':
      return field.enumOptions?.length
        ? { type: 'string', enum: field.enumOptions }
        : { type: 'string' }
    case 'json':
      return { type: 'object' }
    case 'point':
      return { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 }
    case 'relationship':
    case 'upload':
      return { oneOf: [{ type: 'string', description: 'Document ID' }, { type: 'object' }] }
    case 'array':
      return { type: 'array', items: { type: 'object' } }
    case 'blocks':
      return { type: 'array', items: { type: 'object' } }
    case 'group':
      return { type: 'object' }
    default:
      return { type: 'string' }
  }
}

function buildSchema(fields: FieldMeta[]): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    id: { type: 'string' },
  }
  const required: string[] = []

  for (const field of fields) {
    properties[field.name] = fieldToJsonSchema(field)
    if (field.required) required.push(field.name)
  }

  return {
    type: 'object',
    properties,
    ...(required.length ? { required } : {}),
  }
}

const commonQueryParams = [
  {
    name: 'depth',
    in: 'query',
    schema: { type: 'integer', default: 1 },
    description: 'Controls how many levels of relationships are populated',
  },
  {
    name: 'limit',
    in: 'query',
    schema: { type: 'integer', default: 10 },
    description: 'Number of documents per page',
  },
  {
    name: 'page',
    in: 'query',
    schema: { type: 'integer', default: 1 },
    description: 'Page number',
  },
  {
    name: 'sort',
    in: 'query',
    schema: { type: 'string' },
    description: 'Field to sort by. Prefix with - for descending',
  },
  {
    name: 'where',
    in: 'query',
    schema: { type: 'string' },
    description: 'URL-encoded qs-esm query object for filtering',
  },
  {
    name: 'select',
    in: 'query',
    schema: { type: 'string' },
    description: 'Comma-separated list of fields to include in the response',
  },
  {
    name: 'locale',
    in: 'query',
    schema: { type: 'string' },
    description: 'Locale code for localized fields',
  },
  {
    name: 'draft',
    in: 'query',
    schema: { type: 'boolean' },
    description: 'Include draft documents',
  },
]

export function generateOpenApi(model: ApiGuideModel): Record<string, unknown> {
  const paths: Record<string, unknown> = {}
  const schemas: Record<string, unknown> = {}

  for (const col of model.collections) {
    const schemaName = col.slug
      .split('-')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('')

    schemas[schemaName] = buildSchema(col.fields)

    const listPath = `/${col.slug}`
    const itemPath = `/${col.slug}/{id}`

    paths[listPath] = {
      get: {
        summary: `List ${col.labels.plural}`,
        tags: [col.labels.plural],
        parameters: commonQueryParams,
        responses: {
          '200': {
            description: 'Paginated list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    docs: { type: 'array', items: { $ref: `#/components/schemas/${schemaName}` } },
                    totalDocs: { type: 'integer' },
                    limit: { type: 'integer' },
                    totalPages: { type: 'integer' },
                    page: { type: 'integer' },
                    hasPrevPage: { type: 'boolean' },
                    hasNextPage: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: `Create ${col.labels.singular}`,
        tags: [col.labels.plural],
        requestBody: {
          content: {
            'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } },
          },
        },
        responses: {
          '201': { description: 'Created document' },
        },
      },
    }

    paths[itemPath] = {
      get: {
        summary: `Get ${col.labels.singular} by ID`,
        tags: [col.labels.plural],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ...commonQueryParams.filter((p) => ['depth', 'select', 'locale', 'draft'].includes(p.name)),
        ],
        responses: {
          '200': {
            description: 'Single document',
            content: {
              'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } },
            },
          },
          '404': { description: 'Not found' },
        },
      },
      patch: {
        summary: `Update ${col.labels.singular}`,
        tags: [col.labels.plural],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } },
          },
        },
        responses: { '200': { description: 'Updated document' } },
      },
      delete: {
        summary: `Delete ${col.labels.singular}`,
        tags: [col.labels.plural],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Deleted' } },
      },
    }

    if (col.hasSlugField && col.slugField) {
      paths[`/${col.slug}/slug/{slug}`] = {
        get: {
          summary: `Get ${col.labels.singular} by slug`,
          tags: [col.labels.plural],
          description: `Fetches by slug using where[${col.slugField}][equals]`,
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
            ...commonQueryParams.filter((p) => ['depth', 'select', 'locale'].includes(p.name)),
          ],
          responses: {
            '200': {
              description: 'Single document',
              content: {
                'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } },
              },
            },
            '404': { description: 'Not found' },
          },
        },
      }
    }
  }

  for (const global of model.globals) {
    const schemaName = `Global_${global.slug
      .split('-')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('')}`

    schemas[schemaName] = buildSchema(global.fields)

    paths[`/globals/${global.slug}`] = {
      get: {
        summary: `Get ${global.label} global`,
        tags: ['Globals'],
        parameters: commonQueryParams.filter((p) =>
          ['depth', 'select', 'locale', 'draft'].includes(p.name),
        ),
        responses: {
          '200': {
            description: 'Global document',
            content: {
              'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } },
            },
          },
        },
      },
      post: {
        summary: `Update ${global.label} global`,
        tags: ['Globals'],
        requestBody: {
          content: {
            'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } },
          },
        },
        responses: { '200': { description: 'Updated global' } },
      },
    }
  }

  return {
    openapi: '3.1.0',
    info: {
      title: model.title,
      version: '1.0',
      description: 'Auto-generated from live Payload CMS configuration',
    },
    servers: [{ url: model.apiBase }],
    paths,
    components: { schemas },
  }
}
