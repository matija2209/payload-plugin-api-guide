import { definePlugin } from 'payload'

import { createApiGuideEndpoints } from './endpoints/index.js'
import { buildApiGuideModel } from './introspect/index.js'
import type { ApiGuidePluginOptions, ResolvedApiGuidePluginOptions } from './types.js'

const PLUGIN_SLUG = 'payload-plugin-api-guide'

function resolveOptions(options: ApiGuidePluginOptions): ResolvedApiGuidePluginOptions {
  return {
    enabled: true,
    basePath: '/api-guide',
    title: 'Payload API Guide',
    includeAuth: true,
    ...options,
  }
}

export const apiGuidePlugin = definePlugin<ApiGuidePluginOptions>({
  slug: PLUGIN_SLUG,
  order: 50,
  plugin: ({ config, ...pluginOptions }) => {
    const options = resolveOptions(pluginOptions)

    if (!options.enabled) {
      return config
    }

    const model = buildApiGuideModel(config, options)
    const endpoints = createApiGuideEndpoints(model, options)

    return {
      ...config,
      endpoints: [...(config.endpoints ?? []), ...endpoints],
    }
  },
})

export type { ApiGuidePluginOptions } from './types.js'

declare module 'payload' {
  interface RegisteredPlugins {
    'payload-plugin-api-guide': ApiGuidePluginOptions
  }
}
