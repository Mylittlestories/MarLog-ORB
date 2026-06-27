import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          pdf: ['jspdf'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-label', '@radix-ui/react-select', '@radix-ui/react-separator', '@radix-ui/react-slot'],
        },
      },
    },
  },
})
