export type ApiGuidePluginOptions = {
  enabled?: boolean
  /** Base path under the Payload API route. Default: '/api-guide' */
  basePath?: string
  /** Title shown in the HTML guide and OpenAPI spec. Default: 'Payload API Guide' */
  title?: string
  /** Include auth-enabled collections. Default: true */
  includeAuth?: boolean
}

export type ResolvedApiGuidePluginOptions = Required<ApiGuidePluginOptions>
