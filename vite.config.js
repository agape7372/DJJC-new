import { defineConfig } from 'vite';

export default defineConfig({
  base: '/DJJC-new/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['phaser']
  }
});
