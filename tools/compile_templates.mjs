// 构建期模板预编译：把组件 template 字符串编译为 render 函数
// 作用：运行时无需 Vue 编译器（无 eval），CSP 可保持 script-src 'self' 严格模式
// 用法: node tools/compile_templates.mjs
import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { compile } = require('../frontend/node_modules/@vue/compiler-dom/dist/compiler-dom.cjs.js')

const ROOT = resolve(import.meta.dirname, '..')
const DIRS = [
  join(ROOT, 'frontend', 'dist', 'js'),
# [官网相关路径已脱敏：官网不开源，内部结构不公开]
]

const TPL_RE = /template:\s*`([\s\S]*?)`/

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) await walk(p, out)
    else if (entry.name.endsWith('.js')) out.push(p)
  }
  return out
}

let ok = 0
let skipped = 0
let failed = 0

for (const dir of DIRS) {
  const files = await walk(dir)
  for (const file of files) {
    const src = readFileSync(file, 'utf-8')
    if (!src.includes('template:')) continue
    const m = TPL_RE.exec(src)
    if (!m) {
      console.error('[!] 无法提取模板:', file)
      failed++
      continue
    }
    const tpl = m[1]
    if (tpl.includes('`')) {
      console.error('[!] 模板内含反引号，需手动处理:', file)
      failed++
      continue
    }
    const errors = []
    const { code } = compile(tpl, {
      mode: 'function',
      prefixIdentifiers: true,
      hoistStatic: true,
      cacheHandlers: true,
      onError: (e) => errors.push(String(e.message || e)),
    })
    if (errors.length) {
      console.error('[!] 编译错误:', file, errors.join('; ').slice(0, 300))
      failed++
      continue
    }
    // 生成 render 属性（IIFE 包裹，Vue 全局已加载）
    const render = `render: (function(){ ${code} })()`
    const out = src.replace(TPL_RE, render)
    writeFileSync(file, out, 'utf-8')
    ok++
  }
}

console.log(`[OK] 编译完成: ${ok} 个模板成功, 失败 ${failed}`)
if (failed > 0) process.exit(1)
