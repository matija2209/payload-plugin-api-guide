import type { Field } from 'payload'

import type { FieldMeta } from './model.js'

export function extractFields(fields: Field[]): FieldMeta[] {
  const result: FieldMeta[] = []

  for (const field of fields) {
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if ('fields' in tab) {
          result.push(...extractFields(tab.fields))
        }
      }
      continue
    }

    if (field.type === 'row' || field.type === 'collapsible') {
      result.push(...extractFields(field.fields))
      continue
    }

    if (!('name' in field)) continue

    const meta: FieldMeta = {
      name: field.name,
      type: field.type,
      required: 'required' in field ? Boolean(field.required) : false,
      localized: 'localized' in field ? Boolean(field.localized) : false,
      isRelationship: false,
      isUpload: false,
    }

    if (field.type === 'relationship' || field.type === 'upload') {
      meta.isRelationship = true
      meta.isUpload = field.type === 'upload'
      meta.relationTo = field.relationTo as string | string[]
    }

    if (field.type === 'select' || field.type === 'radio') {
      meta.enumOptions = field.options.map((o) =>
        typeof o === 'string' ? o : String(o.value),
      )
    }

    if (field.type === 'array' && 'fields' in field) {
      meta.fields = extractFields(field.fields)
    }

    if (field.type === 'group' && 'fields' in field) {
      meta.fields = extractFields(field.fields)
    }

    if (field.type === 'blocks') {
      meta.fields = field.blocks.flatMap((block) => extractFields(block.fields))
    }

    result.push(meta)
  }

  return result
}
