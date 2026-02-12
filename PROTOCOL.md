
# Kamyar Pro IoT Protocol V4.0

This document defines the binary communication protocol used between the React Dashboard (Frontend) and the ESP32 Controller (Backend) over WebSocket (or potentially MQTT).

## 1. Design Philosophy

- **Efficiency:** Binary format minimizes overhead compared to JSON.
- **Reliability:** Includes a CRC8 checksum to detect data corruption.
- **Flexibility:** Supports variable-length payloads (from empty signals to text strings).
- **Endianness:** All multi-byte numbers are **Little-Endian**.

---

## 2. Packet Structure

A valid V4 packet consists of a **Header**, a **Payload**, and a **Footer**.

| Byte Offset | Field | Size (Bytes) | Description |
| :--- | :--- | :--- | :--- |
| **0** | `CMD` | 1 | Command ID (Action to perform). |
| **1** | `SEG_L` | 1 | Target ID / GPIO Number (Low Byte). |
| **2** | `SEG_H` | 1 | Target ID / GPIO Number (High Byte). |
| **3** | `LEN` | 1 | Length of the Payload (`N`). Max 255. |
| **4** | `PAYLOAD` | N | Data bytes (optional). Size is defined by `LEN`. |
| **4 + N** | `CRC` | 1 | CRC8 Checksum of bytes `0` to `4+N-1`. |

### Total Size
- Minimum: 5 Bytes (Header + CRC, Empty Payload)
- Maximum: 260 Bytes (Header + 255 Bytes Payload + CRC)

---

## 3. Data Types

The content of the `PAYLOAD` depends on the `CMD`:

1.  **Toggle / Trigger (e.g., LED_ON):**
    *   `LEN` = 0.
    *   `PAYLOAD` = Empty.

2.  **Integer Value (e.g., PWM, Sensor Value):**
    *   `LEN` = 4.
    *   `PAYLOAD` = 32-bit Integer (Little Endian).

3.  **Text String (e.g., Display Text):**
    *   `LEN` = Number of bytes in string.
    *   `PAYLOAD` = UTF-8 Encoded bytes.

4.  **Raw Bytes:**
    *   Any custom binary data structure.

---

## 4. Command List (CMD Enum)

| Hex | Name | Payload Type | Description |
| :--- | :--- | :--- | :--- |
| `0x01` | `LED_ON` | Empty | Turn GPIO HIGH. |
| `0x02` | `LED_OFF` | Empty | Turn GPIO LOW. |
| `0x03` | `LED_TOGGLE` | Empty | Toggle GPIO state. |
| `0x04` | `LED_PWM` | Int32 (4B) | Set PWM Duty Cycle (0-255). |
| `0x06` | `SR_STATE` | Int32 (4B) | Set Shift Register Byte State (8 bits). |
| `0x09` | `TEMP_DATA` | Int32 (4B) | Sensor Temp (Value * 10). |
| `0x0A` | `HUM_DATA` | Int32 (4B) | Sensor Humidity (Value * 10). |
| `0x19` | `DISPLAY_UPDATE`| String | Send text to OLED/LCD. |
| `0x0F` | `PING` | Empty | Keep-alive check. |

---

## 5. Implementation Guide (C++ / Arduino)

### A. CRC8 Implementation
This specific CRC8 algorithm matches the one used in the frontend.

```cpp
uint8_t crc8(const uint8_t *data, size_t len) {
    uint8_t crc = 0;
    for (size_t i = 0; i < len; i++) {
        uint8_t extract = data[i];
        for (uint8_t tempI = 8; tempI; tempI--) {
            uint8_t sum = (crc ^ extract) & 0x01;
            crc >>= 1;
            if (sum) {
                crc ^= 0x8C;
            }
            extract >>= 1;
        }
    }
    return crc;
}
// Note: Frontend uses a precomputed table for speed, but this calculated version 
// is space-efficient for MCUs. Ideally, generate a table if speed is critical.
```

### B. Parsing Logic (Example)

```cpp
void handlePacket(uint8_t* buffer, size_t size) {
    if (size < 5) return; // Too short

    uint8_t cmd = buffer[0];
    uint16_t seg = buffer[1] | (buffer[2] << 8);
    uint8_t len = buffer[3];

    // 1. Validate Size
    if (size != 4 + len + 1) {
        Serial.println("Error: Packet length mismatch");
        return;
    }

    // 2. Validate CRC
    // Calculate CRC of everything EXCEPT the last byte (which IS the CRC)
    uint8_t calcCRC = crc8(buffer, 4 + len);
    uint8_t recvCRC = buffer[4 + len];

    if (calcCRC != recvCRC) {
        Serial.println("Error: CRC Check Failed");
        return;
    }

    // 3. Process Payload
    // Pointer to data starts at buffer[4]
    
    switch(cmd) {
        case 0x01: // LED_ON
            digitalWrite(seg, HIGH);
            break;
            
        case 0x04: // PWM
            if (len == 4) {
                int32_t val;
                memcpy(&val, &buffer[4], 4); // Extract int
                analogWrite(seg, val);
            }
            break;

        case 0x19: // DISPLAY_UPDATE
            char text[256];
            memcpy(text, &buffer[4], len);
            text[len] = '\0'; // Null-terminate
            updateDisplay(seg, text);
            break;
    }
}
```

---

## 6. Example Packets

**1. Turn ON GPIO 5:**
*   `CMD`: 0x01
*   `SEG`: 0x05, 0x00 (5)
*   `LEN`: 0x00
*   `CRC`: Calculated based on `01 05 00 00`

**2. Send "HELLO" to Display at Address 0x3C (60):**
*   `CMD`: 0x19 (25)
*   `SEG`: 0x3C, 0x00 (60)
*   `LEN`: 0x05 (Length of "HELLO")
*   `PAYLOAD`: `48 45 4C 4C 4F`
*   `CRC`: Calculated based on Header + Payload.
