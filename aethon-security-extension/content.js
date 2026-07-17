// content.js for Aethon Exam Security Shield

// 1. Set DOM attribute to signal the extension is active (CSP-safe, works on all pages)
document.documentElement.setAttribute("data-aethon-extension-active", "true");

// 2. Listen for scan requests from the webpage
window.addEventListener("AETHON_SCAN_REQUEST", (event) => {
  try {
    chrome.runtime.sendMessage({ action: "scanExtensions" }, (response) => {
      // Handle connection error gracefully to avoid Chrome recording uncaught console errors
      if (chrome.runtime.lastError) {
        window.dispatchEvent(new CustomEvent("AETHON_SCAN_RESPONSE", {
          detail: { status: "error", message: chrome.runtime.lastError.message }
        }));
        return;
      }
      
      window.dispatchEvent(new CustomEvent("AETHON_SCAN_RESPONSE", {
        detail: response || { status: "error", message: "No response from service worker" }
      }));
    });
  } catch (err) {
    window.dispatchEvent(new CustomEvent("AETHON_SCAN_RESPONSE", {
      detail: { status: "error", message: err.message }
    }));
  }
});
