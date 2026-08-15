import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 面板后端默认端口 9988；开发时 Vite 代理 /api 与 /ws
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:9988', changeOrigin: true },
      '/ws': { target: 'ws://127.0.0.1:9988', ws: true }
    }
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000
  }
})
