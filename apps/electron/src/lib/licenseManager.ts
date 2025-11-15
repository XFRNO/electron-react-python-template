import https from 'https'
import { storeManager } from '../utils/storeManager.js'
import { Logger } from '../utils/logger.js'
import { GUMROAD_PRODUCT_ID, API_TIMEOUT_MS } from '@repo/constants'

class LicenseManager {
  private store = storeManager

  init(): void {}

  isLicensed(): boolean {
    const lic = this.store.getLicense()
    return !!lic.isActivated && !!lic.key
  }

  async verifyLicense(licenseKey: string): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      const checkResponse = await this.makeGumroadRequest(licenseKey, false)
      if (checkResponse.success !== true) {
        throw new Error(checkResponse.message || 'License verification failed')
      }
      this.validatePurchase(checkResponse.purchase)
      if (checkResponse.uses !== undefined && checkResponse.uses > 1) {
        throw new Error('License key has already been activated on another device.')
      }

      const isValid = await this.verifyWithGumroad(licenseKey, true)
      if (isValid) {
        this.store.setLicense({ key: licenseKey, isActivated: true, validatedAt: Date.now() })
      }
      return { success: isValid }
    } catch (error) {
      const err = error as Error
      Logger.error(`License verification error: ${err.message}`)
      return { success: false, error: err.message, details: { productId: GUMROAD_PRODUCT_ID } }
    }
  }

  async clearLicense(): Promise<{ success: boolean; error?: string }> {
    try {
      this.store.clearLicense()
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  private validatePurchase(purchase: any): void {
    if (!purchase) return
    if (purchase.refunded) throw new Error('License has been refunded.')
    if (purchase.chargebacked) throw new Error('License has been chargebacked.')
    if (purchase.subscription_ended_at) throw new Error('License subscription has ended.')
    if (purchase.subscription_cancelled_at) throw new Error('License subscription has been cancelled.')
    if (purchase.subscription_failed_at) throw new Error('License subscription payment failed.')
  }

  private makeGumroadRequest(licenseKey: string, incrementUsesCount: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        product_id: GUMROAD_PRODUCT_ID,
        license_key: licenseKey,
        increment_uses_count: incrementUsesCount
      })
      const options = {
        hostname: 'api.gumroad.com',
        port: 443,
        path: '/v2/licenses/verify',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: API_TIMEOUT_MS
      }
      const req = https.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch (error) {
            reject(new Error(`Failed to parse response: ${(error as Error).message}`))
          }
        })
      })
      req.on('error', (error) => reject(new Error(`Network error: ${error.message}`)))
      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })
      req.write(postData)
      req.end()
    })
  }

  private async verifyWithGumroad(licenseKey: string, incrementUsesCount = false): Promise<boolean> {
    if (!GUMROAD_PRODUCT_ID || GUMROAD_PRODUCT_ID.length < 10)
      throw new Error('Invalid product ID. Please check your Gumroad configuration.')
    if (!licenseKey) throw new Error('No license key provided for verification.')

    const response = await this.makeGumroadRequest(licenseKey, incrementUsesCount)
    if (response.success === true) {
      this.validatePurchase(response.purchase)
      if (response.uses !== undefined && response.uses > 1) {
        throw new Error('License key has already been activated on another device.')
      }
      return true
    } else {
      throw new Error(response.message || 'License verification failed')
    }
  }
}

export const licenseManager = new LicenseManager()