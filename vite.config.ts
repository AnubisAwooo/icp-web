import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  root: './src/icp_web_assets/src', // vite 执行的根目录
  publicDir: '../assets',
  build: {
    outDir: '../../../dist/icp_web_assets', // 构建输出目录
  }
})
