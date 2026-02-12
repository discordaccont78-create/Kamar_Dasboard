
# Segment/Device Dictionary (JSON Keys)

The `segments` array in the JSON configuration contains objects representing each device.
The ESP32 needs to parse these keys to reconstruct the hardware state.

## 1. Core Identity (Required)
| JSON Key | Data Type | Description |
| :--- | :--- | :--- |
| `"num_of_node"` | String | **Unique ID**. Used to identify the device for updates. |
| `"name"` | String | User-friendly name (e.g., "Ceiling Fan"). |
| `"group"` | String | Group name for UI clustering (e.g., "Living Room"). |
| `"groupType"` | String | `"custom"`, `"register"`, `"weather"`, `"input"`, `"display"`. |
| `"segType"` | String | `"Digital"`, `"PWM"`, `"Code"`, `"All"`, `"DHT"`, `"OLED"`, `"CharLCD"`, `"Input-0-1"`. |

## 2. Hardware Mapping (Pins)
| JSON Key | Data Type | Description |
| :--- | :--- | :--- |
| `"gpio"` | Integer | Main control pin (Relay, PWM, or Latch for Registers). |
| `"dsPin"` | Integer | **Shift Register**: Data Pin (DS). |
| `"shcpPin"` | Integer | **Shift Register**: Clock Pin (SHCP). |
| `"stcpPin"` | Integer | **Shift Register**: Latch Pin (STCP). |
| `"regBitIndex"`| Integer | **Shift Register**: Which bit (0-7) this segment controls. |
| `"dhtPin"` | Integer | **Weather**: Data pin for DHT sensor. |
| `"sdaPin"` | Integer | **Display**: I2C SDA Pin. |
| `"sclPin"` | Integer | **Display**: I2C SCL Pin. |

## 3. State & Values (Runtime)
| JSON Key | Data Type | Description |
| :--- | :--- | :--- |
| `"is_led_on"` | String | `"on"` or `"off"`. Current state of digital output. |
| `"val_of_slide"`| Integer | `0-255`. Current PWM value or raw byte value. |
| `"temperature"`| Float | Last read temperature. |
| `"humidity"` | Float | Last read humidity. |
| `"inputActive"` | Boolean | `true` = Input High, `false` = Input Low. |

## 4. UI Customization & Logic
| JSON Key | Data Type | Description |
| :--- | :--- | :--- |
| `"onLabel"` | String | Custom text for ON state (e.g., "OPEN"). |
| `"offLabel"` | String | Custom text for OFF state (e.g., "CLOSED"). |
| `"onOffMode"` | String | `"toggle"` (Standard Switch) or `"momentary"` (Push Button). |
| `"pulseDuration"`| Integer | Auto-off timer in seconds (0 = Disabled). |

## 5. Hardware Specific Configs
| JSON Key | Data Type | Description |
| :--- | :--- | :--- |
| `"dhtType"` | String | `"DHT11"` or `"DHT22"`. |
| `"i2cAddress"` | String | I2C Hex Address (e.g., `"0x3C"`). |
| `"displayWidth"` | Integer | Screen width (px for OLED, cols for LCD). |
| `"displayHeight"`| Integer | Screen height (px for OLED, rows for LCD). |
| `"displayContent"`| String | Current text being displayed on screen. |
| `"inputCondition"`| Integer | Trigger Logic: `0`=Hold, `1`=Toggle, `2`=High, `3`=Low. |

---

### Example JSON Payload (One Segment)
```json
{
  "num_of_node": "id_8321",
  "name": "Kitchen Light",
  "group": "Kitchen",
  "segType": "PWM",
  "gpio": 18,
  "is_led_on": "on",
  "val_of_slide": 128,
  "onOffMode": "toggle"
}
```
