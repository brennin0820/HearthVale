import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { buildProjectSnapshot, computeSnapshotVersion, loadRegistry } from './buildSnapshot'

export function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export function handleCompassApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  monorepoRoot: string,
  pathname: string,
): boolean {
  const confPath = path.join(monorepoRoot, 'scripts', 'gods-eye-projects.conf')

  if (pathname === '/api/registry' && req.method === 'GET') {
    try {
      const registry = loadRegistry(confPath, monorepoRoot)
      sendJson(res, 200, { registry })
    } catch (error) {
      sendJson(res, 500, { error: String(error) })
    }
    return true
  }

  if (pathname === '/api/project/version' && req.method === 'GET') {
    try {
      const url = new URL(req.url ?? '', 'http://localhost')
      const projectPath = url.searchParams.get('path')

      if (!projectPath) {
        sendJson(res, 400, { error: 'Missing path query parameter' })
        return true
      }

      const normalized = path.normalize(projectPath)
      if (!fs.existsSync(normalized)) {
        sendJson(res, 404, { error: `Project path not found: ${normalized}` })
        return true
      }

      sendJson(res, 200, {
        snapshotVersion: computeSnapshotVersion(normalized),
        checkedAt: new Date().toISOString(),
      })
    } catch (error) {
      sendJson(res, 500, { error: String(error) })
    }
    return true
  }

  if (pathname === '/api/project' && req.method === 'GET') {
    try {
      const url = new URL(req.url ?? '', 'http://localhost')
      const projectPath = url.searchParams.get('path')
      const label = url.searchParams.get('label') ?? path.basename(projectPath ?? 'project')

      if (!projectPath) {
        sendJson(res, 400, { error: 'Missing path query parameter' })
        return true
      }

      const normalized = path.normalize(projectPath)
      if (!fs.existsSync(normalized)) {
        sendJson(res, 404, { error: `Project path not found: ${normalized}` })
        return true
      }

      const registry = loadRegistry(confPath, monorepoRoot)
      const snapshot = buildProjectSnapshot(normalized, label, registry)
      sendJson(res, 200, snapshot)
    } catch (error) {
      sendJson(res, 500, { error: String(error) })
    }
    return true
  }

  return false
}
