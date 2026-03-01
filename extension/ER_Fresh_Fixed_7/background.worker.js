importScripts("background.bundle.js");

chrome.action.onClicked.addListener(async () => {
  try {
    const popupUrl = chrome.runtime.getURL("popup.html");
    const existingTabs = await chrome.tabs.query({ url: popupUrl });

    if (existingTabs.length > 0) {
      const existingTab = existingTabs[0];
      if (existingTab.windowId) {
        await chrome.windows.update(existingTab.windowId, { focused: true });
      }
      if (existingTab.id) {
        await chrome.tabs.update(existingTab.id, { active: true });
      }
      return;
    }

    await chrome.tabs.create({ url: popupUrl });
  } catch (error) {
    console.error("Failed to open/focus extension tab:", error);
  }
});
