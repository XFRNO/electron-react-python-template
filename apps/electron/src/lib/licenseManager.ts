import { BrowserWindow } from "electron";
import { app } from "electron";
import https from "https";
import { Logger } from "../utils/logger";
import { createLicenseWindow } from "../windows/licenseWindow";
import { createSplashWindow } from "../windows/splashWindow";
import { resetWindowManagerState } from "../windows/windowManager";
import { processManager } from "./processManager";
import Store from "electron-store";
import { TStoreData } from "../types";

const GUMROAD_PRODUCT_ID = "tbU32GxrR5IQl9j7KXzqRg==";

const ERROR_MESSAGES = {
  transfer: {
    title: "License Transfer Detected",
    message:
      "This license key has been activated on another device. Please contact support at contact@xfrno.com to transfer your license back to this device.",
  },
  refunded: {
    title: "License Refunded",
    message:
      "This license has been refunded. Please contact support at contact@xfrno.com if you believe this is an error.",
  },
  chargebacked: {
    title: "License Chargebacked",
    message:
      "This license has been chargebacked. Please contact support at contact@xfrno.com if you believe this is an error.",
  },
  expired: {
    title: "Subscription Expired",
    message:
      "This license subscription has expired. Please contact support at contact@xfrno.com to renew your subscription.",
  },
  cancelled: {
    title: "Subscription Cancelled",
    message:
      "This license subscription has been cancelled. Please contact support at contact@xfrno.com to renew your subscription.",
  },
  paymentFailed: {
    title: "Subscription Payment Failed",
    message:
      "This license subscription payment failed. Please update your payment method to continue using the service. For assistance, contact support at contact@xfrno.com.",
  },
  disabled: {
    title: "License Disabled",
    message:
      "This license key has been disabled. Please contact support at contact@xfrno.com for assistance.",
  },
  alreadyUsed: {
    title: "License Already Used",
    message:
      "This license key has already been activated. Please contact support at contact@xfrno.com if you believe this is an error.",
  },
  verificationFailed: {
    title: "License Verification Failed",
    message:
      "License verification failed. Please try again or contact support.",
  },
};

class LicenseManager {
  private store: Store<TStoreData> | null = null; // Use Store<TStoreData>
  private isDev = false;
  private rootPath = "";
  private isLicenseValid = false;
  private licenseWindow: BrowserWindow | null = null;
  private mainWindowRef: BrowserWindow | null = null;
  private createMainWindow: (() => Promise<BrowserWindow>) | null = null;

  public init(store: Store<TStoreData>, isDev: boolean, rootPath: string) {
    this.store = store;
    this.isDev = isDev;
    this.rootPath = rootPath;
  }

  public async onAppLaunch(createMainWindowFunc: () => Promise<BrowserWindow>) {
    this.createMainWindow = createMainWindowFunc;
    const storedLicense = this.store?.get("licenseKey") as string;

    if (storedLicense) {
      this.mainWindowRef = await this.createMainWindow();
      try {
        const isValid = await this.verifyStoredLicense(storedLicense);
        if (isValid) {
          this.isLicenseValid = true;
          this.startBackgroundVerification();
        } else {
          this.showLicenseWindow();
        }
      } catch (error) {
        this.handleLicenseError(error as Error, false);
      }
    } else {
      this.showLicenseWindow();
    }
  }

  public async verifyLicense(licenseKey: string) {
    try {
      const checkResponse = await this.makeGumroadRequest(licenseKey, false);
      if (checkResponse.success !== true) {
        throw new Error(checkResponse.message || "License verification failed");
      }
      this.validatePurchase(checkResponse.purchase);
      if (checkResponse.uses !== undefined && checkResponse.uses > 1) {
        throw new Error(
          "License key has already been activated. Please contact support if you believe this is an error."
        );
      }

      const isValid = await this.verifyWithGumroad(licenseKey, true);
      if (isValid) {
        this.isLicenseValid = true;
        this.store?.set("licenseKey", licenseKey);
      }
      return { success: isValid };
    } catch (error) {
      const errorType = this.getErrorType((error as Error).message);
      const errorConfig = ERROR_MESSAGES[errorType];
      return {
        success: false,
        error: errorConfig.message,
        details: {
          productId: GUMROAD_PRODUCT_ID,
          networkError: this.isNetworkError(error as Error),
        },
      };
    }
  }

  public async clearLicense() {
    try {
      // The processManager.kill method now expects a string name.
      processManager.kill("license-verifier");
      this.store?.delete("licenseKey");
      this.isLicenseValid = false;
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  public getIsLicenseValid() {
    return this.isLicenseValid;
  }

  public handleAppActivation() {
    if (BrowserWindow.getAllWindows().length === 0) {
      if (this.getIsLicenseValid()) {
        this.recreateWindow();
      } else {
        this.reverifyLicense();
      }
    }
  }

  private recreateWindow() {
    resetWindowManagerState();
    if (this.createMainWindow) {
      createSplashWindow().then(() => {
        this.createMainWindow!();
      });
    }
  }

  private async reverifyLicense() {
    const storedLicense = this.store?.get("licenseKey") as string;
    if (storedLicense) {
      try {
        const isValid = await this.verifyStoredLicense(storedLicense);
        if (isValid) {
          this.isLicenseValid = true;
          this.recreateWindow();
        } else {
          this.showLicenseWindow();
        }
      } catch {
        this.showLicenseWindow();
      }
    } else {
      this.showLicenseWindow();
    }
  }

  private async verifyStoredLicense(licenseKey: string) {
    if (!licenseKey) return false;

    try {
      const verificationPromise = this.verifyWithGumroad(licenseKey, false);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Verification timeout")), 5000)
      );
      const isValid = await Promise.race([verificationPromise, timeoutPromise]);
      if (isValid) {
        this.isLicenseValid = true;
        return true;
      }
    } catch (error) {
      this.handleLicenseError(error as Error, false);
    }
    return false;
  }

  private async startBackgroundVerification() {
    // Ensure no duplicates by killing any existing 'license-verifier' process.
    processManager.kill("license-verifier");

    // Register the background verification function with the process manager.
    processManager.register("license-verifier", async () => {
      const storedLicense = this.store?.get("licenseKey") as string;
      if (!storedLicense)
        return this.handleInvalidLicense("No license key found");

      try {
        const verificationPromise = this.verifyWithGumroad(
          storedLicense,
          false
        );
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Verification timeout")), 5000)
        );

        const isValid = await Promise.race([
          verificationPromise,
          timeoutPromise,
        ]);
        if (isValid) {
          this.isLicenseValid = true;
          this.notifyMainWindow("license-verified", { valid: true });
        } else {
          this.handleInvalidLicense("Invalid license key");
        }
      } catch (error) {
        Logger.error(
          `License verification failed: ${(error as Error).message}`
        );
        this.handleLicenseError(error as Error, false);
      }
    });

    // Start the registered 'license-verifier' process.
    processManager.start("license-verifier");
  }

  private handleInvalidLicense(reason: string) {
    const errorType = this.getErrorType(reason);
    if (
      [
        "transfer",
        "refunded",
        "chargebacked",
        "expired",
        "cancelled",
        "paymentFailed",
        "disabled",
      ].includes(errorType)
    ) {
      const errorConfig = ERROR_MESSAGES[errorType];
      this.closeMainWindow();
      setTimeout(() => {
        this.showLicenseWindow(errorConfig.title, errorConfig.message);
      }, 50);
      return;
    }
    this.isLicenseValid = false;
    this.notifyMainWindow("license-invalid", { reason });
    setTimeout(() => this.showLicenseWindow(), 5000);
  }

  private handleLicenseError(
    error: Error,
    shouldQuit = false,
    customMessage: string | null = null
  ) {
    const errorType = this.getErrorType(error.message);
    const errorConfig = ERROR_MESSAGES[errorType];
    this.closeMainWindow();
    setTimeout(() => {
      this.showLicenseWindow(
        errorConfig.title,
        customMessage || errorConfig.message
      );
      if (shouldQuit) app.quit();
    }, 50);
    this.isLicenseValid = false;
  }

  private async showLicenseWindow(errorTitle?: string, errorMessage?: string) {
    this.closeMainWindow();
    try {
      this.licenseWindow = await createLicenseWindow(this.rootPath, this.isDev);
      if (errorTitle && errorMessage && this.licenseWindow) {
        this.licenseWindow.webContents.send(
          "license-error",
          errorTitle,
          errorMessage
        );
      }
    } catch (error) {
      Logger.error(
        `Failed to show license window: ${(error as Error).message}`
      );
    }
  }

  private closeMainWindow() {
    if (this.mainWindowRef && !this.mainWindowRef.isDestroyed()) {
      this.mainWindowRef.close();
    }
  }

  private notifyMainWindow(event: string, data: any) {
    if (this.mainWindowRef && !this.mainWindowRef.isDestroyed()) {
      this.mainWindowRef.webContents.send(event, data);
    }
  }

  private isNetworkError(error: Error) {
    return (
      error.message.includes("timeout") ||
      error.message.includes("ENOTFOUND") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ETIMEDOUT")
    );
  }

  private getErrorType(errorMessage: string) {
    if (errorMessage.includes("activated on another device")) return "transfer";
    if (errorMessage.includes("refunded")) return "refunded";
    if (errorMessage.includes("chargebacked")) return "chargebacked";
    if (
      errorMessage.includes("subscription has ended") ||
      errorMessage.includes("access has expired")
    )
      return "expired";
    if (errorMessage.includes("subscription has been cancelled"))
      return "cancelled";
    if (errorMessage.includes("subscription payment failed"))
      return "paymentFailed";
    if (errorMessage.includes("disabled")) return "disabled";
    if (errorMessage.includes("already been activated")) return "alreadyUsed";
    return "verificationFailed";
  }

  private validatePurchase(purchase: any) {
    if (!purchase) return;
    if (purchase.refunded) throw new Error("License has been refunded.");
    if (purchase.chargebacked)
      throw new Error("License has been chargebacked.");
    if (purchase.subscription_ended_at)
      throw new Error("License subscription has ended.");
    if (purchase.subscription_cancelled_at)
      throw new Error("License subscription has been cancelled.");
    if (purchase.subscription_failed_at)
      throw new Error("License subscription payment failed.");
  }

  private makeGumroadRequest(
    licenseKey: string,
    incrementUsesCount: boolean
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        product_id: GUMROAD_PRODUCT_ID,
        license_key: licenseKey,
        increment_uses_count: incrementUsesCount,
      });
      const options = {
        hostname: "api.gumroad.com",
        port: 443,
        path: "/v2/licenses/verify",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: 10000,
      };
      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(
              new Error(`Failed to parse response: ${(error as Error).message}`)
            );
          }
        });
      });
      req.on("error", (error) =>
        reject(new Error(`Network error: ${error.message}`))
      );
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });
      req.write(postData);
      req.end();
    });
  }

  private async verifyWithGumroad(
    licenseKey: string,
    incrementUsesCount = false
  ): Promise<boolean> {
    if (!GUMROAD_PRODUCT_ID || GUMROAD_PRODUCT_ID.length < 10)
      throw new Error(
        "Invalid product ID. Please check your Gumroad configuration."
      );
    if (!licenseKey)
      throw new Error("No license key provided for verification.");

    const response = await this.makeGumroadRequest(
      licenseKey,
      incrementUsesCount
    );
    if (response.success === true) {
      this.validatePurchase(response.purchase);
      if (response.uses !== undefined && response.uses > 1) {
        throw new Error(
          "License key has already been activated on another device."
        );
      }
      return true;
    } else {
      throw new Error(response.message || "License verification failed");
    }
  }
}

export const licenseManager = new LicenseManager();
