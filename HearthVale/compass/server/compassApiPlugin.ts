import type { Connect } from 'vite'
import type { Plugin } from 'vite'
import { handleCompassApiRequest } from './compassApiHandlers'
import { findMonorepoRoot } from './monorepoRoot'

function attachApi(server: { middlewares: Connect.Server }, monorepoRoot: string) {
  server.middlewares.use((req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (handleCompassApiRequest(req, res, monorepoRoot, url.pathname)) return
    next()
  })
}

export function compassApiPlugin(): Plugin {
  const monorepoRoot = findMonorepoRoot()

  return {
    name: 'compass-api',
    configureServer(server) {
      attachApi(server, monorepoRoot)
    },
    configurePreviewServer(server) {
      attachApi(server, monorepoRoot)
    },
  }
}
