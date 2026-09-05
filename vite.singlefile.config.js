// vite.singlefile.config.js
// Build a single, self-contained index.html (no separate assets, no server needed).
// Usage: npm run build:single  ->  dist-single/index.html
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  // Absolute public dir so images/icons can be inlined; plugin inlines CSS/JS.
  publicDir: 'public',
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    outDir: 'dist-single',
    emptyOutDir: true,
    // Inline every dynamic import into one bundle so the file is fully portable.
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
    // Inline small assets (icons) rather than emitting files.
    assetsInlineLimit: 100000000,
  },
})
