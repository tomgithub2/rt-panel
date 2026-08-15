// 前端构建：把所有 ES 模块打包为单个 IIFE 文件（ES2017 语法）
// 作用：① 无需浏览器 ES Modules 支持 ② 无需 eval（模板已预编译）
//      ③ 兼容 2017 年以来所有主流浏览器（Chrome 58+ / Edge 16+ / Firefox 55+ / Safari 11+）
// 用法: node tools/build_frontend.mjs [--minify]
import { resolve } from 'node:path'
import { createRequire } from 'node:module'

// 项目根目录 = tools/ 的上一级（源码目录可整体移动）
const ROOT = resolve(import.meta.dirname, '..')
const require = createRequire(import.meta.url)
const esbuildPath = resolve(ROOT, 'frontend', 'node_modules', 'esbuild', 'lib', 'main.js')
let build
try {
  build = require(esbuildPath).build
} catch {
  // 回退：devDependencies 安装在官网/面板 node_modules
  const { build: b } = await import('file:///' + esbuildPath.replace(/\\/g, '/'))
  build = b
}

const minify = process.argv.includes('--minify')

const targets = [
  {
    entry: resolve(ROOT, 'frontend/dist/js/main.js'),
    out: resolve(ROOT, 'frontend/dist/app.js'),
    label: '面板前端',
  },
  {
# [官网相关路径已脱敏：官网不开源，内部结构不公开]
# [官网相关路径已脱敏：官网不开源，内部结构不公开]
    label: '官网前端',
  },
]

for (const t of targets) {
  await build({
    entryPoints: [t.entry],
    bundle: true,
    format: 'iife',
    target: ['es2017'],
    minify,
    charset: 'utf8',
    outfile: t.out,
    logLevel: 'warning',
  })
  console.log(`[OK] ${t.label}: ${t.out}${minify ? '（已压缩）' : ''}`)
}
console.log('[OK] 构建完成：index.html 已引用 app.js（经典脚本，无 ES Module 依赖）')
