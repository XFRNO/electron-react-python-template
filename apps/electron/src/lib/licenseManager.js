const { app } = require("electron");
const https = require("https");
const {
  createLicenseWindow,
  closeLicenseWindow,
} = require("../main/windows/licenseWindow");

// Product ID for Gumroad - this needs to be your actual product ID from Gumroad
// For products created after Jan 9, 2023, use the product ID, not permalink
const GUMROAD_PRODUCT_ID = "tbU32GxrR5IQl9j7KXzqRg==";

// Error messages configuration
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

// Shared state object
const licenseState = {
  store: null,
  isDev: false,
  rootPath: "",
  isLicenseValid: false,
  licenseWindow: null,
  mainWindowRef: null,
  backgroundVerificationInProgress: false,
  createMainWindow: null,
};

// Initialize the license manager with required dependencies
function initLicenseManager(store, isDev, rootPath) {
  licenseState.store = store;
  licenseState.isDev = isDev;
  licenseState.rootPath = rootPath;
  licenseState.isLicenseValid = false;
  licenseState.licenseWindow = null;
  licenseState.mainWindowRef = null;
  licenseState.backgroundVerificationInProgress = false;
  licenseState.createMainWindow = null;
}

// Helper method to close the main window safely
function closeMainWindow() {
  if (licenseState.mainWindowRef && !licenseState.mainWindowRef.isDestroyed()) {
    licenseState.mainWindowRef.close();
  }
}

// Helper method to notify main window
function notifyMainWindow(event, data) {
  if (licenseState.mainWindowRef && !licenseState.mainWindowRef.isDestroyed()) {
    licenseState.mainWindowRef.webContents.send(event, data);
  }
}

// Helper method to check if it's a network error
function isNetworkError(error) {
  return (
    error.message.includes("timeout") ||
    error.message.includes("ENOTFOUND") ||
    error.message.includes("ECONNREFUSED") ||
    error.message.includes("ETIMEDOUT")
  );
}

// Helper function to get error type from error message
function getErrorType(errorMessage) {
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

// Helper function to handle license errors consistently
function handleLicenseError(error, shouldQuit = false, customMessage = null) {
  const errorType = getErrorType(error.message);
  const errorConfig = ERROR_MESSAGES[errorType];

  closeMainWindow();

  setTimeout(() => {
    showLicenseWindow(errorConfig.title, customMessage || errorConfig.message);
    if (shouldQuit) {
      app.quit();
    }
  }, 50);

  licenseState.isLicenseValid = false;
}

async function onAppLaunch(createMainWindowFunc) {
  licenseState.createMainWindow = createMainWindowFunc;
  const storedLicense = licenseState.store.get("licenseKey");

  if (storedLicense) {
    // Create main window immediately for better UX
    licenseState.mainWindowRef = await licenseState.createMainWindow();

    // Attempt to verify the stored license in background
    verifyStoredLicense(storedLicense)
      .then((isValid) => {
        if (isValid) {
          licenseState.isLicenseValid = true;
          startBackgroundVerification();
        } else {
          showLicenseWindow();
        }
      })
      .catch((error) => {
        handleLicenseError(error, false);
      });
  } else {
    showLicenseWindow();
  }
}

async function startBackgroundVerification() {
  if (licenseState.backgroundVerificationInProgress) {
    return;
  }
  licenseState.backgroundVerificationInProgress = true;

  try {
    const storedLicense = licenseState.store.get("licenseKey");

    if (storedLicense) {
      // Add timeout for network request to avoid blocking
      const verificationPromise = verifyWithGumroad(storedLicense, false);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Verification timeout")), 5000)
      );

      try {
        const isValid = await Promise.race([
          verificationPromise,
          timeoutPromise,
        ]);

        if (isValid) {
          licenseState.isLicenseValid = true;
          notifyMainWindow("license-verified", { valid: true });
        } else {
          handleInvalidLicense("Invalid license key");
        }
      } catch (error) {
        handleLicenseError(error, true);
      }
    } else {
      // Give user a grace period to enter license
      setTimeout(() => {
        if (!licenseState.isLicenseValid) {
          handleInvalidLicense("No license key found");
        }
      }, 30000); // 30 second grace period
    }
  } finally {
    licenseState.backgroundVerificationInProgress = false;
  }
}

function handleInvalidLicense(reason) {
  const errorType = getErrorType(reason);

  // For critical errors, close immediately
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
    closeMainWindow();
    setTimeout(() => {
      showLicenseWindow(errorConfig.title, errorConfig.message);
    }, 50);
    return;
  }

  licenseState.isLicenseValid = false;
  notifyMainWindow("license-invalid", { reason });

  // Show license window after a brief delay for non-critical errors
  setTimeout(() => {
    showLicenseWindow();
  }, 5000);
}

async function verifyStoredLicense(licenseKey) {
  if (!licenseKey) {
    return false;
  }

  try {
    const verificationPromise = verifyWithGumroad(licenseKey, false);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Verification timeout")), 5000)
    );

    const isValid = await Promise.race([verificationPromise, timeoutPromise]);

    if (isValid) {
      licenseState.isLicenseValid = true;
      return true;
    }
  } catch (error) {
    handleLicenseError(error, false);
    return false;
  }

  return false;
}

async function verifyLicense(licenseKey) {
  try {
    // First, check the license status without incrementing the uses count
    const checkResponse = await makeGumroadRequest(licenseKey, false);

    // Check if the response indicates success
    if (checkResponse.success !== true) {
      throw new Error(checkResponse.message || "License verification failed");
    }

    // Validate the purchase
    validatePurchase(checkResponse.purchase);

    // Check if the license has already been used
    if (checkResponse.uses !== undefined && checkResponse.uses > 1) {
      throw new Error(
        "License key has already been activated. Please contact support if you believe this is an error."
      );
    }

    // If we get here, the license is valid and hasn't been used yet
    const isValid = await verifyWithGumroad(licenseKey, true);
    if (isValid) {
      licenseState.isLicenseValid = true;
      licenseState.store.set("licenseKey", licenseKey);
    }

    return { success: isValid };
  } catch (error) {
    const errorType = getErrorType(error.message);
    const errorConfig = ERROR_MESSAGES[errorType];

    return {
      success: false,
      error: errorConfig.message,
      details: {
        productId: GUMROAD_PRODUCT_ID,
        networkError: isNetworkError(error),
      },
    };
  }
}

// Helper function to validate purchase data
function validatePurchase(purchase) {
  if (!purchase) return;

  if (purchase.refunded === true) {
    throw new Error(
      "License has been refunded. Please contact support if you believe this is an error."
    );
  }

  if (purchase.chargebacked === true) {
    throw new Error(
      "License has been chargebacked. Please contact support if you believe this is an error."
    );
  }

  if (
    purchase.subscription_ended_at !== null &&
    purchase.subscription_ended_at !== undefined
  ) {
    throw new Error(
      "License subscription has ended. Please contact support to renew your subscription."
    );
  }

  if (
    purchase.subscription_cancelled_at !== null &&
    purchase.subscription_cancelled_at !== undefined
  ) {
    throw new Error(
      "License subscription has been cancelled. Please contact support to renew your subscription."
    );
  }

  if (
    purchase.subscription_failed_at !== null &&
    purchase.subscription_failed_at !== undefined
  ) {
    throw new Error(
      "License subscription payment failed. Please update your payment method to continue using the service."
    );
  }
}

// Helper function to make Gumroad API request
function makeGumroadRequest(licenseKey, incrementUsesCount) {
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

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Network error: ${error.message}`));
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.write(postData);
    req.end();
  });
}

async function verifyWithGumroad(licenseKey, incrementUsesCount = false) {
  // Validate inputs
  if (!GUMROAD_PRODUCT_ID || GUMROAD_PRODUCT_ID.length < 10) {
    throw new Error(
      "Invalid product ID. Please check your Gumroad product configuration."
    );
  }

  if (!licenseKey) {
    throw new Error("No license key provided for verification");
  }

  try {
    const response = await makeGumroadRequest(licenseKey, incrementUsesCount);

    if (response.success === true) {
      // Validate the purchase data
      validatePurchase(response.purchase);

      // Check the uses count to enforce one license per purchase
      if (response.uses !== undefined && response.uses > 1) {
        throw new Error(
          "License key has already been activated. Please contact support if you believe this is an error."
        );
      }

      return true;
    } else {
      // Handle specific error messages from Gumroad
      if (response.message?.includes("product")) {
        throw new Error(`Invalid product ID: ${response.message}`);
      }

      if (
        response.message?.includes("uses") ||
        response.message?.includes("already")
      ) {
        throw new Error(
          "License key has already been activated on another device. Please contact support to transfer your license."
        );
      }

      if (response.message?.includes("disabled")) {
        throw new Error(
          "This license key has been disabled. Please contact support for assistance."
        );
      }

      if (response.message?.includes("expired")) {
        throw new Error(
          "Access to the purchase associated with this license has expired. Please contact support to renew your subscription."
        );
      }

      return false;
    }
  } catch (error) {
    throw error;
  }
}

async function showLicenseWindow(errorTitle, errorMessage) {
  closeMainWindow();

  try {
    licenseState.licenseWindow = await createLicenseWindow(
      licenseState.rootPath,
      licenseState.isDev
    );

    // If we have error information, send it to the license window
    if (errorTitle && errorMessage && licenseState.licenseWindow) {
      licenseState.licenseWindow.webContents.send(
        "license-error",
        errorTitle,
        errorMessage
      );
    }
  } catch (error) {
    // Silently fail - the error has already been logged by the window creation function
  }
}

async function openMainAppWindow(createWindow) {
  closeLicenseWindow();
  closeMainWindow();
  await createWindow();
}

async function clearLicense() {
  try {
    licenseState.store.delete("licenseKey");
    licenseState.isLicenseValid = false;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function setLicenseValid(valid) {
  licenseState.isLicenseValid = valid;
}

function getIsLicenseValid() {
  return licenseState.isLicenseValid;
}

// Export all functions
module.exports = {
  initLicenseManager,
  onAppLaunch,
  startBackgroundVerification,
  handleInvalidLicense,
  verifyStoredLicense,
  verifyLicense,
  verifyWithGumroad,
  showLicenseWindow,
  openMainAppWindow,
  clearLicense,
  setLicenseValid,
  getIsLicenseValid,
  closeMainWindow,
};
