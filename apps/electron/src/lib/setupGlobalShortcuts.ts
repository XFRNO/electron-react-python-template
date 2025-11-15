import { app, globalShortcut } from 'electron'

const isDev = !app.isPackaged

export default function setupGlobalShortcuts() {
  // Disable reload and dev tools shortcuts
  if (!isDev) {
    globalShortcut.register('CommandOrControl+R', () => {
      // Prevent reload
    })
  }

  globalShortcut.register('CommandOrControl+Shift+R', () => {
    // Prevent hard reload
  })

  globalShortcut.register('F5', () => {
    // Prevent refresh
  })

  globalShortcut.register('CommandOrControl+Shift+I', () => {
    // Prevent DevTools
  })
}
