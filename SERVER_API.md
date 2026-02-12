
# ESP32 Server Implementation Guide (Modular Sync V5.0)

To optimize performance and Flash memory lifespan, the API has been split into modular endpoints.
This allows the dashboard to save only what has changed.

---

## 1. Initial Load (Monolithic)

### GET `/api/config`
**Purpose:** Bootstrapping the Dashboard.
**Action:** The ESP32 should combine all data files into one JSON response.
**Optimized Logic:**
1.  Read `/settings.json`.
2.  Read `/segments.json`.
3.  Read `/schedules.json`.
4.  Combine them: `{"settings": {...}, "segments": [...], "groups": [...], "schedules": [...]}`.
5.  Send Response.

---

## 2. Granular Updates (The "Smart" Sync)

Implement these 3 POST endpoints. Do NOT use a single `/api/config` POST anymore.

### A. POST `/api/settings`
**Payload:** JSON object containing only `settings`.
**Action:** Save directly to `/settings.json`.
**Frequency:** High (User changing themes, volume, toggle animations).
**Size:** Very Small (< 1KB).

### B. POST `/api/segments`
**Payload:** JSON object: `{ "segments": [...], "groups": [...] }`.
**Action:** Save directly to `/segments.json`.
**Frequency:** Low (User adding devices or reordering).
**Size:** Medium to Large.

### C. POST `/api/schedules`
**Payload:** JSON array: `[ ...schedules... ]`.
**Action:** Save directly to `/schedules.json`.
**Frequency:** Medium.
**Size:** Small.

---

## 3. Benefits of this Architecture

1.  **RAM Usage:** When saving settings, you don't need to load the huge segments array into memory.
2.  **Speed:** Saving settings takes milliseconds instead of seconds.
3.  **Stability:** Less chance of memory fragmentation on the ESP32.
4.  **Flash Wear:** You only rewrite the sector of flash that actually changed.

---

## 4. Real-Time Control (WebSocket)

*Remains unchanged.* Real-time control (toggling lights) still happens via Binary WebSocket protocol and is NOT saved to these files immediately to preserve flash memory.
