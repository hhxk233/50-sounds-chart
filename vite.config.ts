import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// vitest/config 扩展自 vite 的 defineConfig，并带上 `test` 字段的类型。
export default defineConfig({
  plugins: [react()],
  // 用相对路径，方便直接以 file:// 打开 dist/index.html 或部署到子目录。
  base: './',
  test: {
    // 引擎是纯逻辑，无需 DOM，用 node 环境即可，省去 jsdom 依赖。
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
