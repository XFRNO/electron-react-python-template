import { app } from 'electron'
import Store from 'electron-store'
import path from 'path'
import { TStoreSchema, TAppSettings, TUserState, TLicenseData } from '../types.js'

export class StoreManager {
  private static instance: StoreManager
  private store: Store<TStoreSchema>

  private constructor() {
    const downloadsPath = app ? app.getPath('downloads') : path.join(process.cwd(), 'downloads')

    this.store = new Store<TStoreSchema>({
      name: 'store', // creates `store.json` under userData
      defaults: {
        appSettings: {
          theme: 'system',
          outputFolder: downloadsPath
        },
        userState: {
          onboardingCompleted: false,
          hideDialogs: {}
        },
        license: {
          key: null,
          isActivated: false,
          validatedAt: null
        }
      }
    })
  }

  public static getInstance(): StoreManager {
    if (!StoreManager.instance) {
      StoreManager.instance = new StoreManager()
    }
    return StoreManager.instance
  }

  // ---- App Settings ----
  getAppSettings(): TAppSettings {
    return this.store.get('appSettings')
  }

  updateAppSettings(partial: Partial<TAppSettings>) {
    const current = this.getAppSettings()
    this.store.set('appSettings', { ...current, ...partial })
  }

  // ---- User State ----
  getUserState(): TUserState {
    return this.store.get('userState')
  }

  updateUserState(partial: Partial<TUserState>) {
    const current = this.getUserState()
    this.store.set('userState', { ...current, ...partial })
  }

  // ---- License ----
  // getLicense returns the license data from the store
  getLicense(): TLicenseData {
    return this.store.get('license')
  }

  // setLicense sets the license data in the store
  setLicense(partial: Partial<TLicenseData>) {
    const current = this.getLicense()
    this.store.set('license', { ...current, ...partial })
  }

  // clearLicense clears the license data from the store
  clearLicense() {
    this.setLicense({
      key: null,
      isActivated: false,
      validatedAt: null
    })
  }
  // ---- License ----

  // ---- General Utility ----
  clearAll() {
    this.store.clear()
  }
}

export const storeManager = StoreManager.getInstance()
