import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  process: {
    versions: process.versions
  },
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args)
  },
  getPorts: (): Promise<{ frontendPort: number; backendPort: number }> => {
    return ipcRenderer.invoke('get-ports')
  },
  getAppInfo: (): Promise<{ name: string; version: string; isDev: boolean }> => {
    return ipcRenderer.invoke('get-app-info')
  },
  getBackendInfo: (): Promise<{ backendPort: number | null; url: string; status: string }> => {
    return ipcRenderer.invoke('get-backend-info')
  },
  selectFolder: (): Promise<{ success: boolean; path?: string; error?: string }> => {
    return ipcRenderer.invoke('select-output-folder')
  },
  apiCall: (endpoint: string, options?: RequestInit): Promise<any> => {
    return ipcRenderer.invoke('api-call', endpoint, options)
  },
  verifyLicense: (
    licenseKey: string
  ): Promise<{ success: boolean; error?: string; details?: any }> => {
    return ipcRenderer.invoke('verify-license', licenseKey)
  },
  clearLicense: (): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('clear-license')
  },
  restartApp: (): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('restart-app')
  },
  showItemInFolder: (path: string): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('show-item-in-folder', path)
  },
  getSettings: (): Promise<any> => {
    return ipcRenderer.invoke('get-app-settings')
  },
  updateSettings: (settings: Record<string, any>): Promise<any> => {
    return ipcRenderer.invoke('update-app-settings', settings)
  },
  onLicenseError: (callback: (errorTitle: string, errorMessage: string) => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      errorTitle: string,
      errorMessage: string
    ) => {
      callback(errorTitle, errorMessage)
    }
    ipcRenderer.on('license-error', handler)
    return () => {
      ipcRenderer.removeListener('license-error', handler)
    }
  },
  ping: (): Promise<string> => {
    return ipcRenderer.invoke('ping')
  },
  openExternal: (url: string) => ipcRenderer.send('open-external', url)
})

declare global {
  interface Window {
    electron: {
      process: {
        versions: NodeJS.ProcessVersions
      }
      ipcRenderer: {
        send: (channel: string, ...args: any[]) => void
      }
      getPorts: () => Promise<{ frontendPort: number; backendPort: number }>
      getAppInfo: () => Promise<{ name: string; version: string; isDev: boolean }>
      getBackendInfo: () => Promise<{ backendPort: number | null; url: string; status: string }>
      selectFolder: () => Promise<{ success: boolean; path?: string; error?: string }>
      apiCall: (endpoint: string, options?: RequestInit) => Promise<any>
      verifyLicense: (
        licenseKey: string
      ) => Promise<{ success: boolean; error?: string; details?: any }>
      clearLicense: () => Promise<{ success: boolean; error?: string }>
      restartApp: () => Promise<{ success: boolean; error?: string }>
      showItemInFolder: (path: string) => Promise<{ success: boolean; error?: string }>
      getSettings: () => Promise<any>
      updateSettings: (settings: Record<string, any>) => Promise<any>
      onLicenseError: (callback: (errorTitle: string, errorMessage: string) => void) => () => void
      ping: () => Promise<string>
      openExternal: (url: string) => void
    }
  }
}
