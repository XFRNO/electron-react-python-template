console.log('License HTML loaded')

// Check if electron is available
if (typeof window.electron === 'undefined') {
  console.error('electron is not available!')
  displayLicenseError('Error', 'Application not loaded properly. Please restart the app.')
} else {
  console.log('electron is available')

  // Listen for error messages from the main process
  window.electron.onLicenseError((errorTitle, errorMessage) => {
    displayLicenseError(errorTitle, errorMessage)
  })
}

// Function to display license errors
function displayLicenseError(title, message) {
  const errorContainer = document.getElementById('errorContainer')
  // Clear any existing content
  errorContainer.innerHTML = ''
  // Show only the error message at the top
  const errorDiv = document.createElement('div')
  errorDiv.className = 'error-message'
  errorDiv.textContent = message
  errorContainer.appendChild(errorDiv)

  // Ensure all elements remain visible when showing error
  document.querySelector('input[type="text"]').style.display = 'block'
  document.querySelector('#verifyBtn').style.display = 'block'
  document.querySelector('p').style.display = 'block'
}

async function verifyLicense() {
  console.log('verifyLicense function called')
  const licenseKey = document.getElementById('licenseKey').value.trim()
  const verifyBtn = document.getElementById('verifyBtn')

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
  } catch (error) {
    console.error('License verification error:', error)
    // Show error at the top
    displayLicenseError('Error', 'Verification failed. Please check your internet connection.')
  }

  verifyBtn.disabled = false
  verifyBtn.textContent = 'Verify License'
}

function openPurchase() {
  console.log('openPurchase function called')
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

// Allow Enter key to submit
document.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    verifyLicense()
  }
})

console.log('License HTML script loaded')
