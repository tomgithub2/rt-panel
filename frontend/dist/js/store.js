// Created by 小杜 on 2026/08

// 全局响应式状态
const { reactive } = window.Vue

const store = reactive({
  user: null,          // 当前用户
  perms: [],           // 权限列表
  role: null,
  panel: null,         // 面板信息
  license: null,       // 授权状态
  theme: localStorage.getItem('ops_theme') || 'blackgold',
})

window.store = store
export default store
