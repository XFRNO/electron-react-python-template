import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import path from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      target: 'node18',
      outDir: path.resolve(__dirname, 'out/main'), // ✅ ensure correct output path
      emptyOutDir: true, // optional, cleans before build
      rollupOptions: {
        input: path.resolve(__dirname, 'src/main/index.ts')
      }
    },

    resolve: {
      alias: {
        '@repo/constants': path.resolve(__dirname, '../../packages/constants/src'),
        '@': path.resolve(__dirname, './src'),
      }
    }
  },

  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      target: 'node18',
      rollupOptions: {
        input: path.resolve(__dirname, 'src/preload/index.ts') // ✅ preload entry
      },
      lib: {
      entry: path.resolve(__dirname, 'src/preload/index.ts'),
      formats: ['cjs'],       // <-- Force CommonJS output
      fileName: 'index'       // outputs index.js instead of index.mjs
    }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  },

  renderer: {
    build: {
      target: 'chrome128',
      outDir: path.resolve(__dirname, 'out/renderer'),
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'src/renderer/src/splash.html'),
          license: path.resolve(__dirname, 'src/renderer/src/license.html')
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src/renderer'),
        '@repo/constants': path.resolve(__dirname, '../../packages/constants/src')
      }
    }
  }
})
