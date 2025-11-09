import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import path from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: path.resolve(__dirname, 'src/main/index.ts') // ✅ main entry
      }
    },
    resolve: {
      alias: {
        '@repo/constants': path.resolve(__dirname, '../../packages/constants/src'),
        '@': path.resolve(__dirname, './src')
      }
    }
  },

  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: path.resolve(__dirname, 'src/preload/index.ts') // ✅ preload entry
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  },

  renderer: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src/renderer'),
        '@repo/constants': path.resolve(__dirname, '../../packages/constants/src')
      }
    }
  }
})
