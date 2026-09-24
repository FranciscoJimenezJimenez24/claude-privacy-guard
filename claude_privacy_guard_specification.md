# Spec: Claude Privacy Guard (MVP)

## 1. Project Overview & Objective

### Context
Based on findings from the paper *"Your AI Assistant Is Leaking Your Conversations"* (LeakyLM), modern AI web frontends expose conversation metadata through two main vectors:
1. Dynamic population of `document.title` with prompt-derived titles (ingested by trackers, browser history, screen captures, and third-party extensions).
2. Outbound telemetry and tracker beacons (Meta Pixel, Google Analytics, Datadog) sent during active sessions.

### Goal
Build an ultra-lightweight, zero-config Chrome Extension (Manifest V3) for a weekend project using a *vibecoding* workflow. 

Target scope: **Exclusively `claude.ai`**.

---

## 2. Architecture & File Structure

```text
claude-privacy-guard/
├── manifest.json       # MV3 declaration, permissions, rule declarations
├── content.js          # Injected into page context (world: MAIN) to lock document.title
├── rules.json          # Declarative Net Request rules blocking outbound trackers
└── icons/              # Extension icons (16x16, 48x48, 128x128)
```

---

## 3. Technical Requirements

### 3.1. `manifest.json`
* **Manifest Version:** 3.
* **Host Permissions:** Strictly `https://claude.ai/*`.
* **Permissions:** `declarativeNetRequest`.
* **Content Scripts:**
  * Matches: `https://claude.ai/*`.
  * `run_at`: `"document_start"`.
  * `world`: `"MAIN"` (critical: must run in the page execution context to intercept React/Next.js mutations to the actual DOM document object).

### 3.2. `content.js` (Title Neutralization)
* Intercept `document.title` before frontend initialization.
* Override the prototype descriptor on `Document.prototype` or lock the property on `document` via `Object.defineProperty`.
* Return and set a permanent static string: `"Claude"`.
* Prevent event handlers or MutationObservers from triggering leakage via the window title.

### 3.3. `rules.json` (Declarative Net Request)
Block third-party tracker domains originating from `https://claude.ai/*`:
* `google-analytics.com` / `googletagmanager.com`
* `connect.facebook.net`
* `datadoghq.com` (browser intake endpoints)
* `statsig.com` / other generic analytics identified in audits (optional flag)

---

## 4. Weekend Roadmap & Milestones

| Phase | Milestone | Estimated Time | Success Criteria |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Project Scaffold** | 20 mins | Directory created, `manifest.json` loaded into `chrome://extensions` in Developer Mode with zero errors. |
| **Phase 2** | **Title Sanitization** | 45 mins | Starting a chat in `claude.ai` does not rename the browser tab; `document.title` returns `"Claude"` permanently in DevTools console. |
| **Phase 3** | **Network Tracker Cut** | 45 mins | `rules.json` loaded; DevTools Network tab shows telemetry requests to GA/Datadog as `(blocked:other)`. |
| **Phase 4** | **Testing & Polishing** | 30 mins | Verify that chat generation, artifact rendering, and navigation within `claude.ai` remain 100% functional with zero UI regressions. |

---

## 5. Master Vibecoding Prompts

### Prompt 1: Initial Generation (Copy & Paste to your AI IDE/Assistant)
```text
Act as a senior browser extension engineer. Generate the complete source code for a lightweight Chrome Extension in Manifest V3 targeting only "https://claude.ai/*".

Generate the following files:
1. manifest.json:
   - Manifest V3 compliant.
   - DeclarativeNetRequest permissions.
   - Inject content.js at "document_start" in the "MAIN" world.
   - Link declarative_net_request rule set from rules.json.

2. content.js:
   - Freeze or override document.title at the lowest possible level so any assignment by React/Next.js sets it strictly to "Claude".
   - It must execute immediately and cleanly without throwing errors in the web console.

3. rules.json:
   - Block requests originating from "claude.ai" to Google Analytics, Meta Pixel, and Datadog ingest domains.
   - Use standard declarativeNetRequest rule formats (id, priority, action: block, condition).

Ensure the output is production-ready to load as an unpacked extension immediately.
```

### Prompt 2: Verification Checklist (Post-Generation)
```text
Inspect the generated content.js and rules.json for:
1. Is world: "MAIN" correctly specified in manifest.json so the page scripts cannot bypass title lock?
2. Are rule IDs in rules.json unique integers?
3. Does the extension avoid invasive permissions like "tabs", "cookies", or broad "<all_urls>"?
```