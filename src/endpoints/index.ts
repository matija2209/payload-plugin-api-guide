import type { Endpoint } from 'payload'

import { generateAgentJson } from '../generators/agentJson.js'
import { generateAgentMd } from '../generators/agentMd.js'
import { generateHumanGuide } from '../generators/humanGuide.js'
import { generateLlmsTxt } from '../generators/llmsTxt.js'
import { generateOpenApi } from '../generators/openapi.js'
import { generateQueryRecipes } from '../generators/queryRecipes.js'
import type { ApiGuideModel } from '../introspect/model.js'
import type { ResolvedApiGuidePluginOptions } from '../types.js'

export function createApiGuideEndpoints(
  model: ApiGuideModel,
  options: ResolvedApiGuidePluginOptions,
): Endpoint[] {
  const base = options.basePath

  return [
    {
      path: base,
      method: 'get',
      handler: () => {
        const html = generateHumanGuide(model, options)
        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
      },
    },
    {
      path: `${base}/reference`,
      method: 'get',
      handler: () => {
        const openApiUrl = `${model.apiBase}${base}/openapi.json`
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${model.title} — API Reference</title>
</head>
<body>
  <script id="api-reference" data-url="${openApiUrl}"></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`
        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
      },
    },
    {
      path: `${base}/openapi.json`,
      method: 'get',
      handler: () => {
        const spec = generateOpenApi(model)
        return Response.json(spec, {
          headers: { 'Access-Control-Allow-Origin': '*' },
        })
      },
    },
    {
      path: `${base}/agent.json`,
      method: 'get',
      handler: () => {
        const data = generateAgentJson(model)
        return Response.json(data, {
          headers: { 'Access-Control-Allow-Origin': '*' },
        })
      },
    },
    {
      path: `${base}/agent.md`,
      method: 'get',
      handler: () => {
        const md = generateAgentMd(model)
        return new Response(md, {
          headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
        })
      },
    },
    {
      path: `${base}/llms.txt`,
      method: 'get',
      handler: () => {
        const txt = generateLlmsTxt(model, options)
        return new Response(txt, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      },
    },
    {
      path: `${base}/query-recipes.json`,
      method: 'get',
      handler: () => {
        const recipes = generateQueryRecipes(model)
        return Response.json(recipes, {
          headers: { 'Access-Control-Allow-Origin': '*' },
        })
      },
    },
  ]
}
