import type { ApiGuideModel } from '../introspect/model.js'

type QueryRecipe = {
  id: string
  collection?: string
  global?: string
  title: string
  description: string
  url: string
  notes?: string
}

export function generateQueryRecipes(model: ApiGuideModel): QueryRecipe[] {
  const recipes: QueryRecipe[] = []

  for (const col of model.collections) {
    recipes.push({
      id: `${col.slug}--list`,
      collection: col.slug,
      title: `List ${col.labels.plural}`,
      description: `Fetch the first page of ${col.labels.plural}`,
      url: `${model.apiBase}/${col.slug}?limit=10&depth=1`,
    })

    recipes.push({
      id: `${col.slug}--by-id`,
      collection: col.slug,
      title: `Get ${col.labels.singular} by ID`,
      description: `Fetch a single ${col.labels.singular} by its document ID`,
      url: `${model.apiBase}/${col.slug}/{id}?depth=1`,
    })

    if (col.hasSlugField && col.slugField) {
      recipes.push({
        id: `${col.slug}--by-slug`,
        collection: col.slug,
        title: `Get ${col.labels.singular} by slug`,
        description: `Fetch a single ${col.labels.singular} by its slug field using where`,
        url: `${model.apiBase}/${col.slug}?where[${col.slugField}][equals]={slug}&limit=1&depth=1`,
        notes: 'Read docs[0] from the response. Never use /api/' + col.slug + '/{slug} directly.',
      })
    }

    recipes.push({
      id: `${col.slug}--paginated`,
      collection: col.slug,
      title: `Paginate ${col.labels.plural}`,
      description: `Fetch ${col.labels.plural} with pagination controls`,
      url: `${model.apiBase}/${col.slug}?limit=10&page=2&sort=-createdAt`,
    })

    if (col.isDraft) {
      recipes.push({
        id: `${col.slug}--published`,
        collection: col.slug,
        title: `List published ${col.labels.plural}`,
        description: `Fetch only published (non-draft) ${col.labels.plural}`,
        url: `${model.apiBase}/${col.slug}?where[_status][equals]=published&depth=1`,
      })
    }

    const relationshipFields = col.fields.filter((f) => f.isRelationship && !f.isUpload)
    if (relationshipFields.length > 0) {
      recipes.push({
        id: `${col.slug}--with-depth`,
        collection: col.slug,
        title: `List ${col.labels.plural} with populated relationships`,
        description: `Fetch ${col.labels.plural} with depth=2 to populate nested relationships`,
        url: `${model.apiBase}/${col.slug}?depth=2&limit=10`,
        notes: `Relationship fields: ${relationshipFields.map((f) => f.name).join(', ')}`,
      })
    }

    const namedFields = col.fields.slice(0, 3).map((f) => f.name)
    if (namedFields.length > 0) {
      recipes.push({
        id: `${col.slug}--select-fields`,
        collection: col.slug,
        title: `Fetch ${col.labels.plural} with selected fields only`,
        description: `Return only specific fields to reduce response size`,
        url:
          `${model.apiBase}/${col.slug}?` +
          namedFields.map((n) => `select[${n}]=true`).join('&'),
      })
    }
  }

  for (const global of model.globals) {
    recipes.push({
      id: `global--${global.slug}`,
      global: global.slug,
      title: `Get ${global.label} global`,
      description: `Fetch the ${global.label} global document`,
      url: `${model.apiBase}/globals/${global.slug}?depth=1`,
    })
  }

  return recipes
}
