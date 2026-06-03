import type { Config } from 'payload'

import type { ResolvedApiGuidePluginOptions } from '../types.js'
import { extractFields } from './fields.js'
import type { ApiGuideModel, CollectionMeta, GlobalMeta } from './model.js'

export function buildApiGuideModel(
  config: Config,
  options: ResolvedApiGuidePluginOptions,
): ApiGuideModel {
  const apiBase = (config.routes?.api ?? '/api').replace(/\/$/, '')

  const collections: CollectionMeta[] = (config.collections ?? [])
    .filter((col) => {
      if (!options.includeAuth && col.auth) return false
      return true
    })
    .map((col) => {
      const fields = extractFields(col.fields ?? [])
      const slugField = fields.find((f) => f.name === 'slug' && f.type === 'text')
      const singularLabel =
        typeof col.labels?.singular === 'string' ? col.labels.singular : col.slug
      const pluralLabel =
        typeof col.labels?.plural === 'string' ? col.labels.plural : col.slug

      return {
        slug: col.slug,
        labels: { singular: singularLabel, plural: pluralLabel },
        fields,
        hasSlugField: Boolean(slugField),
        slugField: slugField?.name,
        isAuth: Boolean(col.auth),
        isDraft: typeof col.versions === 'object' ? Boolean(col.versions.drafts) : false,
        isUpload: Boolean(col.upload),
        timestamps: col.timestamps !== false,
      } satisfies CollectionMeta
    })

  const globals: GlobalMeta[] = (config.globals ?? []).map((global) => ({
    slug: global.slug,
    label: typeof global.label === 'string' ? global.label : global.slug,
    fields: extractFields(global.fields ?? []),
  }))

  return {
    apiBase,
    title: options.title,
    collections,
    globals,
  }
}

export type { ApiGuideModel, CollectionMeta, GlobalMeta }
