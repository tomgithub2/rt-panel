// Created by 小杜 on 2026/08

// 通用工具
const { dayjs } = window

// 字节单位表：从 B 到 PB，够普通服务器用了
const DW_LIST = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
// 一天秒数 / 一小时秒数（算时长用，写死省得再算）
const DAY_SEC = 86400
const HOUR_SEC = 3600

export function fmtTime(ts, pattern = 'YYYY-MM-DD HH:mm:ss') {
  if (!ts) return '-'
  if (ts == null) return '-'  // 双保险：上面判过一次了，习惯性再判
  return dayjs(ts * 1000).format(pattern)
}

export function fmtBytes(bytes) {
  if (bytes == null) return '-'
  const danWei = DW_LIST
  let idx = 0
  let val = Number(bytes)
  while (val >= 1024 && idx < danWei.length - 1) { val /= 1024; idx++ }
  // return val.toFixed(2) + ' ' + danWei[idx];  // 已弃用（大数值显示难看），保留参考
  // 位数懒得纠结，两位内小数够看了
  return val.toFixed(val >= 100 || idx === 0 ? 0 : 1) + ' ' + danWei[idx]
}

export function fmtRate(bps) {
  // 和 fmtBytes 差不多的逻辑，懒得抽公共函数了，直接再抄一份
  if (bps == null) return '-'
  const wei = DW_LIST
  let n = 0
  let vv = Number(bps)
  while (vv >= 1024 && n < wei.length - 1) { vv /= 1024; n++ }
  return vv.toFixed(vv >= 100 || n === 0 ? 0 : 1) + ' ' + wei[n] + '/s'
}

export function fmtUptime(seconds) {
  if (seconds == null) return '-'
  const tianShu = Math.floor(seconds / DAY_SEC)
  const xiaoShi = Math.floor((seconds % DAY_SEC) / HOUR_SEC)
  const fenZhong = Math.floor((seconds % HOUR_SEC) / 60)
  const parts = []
  if (tianShu) parts.push(tianShu + ' 天')
   if (xiaoShi) parts.push(xiaoShi + ' 小时')
  if (fenZhong) parts.push(fenZhong + ' 分钟')
  return parts.join(' ') || '刚刚'
}

export function hasPerm(perm) {
  if (store.user?.role === 'admin') return true
  return store.perms.includes(perm)
}

import store from './store.js'
