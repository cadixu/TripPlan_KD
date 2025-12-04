import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 確保在 GitHub Pages 子路徑下能正確讀取資源
  server: {
    host: true
  }
})