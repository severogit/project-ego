import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const BATCH_REPORT_ENDPOINT = '/__project_ego_batch_report'
const BATCH_REPORT_FILENAME = 'batch-report.json'

function batchReportWriter(): Plugin {
  return {
    name: 'project-ego-batch-report-writer',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(BATCH_REPORT_ENDPOINT, (request, response, next) => {
        if (request.method !== 'POST') {
          next()
          return
        }

        let body = ''

        request.setEncoding('utf8')
        request.on('data', (chunk) => {
          body += chunk
        })
        request.on('error', () => {
          response.statusCode = 500
          response.end(JSON.stringify({ ok: false }))
        })
        request.on('end', async () => {
          try {
            JSON.parse(body)

            await writeFile(
              resolve(server.config.root, BATCH_REPORT_FILENAME),
              body,
              'utf8',
            )

            response.statusCode = 200
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({ ok: true }))
          } catch {
            response.statusCode = 400
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({ ok: false }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [batchReportWriter(), react(), tailwindcss()],
  server: {
    watch: {
      ignored: ['**/batch-report.json'],
    },
  },
})
