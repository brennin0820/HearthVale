import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleCompassApiRequest } from './compassApiHandlers'
import { findMonorepoRoot } from './monorepoRoot'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

function serveStatic(res: http.ServerResponse, filePath: string) {
  const ext = path.extname(filePath)
  const type = MIME[ext] ?? 'application/octet-stream'
  res.statusCode = 200
  res.setHeader('Content-Type', type)
  res.end(fs.readFileSync(filePath))
}

export function createStandaloneCompassServer(options?: {
  monorepoRoot?: string
  staticDir?: string
  port?: number
}): Promise<{ server: http.Server; port: number; url: string }> {
  const monorepoRoot = options?.monorepoRoot ?? findMonorepoRoot()
  const compassDir = path.dirname(fileURLToPath(import.meta.url))
  const staticDir = options?.staticDir ?? path.join(compassDir, '..', 'dist')

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (handleCompassApiRequest(req, res, monorepoRoot, url.pathname)) return

    let relative = decodeURIComponent(url.pathname)
    if (relative === '/') relative = '/index.html'
    const filePath = path.join(staticDir, relative)

    if (!filePath.startsWith(staticDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      const fallback = path.join(staticDir, 'index.html')
      if (fs.existsSync(fallback)) {
        serveStatic(res, fallback)
        return
      }
      res.statusCode = 404
      res.end('Not found')
      return
    }

    serveStatic(res, filePath)
  })

  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(options?.port ?? 0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to bind Compass API server'))
        return
      }
      const port = address.port
      resolve({ server, port, url: `http://127.0.0.1:${port}` })
    })
  })
}
