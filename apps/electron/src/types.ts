export interface TAppSettings {
  theme: 'light' | 'dark' | 'system'
  outputFolder: string
}

export interface TUserState {
  onboardingCompleted: boolean
  hideDialogs: Record<string, boolean> // e.g. { "updateNotice": true }
}

export interface TLicenseData {
  key: string | null
  isActivated: boolean
  validatedAt: number | null // Timestamp
}

export interface TStoreSchema {
  appSettings: TAppSettings
  userState: TUserState
  license: TLicenseData
}
