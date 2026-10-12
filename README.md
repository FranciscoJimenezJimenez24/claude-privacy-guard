# Claude Privacy Guard

A lightweight, zero-configuration Chrome Extension (Manifest V3) designed to prevent conversation leaks on `claude.ai`.

## Features

- **Document Title Lockdown**: Freezes `document.title` to strictly `"Claude"` using prototype-level descriptor overrides and DOM mutation monitoring in the `MAIN` execution world. Prevents conversation names from leaking into browser history, window titles, screenshots, or tab-snooping extensions.
- **Tracker & Telemetry Blocking**: Uses Chrome's native `declarativeNetRequest` engine to block outbound network requests from `claude.ai` to Google Analytics, Meta Pixel, and Datadog browser intake endpoints.
- **Minimal Permissions**: No invasive background scripts, no access to cookies, tabs, or storage, and scoped exclusively to `https://claude.ai/*`.

## Installation

1. Open Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** in the upper-right corner.
3. Click **Load unpacked**.
4. Select the `claude-privacy-guard` folder.

## Verification

1. **Title Neutralization**:
   - Open [Claude](https://claude.ai/) and start a new chat.
   - Observe that the tab title remains strictly `"Claude"`.
   - In DevTools Console: `document.title` returns `"Claude"` regardless of assignments.
2. **Network Blocking**:
   - Open DevTools Network tab.
   - Requests to Google Analytics, Datadog RUM intake, and Meta Pixel will display `(blocked:other)`.
