
# Real-Time vs. Configuration Logic

It is important to distinguish between **saving settings** and **controlling devices**.

## 1. Configuration (HTTP)
**Protocol:** JSON over HTTP (`POST /api/config`)
**When:** Occurs ~2 seconds after the user stops editing (Drag & Drop, Renaming, Changing Colors, Adding Schedules).
**Data:** Massive JSON object containing EVERYTHING (Settings, All Segments, All Schedules).
**Server Action:** Overwrite `config.json` in SPIFFS/LittleFS.

## 2. Real-Time Control (WebSocket / Binary V4)
**Protocol:** Binary Protocol over WebSocket.
**When:** Occurs INSTANTLY when the user clicks a button (Toggle Light, Slide Dimmer).
**Data:** Tiny, fast packets. **NOT JSON.**

### Decoding Real-Time Packets (Binary)
The ESP32 receives a byte array. Here is how to map the bytes to Logic:

| Byte Index | Name | Logic |
| :--- | :--- | :--- |
| **0** | `CMD` | **The Action Key.** See table below. |
| **1-2** | `GPIO`| The Pin Number to affect. |
| **3** | `LEN` | Payload Length. |
| **4...** | `VAL` | The Value (PWM level, etc). |

### Command Keys (The "Keys" for Real-time)
When the dashboard sends a command, byte 0 (`CMD`) acts as the key:

*   `0x01`: **Turn ON** (Key for "ON")
*   `0x02`: **Turn OFF** (Key for "OFF")
*   `0x03`: **Toggle** (Key for "Change State")
*   `0x04`: **PWM** (Key for "Set Value") -> Payload contains the number (0-255).
*   `0x19`: **Display** (Key for "Show Text") -> Payload contains the String.

### Example: User turns ON the Living Room Light (GPIO 5)
1.  **Dashboard Sends (WebSocket):** `0x01 0x05 0x00 0x00 ...`
    *   ESP32 executes: `digitalWrite(5, HIGH);`
2.  **Dashboard DOES NOT send JSON.** (Saving state happens later if needed, but usually state is runtime only).

### Example: User renames "Living Room" to "Main Hall"
1.  **Dashboard Sends (HTTP POST):** JSON File.
    *   `{"segments": [{"name": "Main Hall", "gpio": 5, ...}, ...]}`
    *   ESP32 executes: `file.write(json);`
