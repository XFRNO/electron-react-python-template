// Check if electron is available
if (typeof window.electron === 'undefined') {
  console.error('electron is not available!')
  displayLicenseError('Error', 'Application not loaded properly. Please restart the app.')
} else {
  // Listen for error messages from the main process
  window.electron.onLicenseError((errorTitle: string, errorMessage: string) => {
    displayLicenseError(errorTitle, errorMessage)
  })
}

// Set page title and header from app info constants
;(async () => {
  try {
    if (window.electron && typeof window.electron.getAppInfo === 'function') {
      const info = await window.electron.getAppInfo()

      if (info?.name) {
        document.title = `${info.name} - License Verification`
        const h1 = document.querySelector('h1')
        if (h1) h1.textContent = info.name
      }
    }
  } catch (e) {
    console.error('Failed to set app info on license page:', e)
  }
})()

// Function to display license errors
function displayLicenseError(title: string, message: string): void {
  const errorContainer = document.getElementById('errorContainer')
  const errorTitle = document.getElementById('errorTitle')
  const errorMessage = document.getElementById('errorMessage')

  if (!errorContainer || !errorTitle || !errorMessage) {
    console.error('Error container, title, or message element not found')
    return
  }

  if (!errorTitle || !errorMessage) {
    console.error('Error title or message element not found')
    return
  }

  // Set error title and message
  errorTitle.textContent = title
  errorMessage.textContent = message

  // Ensure all elements remain visible when showing error
  const licenseKeyInput = document.querySelector('input[type="text"]') as HTMLInputElement
  const verifyButton = document.querySelector('#verifyBtn') as HTMLButtonElement
  const paragraphElement = document.querySelector('p')

  if (licenseKeyInput) licenseKeyInput.style.display = 'block'
  if (verifyButton) verifyButton.style.display = 'block'
  if (paragraphElement) paragraphElement.style.display = 'block'
}

async function verifyLicense(): Promise<void> {
  const licenseKeyInput = document.getElementById('licenseKey') as HTMLInputElement
  const verifyBtn = document.getElementById('verifyBtn') as HTMLButtonElement

  if (!licenseKeyInput || !verifyBtn) {
    console.error('License key input or verify button not found')
    return
  }

  const licenseKey = licenseKeyInput.value.trim()

  if (!licenseKey) {
    // Show error at the top
    displayLicenseError('Error', 'Please enter a license key')
    return
  }

  verifyBtn.disabled = true
  verifyBtn.textContent = 'Verifying...'

  try {
    const result = await window.electron.verifyLicense(licenseKey)
    if (result.success) {
      // Show success message at the top
      displayLicenseError('Success', 'License verified! Starting application...')
      setTimeout(() => {
        // License window will be closed by main process
      }, 1000)
    } else {
      let errorMessage = 'License verification failed.'
      if (result.error) {
        errorMessage = result.error
      }

      // Show error at the top
      displayLicenseError('License Error', errorMessage)
    }
  } catch (error: any) {
    console.error('License verification error:', error)
    // Show error at the top
    displayLicenseError('Error', 'Verification failed. Please check your internet connection.')
  }

  verifyBtn.disabled = false
  verifyBtn.textContent = 'Verify License'
}

function openPurchase(): void {
  // Check if electron and openExternal are available
  if (
    typeof window.electron !== 'undefined' &&
    typeof window.electron.openExternal === 'function'
  ) {
    // This would open the purchase URL
    window.electron.openExternal('https://xfrno.gumroad.com/l/uodmbn')
  } else {
    console.error('electron.openExternal is not available')
    // Fallback: try to open in a new tab/window
    window.open('https://xfrno.gumroad.com/l/uodmbn', '_blank')
  }
}

// Allow Enter key to submit and add event listeners for buttons
document.addEventListener('DOMContentLoaded', () => {
  const verifyBtn = document.getElementById('verifyBtn') as HTMLButtonElement
  if (verifyBtn) {
    verifyBtn.addEventListener('click', verifyLicense)
  }

  const purchaseLink = document.querySelector('p > a[href="#"]') as HTMLAnchorElement
  if (purchaseLink) {
    purchaseLink.addEventListener('click', openPurchase)
  }

  document.addEventListener('keypress', function (e: KeyboardEvent) {
    if (e.key === 'Enter') {
      verifyLicense()
    }
  })
})
