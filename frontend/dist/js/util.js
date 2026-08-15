// 通用工具
const { dayjs } = window

export function fmtTime(ts, pattern = 'YYYY-MM-DD HH:mm:ss') {
  if (!ts) return '-'
  return dayjs(ts * 1000).format(pattern)
}

export function fmtBytes(bytes) {
  if (bytes == null) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let i = 0
  let v = Number(bytes)
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return v.toFixed(v >= 100 || i === 0 ? 0 : 1) + ' ' + units[i]
}

export function fmtRate(bps) {
  return fmtBytes(bps) + '/s'
}

export function fmtUptime(seconds) {
  if (seconds == null) return '-'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const parts = []
  if (d) parts.push(d + ' 天')
  if (h) parts.push(h + ' 小时')
  if (m) parts.push(m + ' 分钟')
  return parts.join(' ') || '刚刚'
}

export function hasPerm(perm) {
  if (store.user?.role === 'admin') return true
  return store.perms.includes(perm)
}

import store from './store.js'
