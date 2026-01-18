/**
 * Electron 构建脚本
 * 用于在构建 Electron 应用前编译 TypeScript 文件
 */
const { execSync } = require('child_process')
const { existsSync } = require('fs')
const { join } = require('path')

console.log('🔨 Building Electron application...')

// 1. 构建 Next.js 应用（标准模式，支持 API routes）
console.log('📦 Building Next.js application...')
execSync('npm run build', { stdio: 'inherit' })

// 2. 编译 Electron TypeScript 文件
console.log('⚙️  Compiling Electron TypeScript files...')
const electronTsConfig = join(__dirname, 'electron/tsconfig.json')
if (existsSync(electronTsConfig)) {
  try {
    execSync('npx tsc -p electron/tsconfig.json', { stdio: 'inherit' })
  } catch (error) {
    console.error('❌ Failed to compile Electron TypeScript files')
    process.exit(1)
  }
} else {
  console.log('⚠️  Electron tsconfig.json not found, skipping TypeScript compilation')
}

console.log('✅ Electron build preparation complete!')
