import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import * as yaml from 'js-yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const specPath = resolve(__dirname, '../docs/openapi.yaml')

function loadSpec () {
  const content = readFileSync(specPath, 'utf8')
  return yaml.load(content)
}

const swaggerUiHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexus Engineering API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/api/docs/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        docExpansion: 'list',
        showMutatedRequest: true,
        defaultModelsExpandDepth: 2,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ]
      });
    };
  </script>
</body>
</html>`

export async function docsRoutes(server: FastifyInstance) {
  server.get('/api/docs/openapi.json', async (_request: FastifyRequest, reply: FastifyReply) => {
    const spec = loadSpec()
    return reply.send(spec)
  })

  server.get('/api/docs', async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.type('text/html')
    return reply.send(swaggerUiHtml)
  })
}