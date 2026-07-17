// background.js for Aethon Exam Security Shield

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scanExtensions") {
    chrome.management.getAll((extensions) => {
      const forbiddenKeywords = [
        "always active",
        "active window",
        "prevent focus loss",
        "stay focus",
        "tab focus",
        "spoof focus",
        "disable tab switch",
        "visibility state",
        "tampermonkey",
        "violentmonkey",
        "greasemonkey",
        "user script",
        "allow copy",
        "enable copy",
        "absolute enable right click"
      ];

      const detected = [];

      extensions.forEach((ext) => {
        if (ext.enabled && ext.id !== chrome.runtime.id) {
          const name = ext.name.toLowerCase();
          const description = (ext.description || "").toLowerCase();

          const matchesKeyword = forbiddenKeywords.some((keyword) => 
            name.includes(keyword) || description.includes(keyword)
          );

          if (matchesKeyword) {
            detected.push({
              name: ext.name,
              id: ext.id
            });
          }
        }
      });

      sendResponse({ status: "success", forbiddenDetected: detected });
    });
    return true; // Keep channel open for async sendResponse
  }
});
