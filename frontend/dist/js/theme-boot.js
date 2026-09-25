// RT面板 主题预加载：在首屏渲染前把 data-theme 写到 <html>，避免占位屏闪错主题
// 必须外置成文件：面板 CSP 为 script-src 'self'，内联脚本会被拦截
try {
  var t = localStorage.getItem('ops_theme') || 'light'
  document.documentElement.setAttribute('data-theme', t)
} catch (e) {}
