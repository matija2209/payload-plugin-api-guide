export type FieldMeta = {
  name: string
  type: string
  required: boolean
  localized: boolean
  isRelationship: boolean
  relationTo?: string | string[]
  isUpload: boolean
  enumOptions?: string[]
  fields?: FieldMeta[]
}

export type CollectionMeta = {
  slug: string
  labels: { singular: string; plural: string }
  fields: FieldMeta[]
  hasSlugField: boolean
  slugField?: string
  isAuth: boolean
  isDraft: boolean
  isUpload: boolean
  timestamps: boolean
}

export type GlobalMeta = {
  slug: string
  label: string
  fields: FieldMeta[]
}

export type ApiGuideModel = {
  apiBase: string
  title: string
  collections: CollectionMeta[]
  globals: GlobalMeta[]
}
