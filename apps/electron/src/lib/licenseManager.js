const { app } = require("electron");
const path = require("path");
const https = require("https");
const {
  createLicenseWindow,
  closeLicenseWindow,
} = require("../main/windows/licenseWindow");

// Product ID for Gumroad - this needs to be your actual product ID from Gumroad
// For products created after Jan 9, 2023, use the product ID, not permalink
const GUMROAD_PRODUCT_ID = "tbU32GxrR5IQl9j7KXzqRg==";

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
  console.log("Closing main window");
  if (licenseState.mainWindowRef && !licenseState.mainWindowRef.isDestroyed()) {
    console.log("Main window is valid, closing it");
    licenseState.mainWindowRef.close();
    console.log("Main window closed successfully");
  } else {
    console.log("Main window is already closed or invalid");
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

async function onAppLaunch(createMainWindowFunc) {
  console.time("License.onAppLaunch"); // Start timing for onAppLaunch
  console.log("License.onAppLaunch called");

  // Store the createMainWindow function for later use
  licenseState.createMainWindow = createMainWindowFunc;

  const storedLicense = licenseState.store.get("licenseKey");
  console.log(`Stored license key found: ${storedLicense ? "YES" : "NO"}`);
  if (storedLicense) {
    console.log(
      `Stored license key (first 5 chars): ${storedLicense.substring(
        0,
        5
      )}*****`
    );
  }

  if (storedLicense) {
    console.log("Found stored license, attempting to verify...");
    // Create main window immediately for better UX
    licenseState.mainWindowRef = await licenseState.createMainWindow();

    // Attempt to verify the stored license in background
    verifyStoredLicense(storedLicense)
      .then((isValid) => {
        if (isValid) {
          console.log("Stored license is valid.");
          licenseState.isLicenseValid = true;
          startBackgroundVerification(); // Start background verification for renewal/revocation
        } else {
          console.log("Stored license is invalid. Showing license window.");
          showLicenseWindow();
        }
      })
      .catch((error) => {
        console.error(
          "License verification error in onAppLaunch - Full error object:",
          JSON.stringify(error, Object.getOwnPropertyNames(error))
        );
        console.error(
          "License verification error in onAppLaunch - Stack trace:",
          error.stack
        );

        // Handle license transfer error specifically
        if (error.message.includes("activated on another device")) {
          console.log("License has been transferred to another device");
          // Close the main window and show license window with error message
          closeMainWindow();
          showLicenseWindow(
            "License Transfer Detected",
            "This license key has been activated on another device. Please contact support at contact@xfrno.com to transfer your license back to this device."
          );
          return;
        }
        // Handle refunded licenses
        else if (error.message.includes("refunded")) {
          console.log("License has been refunded");
          // Close the main window and show license window with error message
          closeMainWindow();
          showLicenseWindow(
            "License Refunded",
            "This license has been refunded. Please contact support at contact@xfrno.com if you believe this is an error."
          );
          return;
        }
        // Handle chargebacked licenses
        else if (error.message.includes("chargebacked")) {
          console.log("License has been chargebacked");
          // Close the main window and show license window with error message
          closeMainWindow();
          showLicenseWindow(
            "License Chargebacked",
            "This license has been chargebacked. Please contact support at contact@xfrno.com if you believe this is an error."
          );
          return;
        }
        // Handle subscription expired/ended
        else if (
          error.message.includes("subscription has ended") ||
          error.message.includes("access has expired")
        ) {
          console.log("License subscription has expired");
          // Close the main window and show license window with error message
          closeMainWindow();
          showLicenseWindow(
            "Subscription Expired",
            "This license subscription has expired. Please contact support at contact@xfrno.com to renew your subscription."
          );
          return;
        }
        // Handle subscription cancelled
        else if (error.message.includes("subscription has been cancelled")) {
          console.log("License subscription has been cancelled");
          // Close the main window and show license window with error message
          closeMainWindow();
          showLicenseWindow(
            "Subscription Cancelled",
            "This license subscription has been cancelled. Please contact support at contact@xfrno.com to renew your subscription."
          );
          return;
        }
        // Handle subscription payment failed
        else if (error.message.includes("subscription payment failed")) {
          console.log("License subscription payment failed");
          // Close the main window and show license window with error message
          closeMainWindow();
          showLicenseWindow(
            "Subscription Payment Failed",
            "This license subscription payment failed. Please update your payment method to continue using the service. For assistance, contact support at contact@xfrno.com."
          );
          return;
        }
        // Handle disabled licenses
        else if (error.message.includes("disabled")) {
          console.log("License has been disabled");
          // Close the main window and show license window with error message
          closeMainWindow();
          showLicenseWindow(
            "License Disabled",
            "This license key has been disabled. Please contact support at contact@xfrno.com for assistance."
          );
          return;
        }
        // Handle already activated licenses (uses count > 1)
        else if (error.message.includes("already been activated")) {
          console.log("License has already been activated");
          // Close the main window and show license window with error message
          closeMainWindow();
          showLicenseWindow(
            "License Already Used",
            "This license key has already been activated. Please contact support at contact@xfrno.com if you believe this is an error."
          );
          return;
        }
        // Handle all other license errors
        else {
          console.log("License verification failed with unknown error");
          // Close the main window and show license window with error message
          closeMainWindow();
          showLicenseWindow(
            "License Verification Failed",
            `License verification failed: ${error.message}`
          );
          return;
        }
      });
  } else {
    console.log("No stored license found. Showing license window.");
    showLicenseWindow();
  }
  console.timeEnd("License.onAppLaunch"); // End timing for onAppLaunch
}

async function startBackgroundVerification() {
  console.time("License.startBackgroundVerification"); // Start timing for startBackgroundVerification
  console.log("Starting background license verification");

  if (licenseState.backgroundVerificationInProgress) {
    console.timeEnd("License.startBackgroundVerification"); // End timing if already in progress
    console.log("Background verification already in progress, skipping");
    return;
  }
  licenseState.backgroundVerificationInProgress = true;

  try {
    const storedLicense = licenseState.store.get("licenseKey");
    console.log(
      `Background verification - stored license key found: ${
        storedLicense ? "YES" : "NO"
      }`
    );
    if (storedLicense) {
      console.log(
        `Background verification - stored license key (first 5 chars): ${storedLicense.substring(
          0,
          5
        )}*****`
      );
    }

    if (storedLicense) {
      console.log("Verifying stored license in background...");

      // Add timeout for network request to avoid blocking
      // For background verification, we don't want to increment the uses count
      const verificationPromise = verifyWithGumroad(storedLicense, false);
      const timeoutPromise = new Promise(
        (_, reject) =>
          setTimeout(() => reject(new Error("Verification timeout")), 5000) // Reduced timeout to 5 seconds
      );

      try {
        const isValid = await Promise.race([
          verificationPromise,
          timeoutPromise,
        ]);

        if (isValid) {
          licenseState.isLicenseValid = true;
          console.log("Background license verification successful");
          // Send success message to main window
          notifyMainWindow("license-verified", { valid: true });
        } else {
          console.log("Stored license is invalid");
          handleInvalidLicense("Invalid license key");
        }
      } catch (error) {
        console.error(
          "Background license verification error - Full error object:",
          JSON.stringify(error, Object.getOwnPropertyNames(error))
        );
        console.error(
          "Background license verification error - Stack trace:",
          error.stack
        );
        console.log("Background license verification failed:", error.message);

        // If it's a license transfer error, handle it specifically
        if (error.message.includes("activated on another device")) {
          console.log("License has been transferred to another device");
          handleInvalidLicense("License transferred to another device");
          // Close the main window and show license window with error message
          closeMainWindow();
          showLicenseWindow(
            "License Transfer Detected",
            "This license key has been activated on another device. The application will now close. Please contact support at contact@xfrno.com to transfer your license back to this device."
          );
          app.quit();
          return;
        }
        // Handle refunded licenses
        else if (error.message.includes("refunded")) {
          console.log("License has been refunded");
          handleInvalidLicense("License refunded");
          // Close the main window and show license window with error message
          closeMainWindow();
          showLicenseWindow(
            "License Refunded",
            "This license has been refunded. Please contact support at contact@xfrno.com if you believe this is an error."
          );
          // Don't clear the license - keep it for reference
          licenseState.isLicenseValid = false;
          app.quit();
          return;
        }
        // Handle chargebacked licenses
        else if (error.message.includes("chargebacked")) {
          console.log("License has been chargebacked");
          handleInvalidLicense("License chargebacked");
          // Close the main window and show license window with error message
          closeMainWindow();
          showLicenseWindow(
            "License Chargebacked",
            "This license has been chargebacked. Please contact support at contact@xfrno.com if you believe this is an error."
          );
          // Don't clear the license - keep it for reference
          licenseState.isLicenseValid = false;
          app.quit();
          return;
        }
        // Handle subscription expired/ended
        else if (
          error.message.includes("subscription has ended") ||
          error.message.includes("access has expired")
        ) {
          console.log("License subscription has expired");
          handleInvalidLicense("Subscription expired");
          // Close the main window and show license window with error message
          closeMainWindow();
          showLicenseWindow(
            "Subscription Expired",
            "This license subscription has expired. Please contact support at contact@xfrno.com to renew your subscription."
          );
          // Don't clear the license - keep it for reference
          licenseState.isLicenseValid = false;
          app.quit();
          return;
        }
        // Handle subscription cancelled
        else if (error.message.includes("subscription has been cancelled")) {
          console.log("License subscription has been cancelled");
          handleInvalidLicense("Subscription cancelled");
          // Close the main window and show license window with error message
          closeMainWindow();
          showLicenseWindow(
            "Subscription Cancelled",
            "This license subscription has been cancelled. Please contact support at contact@xfrno.com to renew your subscription."
          );
          // Don't clear the license - keep it for reference
          licenseState.isLicenseValid = false;
          app.quit();
          return;
        }
        // Handle subscription payment failed
        else if (error.message.includes("subscription payment failed")) {
          console.log("License subscription payment failed");
          handleInvalidLicense("Subscription payment failed");
          // Close the main window and show license window with error message
          closeMainWindow();
          showLicenseWindow(
            "Subscription Payment Failed",
            "This license subscription payment failed. Please update your payment method to continue using the service."
          );
          // Don't clear the license - keep it for reference
          licenseState.isLicenseValid = false;
          app.quit();
          return;
        }
        // Handle disabled licenses
        else if (error.message.includes("disabled")) {
          console.log("License has been disabled");
          handleInvalidLicense("License disabled");
          // Close the main window and show license window with error message
          closeMainWindow();
          showLicenseWindow(
            "License Disabled",
            "This license key has been disabled. Please contact support at contact@xfrno.com for assistance."
          );
          // Don't clear the license - keep it for reference
          licenseState.isLicenseValid = false;
          app.quit();
          return;
        }
        // Handle all other license errors
        else {
          console.log("License verification failed with unknown error");
          handleInvalidLicense("License verification failed");
          // Close the main window and show license window with error message
          closeMainWindow();
          showLicenseWindow(
            "License Verification Failed",
            `License verification failed: ${error.message}`
          );
          // Don't clear the license - keep it for reference
          licenseState.isLicenseValid = false;
          app.quit();
          return;
        }
      }
    } else {
      console.log("No stored license found");
      // Give user a grace period to enter license
      setTimeout(() => {
        if (!licenseState.isLicenseValid) {
          handleInvalidLicense("No license key found");
        }
      }, 30000); // 30 second grace period
    }
  } finally {
    licenseState.backgroundVerificationInProgress = false;
    console.timeEnd("License.startBackgroundVerification"); // End timing for startBackgroundVerification
  }
}

function handleInvalidLicense(reason) {
  console.time("License.handleInvalidLicense"); // Start timing for handleInvalidLicense
  console.log("Handling invalid license:", reason);

  // Check if this is a license transfer issue
  if (reason.includes("transfer")) {
    console.log("License transfer detected, closing app");
    // Close the main window immediately
    closeMainWindow();
    // Show the license window with error message
    setTimeout(() => {
      showLicenseWindow(
        "License Transfer Detected",
        "This license key has been activated on another device. The application will now close. Please contact support at contact@xfrno.com to transfer your license back to this device."
      );
    }, 50);
    console.timeEnd("License.handleInvalidLicense"); // End timing for handleInvalidLicense
    return;
  }
  // Handle refunded licenses
  else if (reason.includes("refunded")) {
    console.log("License refunded, closing app");
    // Close the main window immediately
    closeMainWindow();
    // Show the license window with error message
    setTimeout(() => {
      showLicenseWindow(
        "License Refunded",
        "This license has been refunded. Please contact support at contact@xfrno.com if you believe this is an error."
      );
    }, 50);
    console.timeEnd("License.handleInvalidLicense"); // End timing for handleInvalidLicense
    return;
  }
  // Handle chargebacked licenses
  else if (reason.includes("chargebacked")) {
    console.log("License chargebacked, closing app");
    // Close the main window immediately
    closeMainWindow();
    // Show the license window with error message
    setTimeout(() => {
      showLicenseWindow(
        "License Chargebacked",
        "This license has been chargebacked. Please contact support at contact@xfrno.com if you believe this is an error."
      );
    }, 50);
    console.timeEnd("License.handleInvalidLicense"); // End timing for handleInvalidLicense
    return;
  }
  // Handle subscription expired/ended
  else if (reason.includes("expired") || reason.includes("ended")) {
    console.log("Subscription expired, closing app");
    // Close the main window immediately
    closeMainWindow();
    // Show the license window with error message
    setTimeout(() => {
      showLicenseWindow(
        "Subscription Expired",
        "This license subscription has expired. Please contact support at contact@xfrno.com to renew your subscription."
      );
    }, 50);
    console.timeEnd("License.handleInvalidLicense"); // End timing for handleInvalidLicense
    return;
  }
  // Handle subscription cancelled
  else if (reason.includes("cancelled")) {
    console.log("Subscription cancelled, closing app");
    // Close the main window immediately
    closeMainWindow();
    // Show the license window with error message
    setTimeout(() => {
      showLicenseWindow(
        "Subscription Cancelled",
        "This license subscription has been cancelled. Please contact support at contact@xfrno.com to renew your subscription."
      );
    }, 50);
    console.timeEnd("License.handleInvalidLicense"); // End timing for handleInvalidLicense
    return;
  }
  // Handle subscription payment failed
  else if (reason.includes("payment failed")) {
    console.log("Subscription payment failed, closing app");
    // Close the main window immediately
    closeMainWindow();
    // Show the license window with error message
    setTimeout(() => {
      showLicenseWindow(
        "Subscription Payment Failed",
        "This license subscription payment failed. Please update your payment method to continue using the service."
      );
    }, 50);
    console.timeEnd("License.handleInvalidLicense"); // End timing for handleInvalidLicense
    return;
  }
  // Handle disabled licenses
  else if (reason.includes("disabled")) {
    console.log("License disabled, closing app");
    // Close the main window immediately
    closeMainWindow();
    // Show the license window with error message
    setTimeout(() => {
      showLicenseWindow(
        "License Disabled",
        "This license key has been disabled. Please contact support at contact@xfrno.com for assistance."
      );
    }, 50);
    console.timeEnd("License.handleInvalidLicense"); // End timing for handleInvalidLicense
    return;
  }

  licenseState.isLicenseValid = false;

  // Notify main window about license issue
  notifyMainWindow("license-invalid", { reason });

  // Show license window after a brief delay to allow user to finish what they're doing
  setTimeout(() => {
    showLicenseWindow();
  }, 5000); // 5 second delay before showing license window
  console.timeEnd("License.handleInvalidLicense"); // End timing for handleInvalidLicense
}

async function verifyStoredLicense(licenseKey) {
  console.time("License.verifyStoredLicense"); // Start timing for verifyStoredLicense
  console.log(
    `Verifying stored license key: ${
      licenseKey ? licenseKey.substring(0, 5) + "*****" : "NULL"
    }`
  );

  try {
    // Add timeout for network request to avoid blocking
    // For stored license verification, we don't want to increment the uses count
    const verificationPromise = verifyWithGumroad(licenseKey, false);
    const timeoutPromise = new Promise(
      (_, reject) =>
        setTimeout(() => reject(new Error("Verification timeout")), 5000) // 5 second timeout
    );

    const isValid = await Promise.race([verificationPromise, timeoutPromise]);

    if (isValid) {
      licenseState.isLicenseValid = true;
      console.timeEnd("License.verifyStoredLicense"); // End timing for verifyStoredLicense
      console.log(
        `Stored license verification successful for key: ${licenseKey.substring(
          0,
          5
        )}*****`
      );
      return true;
    } else {
      console.log(
        `Stored license verification failed for key: ${licenseKey.substring(
          0,
          5
        )}*****`
      );
    }
  } catch (error) {
    console.error(
      "License verification error - Full error object:",
      JSON.stringify(error, Object.getOwnPropertyNames(error))
    );
    console.error("License verification error - Stack trace:", error.stack);

    // Handle license transfer error specifically
    if (error.message.includes("activated on another device")) {
      console.log(
        `License transfer detected for key: ${licenseKey.substring(0, 5)}*****`
      );
      // Close the main window immediately
      closeMainWindow();
      // Show the license window with error message
      setTimeout(() => {
        showLicenseWindow(
          "License Transfer Required",
          "This license key has already been activated on another device. Please contact support at contact@xfrno.com to transfer your license or purchase a new license key."
        );
      }, 50);
    }
    // Handle refunded licenses
    else if (error.message.includes("refunded")) {
      console.log(
        `License refunded for key: ${licenseKey.substring(0, 5)}*****`
      );
      // Close the main window immediately
      closeMainWindow();
      // Show the license window with error message
      setTimeout(() => {
        showLicenseWindow(
          "License Refunded",
          "This license has been refunded. Please contact support at contact@xfrno.com if you believe this is an error."
        );
      }, 50);
      // Don't clear the license - keep it for reference
      licenseState.isLicenseValid = false;
    }
    // Handle chargebacked licenses
    else if (error.message.includes("chargebacked")) {
      console.log(
        `License chargebacked for key: ${licenseKey.substring(0, 5)}*****`
      );
      // Close the main window immediately
      closeMainWindow();
      // Show the license window with error message
      setTimeout(() => {
        showLicenseWindow(
          "License Chargebacked",
          "This license has been chargebacked. Please contact support at contact@xfrno.com if you believe this is an error."
        );
      }, 50);
      // Don't clear the license - keep it for reference
      licenseState.isLicenseValid = false;
    }
    // Handle subscription expired/ended
    else if (
      error.message.includes("subscription has ended") ||
      error.message.includes("access has expired")
    ) {
      console.log(
        `License subscription expired for key: ${licenseKey.substring(
          0,
          5
        )}*****`
      );
      // Close the main window immediately
      closeMainWindow();
      // Show the license window with error message
      setTimeout(() => {
        showLicenseWindow(
          "Subscription Expired",
          "This license subscription has expired. Please contact support at contact@xfrno.com to renew your subscription."
        );
      }, 50);
      // Don't clear the license - keep it for reference
      licenseState.isLicenseValid = false;
    }
    // Handle subscription cancelled
    else if (error.message.includes("subscription has been cancelled")) {
      console.log(
        `License subscription cancelled for key: ${licenseKey.substring(
          0,
          5
        )}*****`
      );
      // Close the main window immediately
      closeMainWindow();
      // Show the license window with error message
      setTimeout(() => {
        showLicenseWindow(
          "Subscription Cancelled",
          "This license subscription has been cancelled. Please contact support at contact@xfrno.com to renew your subscription."
        );
      }, 50);
      // Don't clear the license - keep it for reference
      licenseState.isLicenseValid = false;
    }
    // Handle subscription payment failed
    else if (error.message.includes("subscription payment failed")) {
      console.log(
        `License subscription payment failed for key: ${licenseKey.substring(
          0,
          5
        )}*****`
      );
      // Close the main window immediately
      closeMainWindow();
      // Show the license window with error message
      setTimeout(() => {
        showLicenseWindow(
          "Subscription Payment Failed",
          "This license subscription payment failed. Please update your payment method to continue using the service."
        );
      }, 50);
      // Don't clear the license - keep it for reference
      licenseState.isLicenseValid = false;
    }
    // Handle disabled licenses
    else if (error.message.includes("disabled")) {
      console.log(
        `License disabled for key: ${licenseKey.substring(0, 5)}*****`
      );
      // Close the main window immediately
      closeMainWindow();
      // Show the license window with error message
      setTimeout(() => {
        showLicenseWindow(
          "License Disabled",
          "This license key has been disabled. Please contact support at contact@xfrno.com for assistance."
        );
      }, 50);
      // Don't clear the license - keep it for reference
      licenseState.isLicenseValid = false;
    }
    // Handle already activated licenses (uses count > 1)
    else if (error.message.includes("already been activated")) {
      console.log(
        `License already used for key: ${licenseKey.substring(0, 5)}*****`
      );
      // Close the main window immediately
      closeMainWindow();
      // Show the license window with error message
      setTimeout(() => {
        showLicenseWindow(
          "License Already Used",
          "This license key has already been activated. Please contact support at contact@xfrno.com if you believe this is an error."
        );
      }, 50);
      // Don't clear the license - keep it for reference
      licenseState.isLicenseValid = false;
      // Return false to indicate invalid license
      console.timeEnd("License.verifyStoredLicense"); // End timing for verifyStoredLicense
      return false;
    }
    // Handle all other license errors
    else {
      console.log(
        `License verification failed for key: ${licenseKey.substring(
          0,
          5
        )}*****`
      );
      // Close the main window immediately
      closeMainWindow();
      // Show the license window with error message
      setTimeout(() => {
        showLicenseWindow(
          "License Verification Failed",
          `License verification failed: ${error.message}`
        );
      }, 50);
      // Don't clear the license - keep it for reference
      licenseState.isLicenseValid = false;
    }

    // For any error case, return false to indicate invalid license
    console.timeEnd("License.verifyStoredLicense"); // End timing for verifyStoredLicense
    return false;
  }
  console.timeEnd("License.verifyStoredLicense"); // End timing for verifyStoredLicense
  return false;
}

async function verifyLicense(licenseKey) {
  console.time("License.verifyLicense"); // Start timing for verifyLicense
  console.log(
    `Starting license verification for key: ${
      licenseKey ? licenseKey.substring(0, 5) + "*****" : "NULL"
    }`
  );

  try {
    // First, check the license status without incrementing the uses count
    const checkResponse = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        product_id: GUMROAD_PRODUCT_ID,
        license_key: licenseKey,
        increment_uses_count: false, // Don't increment yet
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

    // Check if the response indicates success
    if (checkResponse.success !== true) {
      // Handle various error cases
      if (checkResponse.message && checkResponse.message.includes("disabled")) {
        throw new Error(
          "This license key has been disabled. Please contact support for assistance."
        );
      } else if (
        checkResponse.message &&
        checkResponse.message.includes("expired")
      ) {
        throw new Error(
          "Access to the purchase associated with this license has expired. Please contact support to renew your subscription."
        );
      } else if (
        checkResponse.message &&
        (checkResponse.message.includes("uses") ||
          checkResponse.message.includes("already"))
      ) {
        throw new Error(
          "License key has already been activated. Please contact support if you believe this is an error."
        );
      } else {
        throw new Error(checkResponse.message || "License verification failed");
      }
    }

    // Check if the license has been refunded, chargebacked, or has subscription issues
    if (checkResponse.purchase) {
      if (checkResponse.purchase.refunded === true) {
        throw new Error(
          "License has been refunded. Please contact support if you believe this is an error."
        );
      }
      if (checkResponse.purchase.chargebacked === true) {
        throw new Error(
          "License has been chargebacked. Please contact support if you believe this is an error."
        );
      }
      if (
        checkResponse.purchase.subscription_ended_at !== null &&
        checkResponse.purchase.subscription_ended_at !== undefined
      ) {
        throw new Error(
          "License subscription has ended. Please contact support to renew your subscription."
        );
      }
      if (
        checkResponse.purchase.subscription_cancelled_at !== null &&
        checkResponse.purchase.subscription_cancelled_at !== undefined
      ) {
        throw new Error(
          "License subscription has been cancelled. Please contact support to renew your subscription."
        );
      }
      if (
        checkResponse.purchase.subscription_failed_at !== null &&
        checkResponse.purchase.subscription_failed_at !== undefined
      ) {
        throw new Error(
          "License subscription payment failed. Please update your payment method to continue using the service."
        );
      }
    }

    // Check if the license has already been used
    if (checkResponse.uses !== undefined && checkResponse.uses > 1) {
      console.log(
        `License already used (uses: ${
          checkResponse.uses
        }) for key: ${licenseKey.substring(0, 5)}*****`
      );
      throw new Error(
        "License key has already been activated. Please contact support if you believe this is an error."
      );
    }

    // If we get here, the license is valid and hasn't been used yet
    // Now we can safely activate it by incrementing the uses count
    const isValid = await verifyWithGumroad(licenseKey, true);
    if (isValid) {
      licenseState.isLicenseValid = true;
      licenseState.store.set("licenseKey", licenseKey);
      console.log(
        `License verification successful, stored key: ${licenseKey.substring(
          0,
          5
        )}*****`
      );
    } else {
      console.log(
        `License verification failed for key: ${licenseKey.substring(
          0,
          5
        )}*****`
      );
    }
    console.timeEnd("License.verifyLicense"); // End timing for verifyLicense
    return { success: isValid };
  } catch (error) {
    console.error("License verification failed:", error);
    console.timeEnd("License.verifyLicense"); // End timing for verifyLicense

    // Return a more detailed error message
    let errorMessage = error.message;
    if (error.message.includes("activated on another device")) {
      errorMessage =
        "License key has already been activated on another device. Please contact support to transfer your license.";
    } else if (error.message.includes("refunded")) {
      errorMessage =
        "License has been refunded. Please contact support if you believe this is an error.";
    } else if (error.message.includes("chargebacked")) {
      errorMessage =
        "License has been chargebacked. Please contact support if you believe this is an error.";
    } else if (error.message.includes("subscription has ended")) {
      errorMessage =
        "License subscription has ended. Please contact support to renew your subscription.";
    } else if (error.message.includes("subscription has been cancelled")) {
      errorMessage =
        "License subscription has been cancelled. Please contact support to renew your subscription.";
    } else if (error.message.includes("subscription payment failed")) {
      errorMessage =
        "License subscription payment failed. Please update your payment method to continue using the service.";
    } else if (error.message.includes("already been activated")) {
      errorMessage =
        "License key has already been activated. Please contact support if you believe this is an error.";
    }

    return {
      success: false,
      error: errorMessage,
      details: {
        productId: GUMROAD_PRODUCT_ID,
        networkError: isNetworkError(error),
      },
    };
  }
}

async function verifyWithGumroad(licenseKey, incrementUsesCount = false) {
  console.time("License.verifyWithGumroad"); // Start timing for verifyWithGumroad

  // Log the license key being verified (first 5 characters for privacy)
  console.log(
    `Verifying license key: ${
      licenseKey ? licenseKey.substring(0, 5) + "*****" : "NULL"
    }`
  );

  // Check if product ID is valid (not empty or obviously wrong)
  if (!GUMROAD_PRODUCT_ID || GUMROAD_PRODUCT_ID.length < 10) {
    console.error(
      "Invalid Gumroad product ID detected. Please check GUMROAD_PRODUCT_ID in licenseManager.js"
    );
    console.timeEnd("License.verifyWithGumroad");
    throw new Error(
      "Invalid product ID. Please check your Gumroad product configuration."
    );
  }

  // Check if license key is provided
  if (!licenseKey) {
    console.error("No license key provided for verification");
    console.timeEnd("License.verifyWithGumroad");
    throw new Error("No license key provided for verification");
  }

  return new Promise((resolve, reject) => {
    // For background verification, we don't want to increment the uses count
    // This prevents false multiple-activation detections from Gumroad
    console.log(
      `Gumroad verification - increment_uses_count: ${incrementUsesCount}`
    );

    const postData = JSON.stringify({
      product_id: GUMROAD_PRODUCT_ID,
      license_key: licenseKey,
      increment_uses_count: incrementUsesCount,
    });

    console.log(`Sending request to Gumroad API with payload: ${postData}`);

    const options = {
      hostname: "api.gumroad.com",
      port: 443,
      path: "/v2/licenses/verify",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
      timeout: 10000, // Increase timeout to 10 seconds
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          console.timeEnd("License.verifyWithGumroad"); // End timing for verifyWithGumroad

          // Log the entire response from Gumroad for debugging
          console.log(
            `Gumroad API response: ${JSON.stringify(response, null, 2)}`
          );

          // Check if the response indicates success
          if (response.success === true) {
            // Check if the license has been revoked (refunded, chargebacked, or subscription issues)
            if (response.purchase) {
              // Check if the license has been refunded
              if (response.purchase.refunded === true) {
                console.log(
                  `License has been refunded for key: ${licenseKey.substring(
                    0,
                    5
                  )}*****`
                );
                reject(
                  new Error(
                    "License has been refunded. Please contact support if you believe this is an error."
                  )
                );
                return;
              }

              // Check if the license has been chargebacked
              if (response.purchase.chargebacked === true) {
                console.log(
                  `License has been chargebacked for key: ${licenseKey.substring(
                    0,
                    5
                  )}*****`
                );
                reject(
                  new Error(
                    "License has been chargebacked. Please contact support if you believe this is an error."
                  )
                );
                return;
              }

              // Check if subscription has ended
              if (
                response.purchase.subscription_ended_at !== null &&
                response.purchase.subscription_ended_at !== undefined
              ) {
                console.log(
                  `License subscription has ended for key: ${licenseKey.substring(
                    0,
                    5
                  )}*****`
                );
                reject(
                  new Error(
                    "License subscription has ended. Please contact support to renew your subscription."
                  )
                );
                return;
              }

              // Check if subscription has been cancelled
              if (
                response.purchase.subscription_cancelled_at !== null &&
                response.purchase.subscription_cancelled_at !== undefined
              ) {
                console.log(
                  `License subscription has been cancelled for key: ${licenseKey.substring(
                    0,
                    5
                  )}*****`
                );
                reject(
                  new Error(
                    "License subscription has been cancelled. Please contact support to renew your subscription."
                  )
                );
                return;
              }

              // Check if subscription payment has failed
              if (
                response.purchase.subscription_failed_at !== null &&
                response.purchase.subscription_failed_at !== undefined
              ) {
                console.log(
                  `License subscription payment failed for key: ${licenseKey.substring(
                    0,
                    5
                  )}*****`
                );
                reject(
                  new Error(
                    "License subscription payment failed. Please update your payment method to continue using the service."
                  )
                );
                return;
              }
            }

            // Check the uses count to enforce one license per purchase
            // If uses count is > 1, this indicates the license has been used before
            if (response.uses !== undefined && response.uses > 1) {
              console.log(
                `License already used (uses: ${
                  response.uses
                }) for key: ${licenseKey.substring(0, 5)}*****`
              );
              reject(
                new Error(
                  "License key has already been activated. Please contact support if you believe this is an error."
                )
              );
              return;
            }

            console.log(
              `License verification successful for key: ${licenseKey.substring(
                0,
                5
              )}*****`
            );
            resolve(true);
          } else {
            console.log(
              `License verification failed for key: ${licenseKey.substring(
                0,
                5
              )}*****`
            );
            console.log(
              `Failure reason: ${response.message || "Unknown error"}`
            );

            // Check if the response indicates the product ID is invalid
            if (response.message && response.message.includes("product")) {
              console.error(`Invalid product ID error: ${response.message}`);
              reject(new Error(`Invalid product ID: ${response.message}`));
              return;
            }

            // Check if it's a license usage error (Gumroad's built-in detection)
            if (
              response.message &&
              (response.message.includes("uses") ||
                response.message.includes("already"))
            ) {
              console.log(`License usage error detected: ${response.message}`);
              reject(
                new Error(
                  "License key has already been activated on another device. Please contact support to transfer your license."
                )
              );
              return;
            }

            // Handle "This license key has been disabled" error
            if (response.message && response.message.includes("disabled")) {
              console.log(
                `License disabled error detected: ${response.message}`
              );
              reject(
                new Error(
                  "This license key has been disabled. Please contact support for assistance."
                )
              );
              return;
            }

            // Handle "Access to the purchase associated with this license has expired" error
            if (response.message && response.message.includes("expired")) {
              console.log(
                `License expired error detected: ${response.message}`
              );
              reject(
                new Error(
                  "Access to the purchase associated with this license has expired. Please contact support to renew your subscription."
                )
              );
              return;
            }

            resolve(false);
          }
        } catch (error) {
          console.timeEnd("License.verifyWithGumroad"); // End timing for verifyWithGumroad
          console.error(`Failed to parse Gumroad response: ${error.message}`);
          console.error(`Raw response data: ${data}`);
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on("error", (error) => {
      console.timeEnd("License.verifyWithGumroad"); // End timing for verifyWithGumroad
      console.error(
        `Network error during license verification: ${error.message}`
      );
      reject(new Error(`Network error: ${error.message}`));
    });

    // Add timeout handler
    req.on("timeout", () => {
      req.destroy();
      console.timeEnd("License.verifyWithGumroad"); // End timing for verifyWithGumroad
      console.error("License verification request timed out");
      reject(
        new Error("Request timeout - please check your internet connection")
      );
    });

    req.write(postData);
    req.end();
  });
}

async function showLicenseWindow(errorTitle, errorMessage) {
  console.time("License.showLicenseWindow"); // Start timing for showLicenseWindow
  console.log("Creating license window");

  // Always close the main window when showing the license window
  closeMainWindow();

  try {
    console.log(
      "Calling createLicenseWindow with rootPath:",
      licenseState.rootPath,
      "isDev:",
      licenseState.isDev
    );
    licenseState.licenseWindow = await createLicenseWindow(
      licenseState.rootPath,
      licenseState.isDev
    );

    // If we have error information, send it to the license window
    if (errorTitle && errorMessage && licenseState.licenseWindow) {
      // Send error message to license window through IPC
      console.log("Sending license error to window:", errorTitle, errorMessage);
      licenseState.licenseWindow.webContents.send(
        "license-error",
        errorTitle,
        errorMessage
      );
    }

    console.log(
      "License window created, window object:",
      licenseState.licenseWindow
    );
  } catch (error) {
    console.error("Failed to create license window:", error);
    console.error("Error stack:", error.stack);
  }
  console.timeEnd("License.showLicenseWindow"); // End timing for showLicenseWindow
}

async function openMainAppWindow(createWindow) {
  console.time("License.openMainAppWindow"); // Start timing for openMainAppWindow
  console.log("Closing license window and opening main app window");

  // Close license window
  console.log("Closing license window");
  closeLicenseWindow();

  // Ensure main window is closed before creating a new one
  closeMainWindow();

  // Create main application window
  console.log("Creating main application window");
  await createWindow();
  console.timeEnd("License.openMainAppWindow"); // End timing for openMainAppWindow
}

async function clearLicense() {
  console.log("Clearing stored license");
  try {
    // Remove only the license key from storage
    const storedLicense = licenseState.store.get("licenseKey");
    if (storedLicense) {
      console.log(
        `Clearing license key: ${storedLicense.substring(0, 5)}*****`
      );
    }
    licenseState.store.delete("licenseKey");
    licenseState.isLicenseValid = false;
    console.log("License cleared successfully");

    return { success: true };
  } catch (error) {
    console.error("Failed to clear license:", error);
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
