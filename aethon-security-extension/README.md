# Aethon Exam Security Shield Extension

This browser extension ensures exam integrity by scanning the browser's active extension list for focus bypass extensions (such as "Always Active Window", "Violentmonkey", etc.) and communicating the presence of these tools back to the Aethon platform.

## How to Install the Extension (For Testing / Development)

1. Open **Google Chrome** (or any Chromium-based browser like Edge/Brave).
2. Navigate to: `chrome://extensions/`
3. Toggle the **Developer mode** switch in the top-right corner of the page.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the folder where this extension is located (`c:\xampp\htdocs\portfolio\aethon-security-extension`).
6. The extension is now active and will automatically protect pages loaded under `localhost`, `127.0.0.1`, or `*.aethon.com`.

## How It Works

1. **Active Checking:** The content script `content.js` runs as soon as a page starts loading (`run_at: document_start`). It injects `window.__AETHON_SECURITY_SHIELD_ACTIVE__ = true` into the page window.
2. **Scan Communication:** The webpage dispatches a custom DOM event (`AETHON_SCAN_REQUEST`).
3. **Internal Scan:** The content script forwards this request to the background service worker `background.js` using `chrome.runtime.sendMessage`.
4. **API Query:** `background.js` uses Chrome's privileged API `chrome.management.getAll()` to check if any focus-bypass or scripting manager extensions (such as "Always Active Window") are currently enabled.
5. **Enforcement:** If a bypass tool is detected, the webpage displays a warning and refuses to load/start the assessment until the extension is disabled.
