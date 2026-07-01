import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, shell } from 'electron'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const compassDir = path.resolve(__dirname, '..')
const isDev = process.env.COMPASS_DEV === '1'
const devUrl = process.env.COMPASS_DEV_URL ?? 'http://localhost:5173'

/** @type {import('node:child_process').ChildProcess | null} */
let previewProcess = null

function findOpenPort() {
  return 4173
}

async function startPreviewServer() {
  const port = findOpenPort()
  return new Promise((resolve, reject) => {
    previewProcess = spawn(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
      { cwd: compassDir, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env } },
    )

    let settled = false
    const finish = (url) => {
      if (settled) return
      settled = true
      resolve(url)
    }

    const onData = (chunk) => {
      const text = chunk.toString()
      if (text.includes('http://')) {
        const match = text.match(/http:\/\/127\.0\.0\.1:\d+/)
        if (match) finish(match[0])
      }
    }

    previewProcess.stdout?.on('data', onData)
    previewProcess.stderr?.on('data', onData)
    previewProcess.on('error', reject)
    previewProcess.on('exit', (code) => {
      if (!settled) reject(new Error(`vite preview exited with code ${code}`))
    })

    setTimeout(() => finish(`http://127.0.0.1:${port}`), 4000)
  })
}

async function resolveAppUrl() {
  if (isDev) return devUrl
  return startPreviewServer()
}

/** @type {BrowserWindow | null} */
let mainWindow = null

async function createWindow() {
  const appUrl = await resolveAppUrl()

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    title: 'HearthVale Compass',
    backgroundColor: '#eef2f6',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 14 },
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.loadURL(appUrl)

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }
}

app.whenReady().then(() => {
  void createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow()
  })
})

app.on('window-all-closed', () => {
  if (previewProcess) previewProcess.kill()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (previewProcess) previewProcess.kill()
})
