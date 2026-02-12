
# Global Settings Dictionary (JSON Keys)

When the dashboard sends the configuration to the ESP32 (via HTTP POST or WebSocket), it includes a `settings` object. 
Below are the exact **Key Strings** used in the JSON and their expected data types.

## 1. Identity & Network
| JSON Key | Data Type | Description |
| :--- | :--- | :--- |
| `"title"` | String | The main title displayed on the header (e.g., "MY SMART HOME"). |
| `"domain"` | String | The IP address or mDNS hostname of the device. |
| `"language"` | String | Language code: `"en"` (English) or `"fa"` (Persian). |

## 2. Visual Theme & Colors
| JSON Key | Data Type | Description |
| :--- | :--- | :--- |
| `"theme"` | String | `"dark"` or `"light"`. |
| `"primaryColor"` | String (Hex) | The main accent color (e.g., `"#daa520"`). |
| `"cursorColor"` | String (Hex) | The secondary/cursor color (e.g., `"#00bfff"`). |
| `"dashboardFont"` | String | Font name (e.g., `"Inter"`, `"Oswald"`, `"DinaRemaster"`). |

## 3. Background Pattern Engine
| JSON Key | Data Type | Description |
| :--- | :--- | :--- |
| `"backgroundEffect"` | String | Pattern type: `"grid"`, `"dots"`, `"squares"`, `"triangles"`. |
| `"dualColorBackground"` | Boolean | `true` = Use both Primary & Cursor colors for pattern. |
| `"hollowShapes"` | Boolean | `true` = Outlined shapes; `false` = Filled shapes. |
| `"patternOpacity"` | Integer | Opacity of the main pattern layer (0-100). |
| `"secondaryPatternOpacity"`| Integer | Opacity of the secondary layer (0-100). |
| `"enableTextPattern"` | Boolean | `true` = Show text overlay on background. |
| `"textPatternValue"` | String | The text string to repeat in background (e.g., "KAMYAR"). |
| `"textPatternColor"` | String (Hex)| Specific color for the text overlay. |
| `"textPatternOpacity"` | Integer | Opacity of the text overlay (0-100). |

## 4. Grid Specifics (If effect is "grid")
| JSON Key | Data Type | Description |
| :--- | :--- | :--- |
| `"gridSize"` | Integer | Size of grid cells in pixels (e.g., `32`). |
| `"gridLineStyle"` | String | `"solid"`, `"dashed"`, or `"dotted"`. |
| `"gridStrokeWidth"` | Integer | Thickness of grid lines. |

## 5. Header Visuals
| JSON Key | Data Type | Description |
| :--- | :--- | :--- |
| `"headerGap"` | Integer | Gap size between header islands (pixels). |
| `"headerWaveOpacity"` | Integer | Opacity of the electric waves (0-100). |
| `"headerDynamicIntensity"` | Boolean | `true` = Waves pulse with animation. |

## 6. Audio & Animation
| JSON Key | Data Type | Description |
| :--- | :--- | :--- |
| `"animations"` | Boolean | `true` = Enable UI animations; `false` = Reduced motion. |
| `"enableSFX"` | Boolean | `true` = Enable UI Sound Effects (Clicks, Blips). |
| `"bgMusic"` | Boolean | `true` = Play background ambient music. |
| `"volume"` | Integer | Master volume (0-100). |
| `"currentTrackIndex"` | Integer | Index of the currently selected music track. |

## 7. System
| JSON Key | Data Type | Description |
| :--- | :--- | :--- |
| `"enableNotifications"` | Boolean | `true` = Show toast notifications. |
| `"useSsl"` | Boolean | `true` = Use `wss://`; `false` = Use `ws://`. |

---

### Example JSON Payload (Partial)
```json
{
  "settings": {
    "title": "Room 101",
    "theme": "dark",
    "primaryColor": "#ff0000",
    "animations": true,
    "backgroundEffect": "grid",
    "gridSize": 40
  }
}
```
