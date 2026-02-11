import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    // Оптимизация сборки
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'maps': ['https://api-maps.yandex.ru/2.1/'] // Внешние скрипты
        }
      }
    },
    // Включение предзагрузки
    assetsInlineLimit: 4096,
  },
  // Оптимизация для продакшена
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})