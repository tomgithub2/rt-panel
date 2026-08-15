// 将 node_modules 中的 UMD 产物拷贝到 dist/vendor，供免构建前端使用
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const dist = join(root, 'dist', 'vendor')
mkdirSync(dist, { recursive: true })

const files = [
  ['node_modules/vue/dist/vue.global.prod.js', 'vue.global.prod.js'],
  ['node_modules/element-plus/dist/index.full.min.js', 'element-plus.full.min.js'],
  ['node_modules/element-plus/dist/index.css', 'element-plus.css'],
  ['node_modules/@element-plus/icons-vue/dist/index.iife.min.js', 'element-plus-icons.iife.min.js'],
  ['node_modules/echarts/dist/echarts.min.js', 'echarts.min.js'],
  ['node_modules/@xterm/xterm/lib/xterm.js', 'xterm.js'],
  ['node_modules/@xterm/xterm/css/xterm.css', 'xterm.css'],
  ['node_modules/@xterm/addon-fit/lib/addon-fit.js', 'xterm-addon-fit.js'],
  ['node_modules/vue-router/dist/vue-router.global.prod.js', 'vue-router.global.prod.js'],
  ['node_modules/axios/dist/axios.min.js', 'axios.min.js'],
  ['node_modules/dayjs/dayjs.min.js', 'dayjs.min.js'],
]

let ok = 0
for (const [src, name] of files) {
  const from = join(root, src)
  const to = join(dist, name)
  if (!existsSync(from)) {
    console.error('MISSING', src)
    continue
  }
  copyFileSync(from, to)
  ok++
}
console.log(`copied ${ok}/${files.length} vendor files to ${dist}`)
