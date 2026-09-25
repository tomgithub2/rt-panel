// 全局响应式状态
const { reactive } = window.Vue

// 黑金已移除：旧 localStorage 里的 blackgold 一律迁移为默认白金
let _theme = localStorage.getItem('ops_theme') || 'lightgold'
if (_theme === 'blackgold') {
  _theme = 'lightgold'
  try { localStorage.setItem('ops_theme', _theme) } catch (e) {}
}

const store = reactive({
  user: null,          // 当前用户
  perms: [],           // 权限列表
  role: null,
  panel: null,         // 面板信息
  license: null,       // 授权状态
  theme: _theme,
})

window.store = store
export default store
