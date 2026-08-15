// 路由定义
const { createRouter, createWebHashHistory } = window.VueRouter

const routes = [
  { path: '/login', component: () => import('./pages/login.js'), meta: { public: true } },
  { path: '/setup', component: () => import('./pages/setup.js'), meta: { public: true } },
  {
    path: '/',
    component: () => import('./pages/layout.js'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', component: () => import('./pages/dashboard.js'), meta: { title: '仪表盘', perm: 'dashboard:view' } },
      { path: 'monitor', component: () => import('./pages/monitor.js'), meta: { title: '监控', perm: 'monitor:view' } },
      { path: 'ai', component: () => import('./pages/ai.js'), meta: { title: 'AI 助手', perm: 'ai:use' } },
      { path: 'files', component: () => import('./pages/files.js'), meta: { title: '文件管理', perm: 'files:read' } },
      { path: 'terminal', component: () => import('./pages/terminal.js'), meta: { title: '终端', perm: 'terminal:use' } },
      { path: 'processes', component: () => import('./pages/processes.js'), meta: { title: '进程管理', perm: 'processes:view' } },
      { path: 'guardian', component: () => import('./pages/guardian.js'), meta: { title: '进程守护', perm: 'processes:view' } },
      { path: 'ftp', component: () => import('./pages/ftp.js'), meta: { title: 'FTP 管理', perm: 'ftp:view' } },
      { path: 'services', component: () => import('./pages/services.js'), meta: { title: '服务管理', perm: 'services:view' } },
      { path: 'cron', component: () => import('./pages/cron.js'), meta: { title: '计划任务', perm: 'cron:view' } },
      { path: 'toolbox', component: () => import('./pages/toolbox.js'), meta: { title: '工具箱', perm: 'system:view' } },
      { path: 'health', component: () => import('./pages/health.js'), meta: { title: '体检中心', perm: 'security:view' } },
      { path: 'firewall', component: () => import('./pages/firewall.js'), meta: { title: '防火墙', perm: 'firewall:view' } },
      { path: 'waf', component: () => import('./pages/waf.js'), meta: { title: 'WAF 防护', perm: 'waf:view' } },
      { path: 'network', component: () => import('./pages/network.js'), meta: { title: '网络工具', perm: 'network:view' } },
      { path: 'dns', component: () => import('./pages/dns.js'), meta: { title: 'DNS 工具', perm: 'dns:view' } },
      { path: 'software', component: () => import('./pages/software.js'), meta: { title: '软件商店', perm: 'software:view' } },
      { path: 'databases', component: () => import('./pages/databases.js'), meta: { title: '数据库', perm: 'databases:view' } },
      { path: 'websites', component: () => import('./pages/websites.js'), meta: { title: '网站管理', perm: 'websites:view' } },
      { path: 'site-detail/:id', component: () => import('./pages/site_detail.js'), meta: { title: '网站管理', perm: 'websites:view' } },
      { path: 'backups', component: () => import('./pages/backups.js'), meta: { title: '备份', perm: 'backups:view' } },
      { path: 'docker', component: () => import('./pages/docker.js'), meta: { title: 'Docker', perm: 'docker:view' } },
      { path: 'logs', component: () => import('./pages/logs.js'), meta: { title: '日志管理', perm: 'logs:view' } },
      { path: 'security', component: () => import('./pages/security.js'), meta: { title: '安全中心', perm: 'security:view' } },
      { path: 'ssh', component: () => import('./pages/ssh.js'), meta: { title: 'SSH 安全', perm: 'ssh:view' } },
      { path: 'users', component: () => import('./pages/users.js'), meta: { title: '用户管理', perm: 'users:view' } },
      { path: 'settings', component: () => import('./pages/settings.js'), meta: { title: '面板设置', perm: 'settings:view' } },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({ history: createWebHashHistory(), routes })

// VIP 专属功能（仅 WAF）：普通用户无法进入，点击即提示 VIP 专属
const VIP_ROUTES = ['/waf']

router.beforeEach((to) => {
  const token = localStorage.getItem('ops_token')
  if (!to.meta.public && !token) return '/login'
  if (to.path === '/login' && token) return '/dashboard'
  // 访问控制：未绑定官网账户时仅允许进入「设置 → 账户绑定」页面
  const lic = window.store?.license
  if (token && lic && lic.mode !== 'bound' && to.path !== '/settings') {
    return '/settings'
  }
  // VIP 专属功能：免费版点击即提示并跳转设置页引导升级
  if (token && VIP_ROUTES.includes(to.path) && lic && lic.mode === 'bound' && lic.plan !== 'paid') {
    const ElMessage = window.ElementPlus?.ElMessage
    if (ElMessage) ElMessage.warning('该功能为 VIP 专属，请使用兑换码升级 VIP 后使用')
    window.__paidLock = to.path
    return '/settings'
  }
  return true
})

window.router = router
export default router
