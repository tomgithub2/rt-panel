// Created by 小杜 on 2026/08

// API 封装：axios + token + 统一错误处理
const { ElMessage } = window.ElementPlus
const axios = window.axios

const api = axios.create({ baseURL: '/api', timeout: 60000 })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ops_token')
  if (token) cfg.headers.Authorization = 'Bearer ' + token
  return cfg
})

api.interceptors.response.use(
  res => res.data,
  err => {
    const status = err.response?.status
    const detail = err.response?.data?.detail || err.message
    if (status === 401 && !location.hash.includes('/login')) {
      localStorage.removeItem('ops_token')
      ElMessage.error('登录已过期，请重新登录')
      setTimeout(() => location.hash = '#/login', 300)
    } else if (status === 402) {
      ElMessage.warning('授权已到期：' + detail)
    } else if (status === 429) {
      ElMessage.warning(detail || '请求过于频繁')
    } else if (status !== 401) {
      ElMessage.error(detail || '请求失败')
    }
    return Promise.reject(err)
  }
)

window.api = api
export default api
