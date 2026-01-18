import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'

// 获取应用路径
function getAppPath() {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'app')
  }
  return process.cwd()
}

const appPath = getAppPath()

// 开发环境下的Next.js服务器URL
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Electron 应用始终使用本地服务器（因为需要 API routes）
// 生产环境需要启动内置的 Next.js 服务器
let nextServer: any = null

async function startNextServer() {
  if (!isDev && app.isPackaged) {
    // 生产环境：启动内置的 Next.js 服务器
    const { spawn } = require('child_process')
    const nextPath = join(appPath, '.next', 'standalone')
    const serverPath = existsSync(join(nextPath, 'server.js')) 
      ? join(nextPath, 'server.js')
      : join(appPath, 'server.js')
    
    if (existsSync(serverPath)) {
      nextServer = spawn('node', [serverPath], {
        cwd: existsSync(nextPath) ? nextPath : appPath,
        env: { ...process.env, PORT: '3000', NODE_ENV: 'production' },
        stdio: 'inherit',
      })
      
      // 等待服务器启动
      await new Promise(resolve => setTimeout(resolve, 3000))
    } else {
      console.warn('Next.js server not found, trying to start with npm start')
      // 备选方案：使用 npm start
      nextServer = spawn('npm', ['start'], {
        cwd: appPath,
        env: { ...process.env, PORT: '3000', NODE_ENV: 'production' },
        stdio: 'inherit',
        shell: true,
      })
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
}

const NEXTJS_URL = 'http://localhost:3000'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'default',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(appPath, isDev ? 'electron/preload.js' : 'preload.js'),
      webSecurity: true,
    },
    icon: existsSync(join(appPath, 'public/icon-512.png')) 
      ? join(appPath, 'public/icon-512.png')
      : undefined,
    show: false, // 先不显示，等加载完成
  })

  // 加载应用
  mainWindow.loadURL(NEXTJS_URL)

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show()
      
      // 开发环境下打开开发者工具
      if (isDev) {
        mainWindow.webContents.openDevTools()
      }
    }
  })

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 应用准备就绪
app.whenReady().then(async () => {
  // 启动 Next.js 服务器（如果需要）
  await startNextServer()
  
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 所有窗口关闭时退出（macOS除外）
app.on('window-all-closed', () => {
  // 关闭 Next.js 服务器
  if (nextServer) {
    nextServer.kill()
  }
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 开发环境下，等待 Next.js 服务器启动（由 npm run electron:dev 处理）
