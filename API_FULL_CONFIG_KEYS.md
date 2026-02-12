
# Comprehensive Data Dictionary (Full API Reference V5.0)

This document is the absolute reference for every JSON key used in the Kamyar Pro Dashboard. Any key not listed here is not used by the frontend.

---

## 1. Global Settings (`settings`)
| Key | Data Type | Description |
| :--- | :--- | :--- |
| `title` | String | Global header title text. |
| `domain` | String | IP/mDNS hostname for WebSocket logic. |
| `theme` | String | `"dark"` or `"light"`. |
| `primaryColor` | Hex String | Main accent color (e.g. `"#daa520"`). |
| `cursorColor` | Hex String | Secondary accent for cursor/patterns. |
| `language` | String | `"fa"` (Persian) or `"en"` (English). |
| `dashboardFont` | String | `"Inter"`, `"Oswald"`, `"Lato"`, `"Montserrat"`, `"DinaRemaster"`, `"PrpggyDotted"`. |
| `backgroundEffect`| String | `"grid"`, `"dots"`, `"squares"`, `"triangles"`. |
| `gridSize` | Integer | Pixel size of grid cells. |
| `gridLineStyle` | String | `"solid"`, `"dashed"`, `"dotted"`. |
| `gridStrokeWidth` | Integer | Thickness of background lines. |
| `patternOpacity` | Integer | Opacity (0-100) of primary background pattern. |
| `secondaryPatternOpacity`| Integer | Opacity (0-100) of secondary (accent) pattern. |
| `dualColorBackground`| Boolean | Use both Primary and Cursor colors for background. |
| `hollowShapes` | Boolean | `true` = Outlined shapes; `false` = Filled. |
| `enableTextPattern`| Boolean | Overlay repeating text on background. |
| `textPatternValue` | String | The text string to repeat on background. |
| `textPatternColor` | Hex String | Specific color for text pattern. |
| `textPatternOpacity`| Integer | Opacity (0-100) of background text. |
| `headerGap` | Integer | Gap width between header blocks (0-80). |
| `headerWaveOpacity`| Integer | Opacity (0-100) of electric waves. |
| `headerDynamicIntensity`| Boolean | Pulse waves based on animation state. |
| `animations` | Boolean | Global master switch for UI movement. |
| `enableSFX` | Boolean | Global switch for UI sound effects. |
| `bgMusic` | Boolean | Global switch for ambient music. |
| `volume` | Integer | Audio volume level (0-100). |
| `currentTrackIndex`| Integer | Index of track from `MUSIC_TRACKS` constant. |
| `enableNotifications`| Boolean | Toggle toast alerts. |
| `useSsl` | Boolean | Use `wss://` vs `ws://`. |

---

## 2. Zone Groups (`groups`)
| Key | Data Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique ID referenced by segments. |
| `name` | String | Visual name of the zone (e.g. "Hallway"). |
| `order` | Integer | Vertical sort priority. |
| `icon` | String | (Optional) Lucide icon name. |
| `collapsed` | Boolean | (Optional) UI state of the group. |

---

## 3. Nodes & Segments (`segments`)
### 3.1 Hardware Configuration
| Key | Data Type | Description |
| :--- | :--- | :--- |
| `num_of_node` | String | **Primary Key**. Unique ID (e.g. "light_1"). |
| `groupId` | String | Links to a `groups[].id`. |
| `groupType` | String | Logic: `"custom"`, `"register"`, `"weather"`, `"input"`, `"display"`. |
| `segType` | String | Component: `"Digital"`, `"PWM"`, `"Code"`, `"All"`, `"DHT"`, `"OLED"`, `"CharLCD"`, `"Input-0-1"`. |
| `gpio` | Integer | Primary data/control pin. |
| `dsPin` | Integer | Shift Register Data Pin. |
| `shcpPin` | Integer | Shift Register Clock Pin. |
| `stcpPin` | Integer | Shift Register Latch Pin. |
| `regBitIndex` | Integer | Bit index (0-7) for register modules. |
| `dhtPin` | Integer | Data pin for DHT sensor. |
| `dhtType` | String | `"DHT11"` or `"DHT22"`. |
| `sdaPin` | Integer | I2C Data Pin. |
| `sclPin` | Integer | I2C Clock Pin. |
| `i2cAddress` | String | Hex address (e.g. `"0x3C"`). |
| `displayWidth` | Integer | Pixels/Cols count. |
| `displayHeight` | Integer | Pixels/Rows count. |

### 3.2 UI & Runtime State
| Key | Data Type | Description |
| :--- | :--- | :--- |
| `name` | String | Display label for the node. |
| `is_led_on` | String | `"on"` or `"off"`. |
| `val_of_slide` | Integer | `0-255` (PWM) or Byte Value (Register). |
| `onLabel` | String | Custom text for "ON" state. |
| `offLabel` | String | Custom text for "OFF" state. |
| `onOffMode` | String | `"toggle"` or `"momentary"`. |
| `pulseDuration` | Integer | Auto-off timer in seconds (0 = Disabled). |
| `temperature` | Float | Read-only sensor value. |
| `humidity` | Float | Read-only sensor value. |
| `inputActive` | Boolean | Current logic state of input. |
| `displayContent` | String | Current text visible on screen. |

---

## 4. Automation & Schedules (`schedules`)
| Key | Data Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique rule ID. |
| `enabled` | Boolean | Active status of automation. |
| `type` | String | Trigger: `"daily"`, `"countdown"`, `"weather"`, `"input"`. |
| `targetSegmentId` | String | The `num_of_node` to control. |
| `action` | String | `"ON"`, `"OFF"`, `"TOGGLE"`, `"SET_VALUE"`. |
| `targetValue` | Integer | Value (0-255) for `SET_VALUE` action. |
| `repeatMode` | String | `"daily"`, `"once"`, `"count"`. |
| `repeatCount` | Integer | Runs remaining for `"count"` mode. |
| `time` | String | Time string `"HH:MM"`. |
| `duration` | Integer | Seconds for countdown types. |
| `startedAt` | Integer | Unix timestamp when rule started. |
| `sourceSegmentId` | String | Sensor ID to monitor (weather). |
| `conditionMetric` | String | `"temp"` or `"hum"`. |
| `conditionOperator`| String | `">"`, `"<"`, or `"="`. |
| `conditionValue` | Float | Threshold value. |
| `sourceGpio` | Integer | GPIO pin to monitor (input). |
| `inputTrigger` | Integer | Logic: `2` (High), `3` (Low), `1` (Toggle), `0` (Hold). |
