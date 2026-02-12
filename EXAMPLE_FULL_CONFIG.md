
# Master Blueprint: Complete Dashboard JSON (V5.0 - Final)

This is the definitive structure for the Dashboard configuration. Use this to design your ESP32 JSON parser.

```json
{
  "settings": {
    "title": "NEURAL CORE PRO",
    "domain": "192.168.1.50",
    "theme": "dark",
    "primaryColor": "#daa520",
    "cursorColor": "#00bfff",
    "language": "fa",
    "dashboardFont": "DinaRemaster",
    "backgroundEffect": "grid",
    "gridSize": 32,
    "gridLineStyle": "dashed",
    "gridStrokeWidth": 1,
    "animations": true,
    "enableSFX": true,
    "bgMusic": true,
    "volume": 35,
    "currentTrackIndex": 12,
    "enableNotifications": true,
    "useSsl": false,
    "dualColorBackground": true,
    "hollowShapes": false,
    "enableTextPattern": true,
    "textPatternValue": "KAMYAR-CORE-V3",
    "textPatternColor": "#808080",
    "textPatternOpacity": 15,
    "headerGap": 40,
    "headerWaveOpacity": 85,
    "headerDynamicIntensity": true
  },
  "groups": [
    { "id": "grp_main", "name": "Main Hall", "order": 0 },
    { "id": "grp_garden", "name": "Garden & Entry", "order": 1 }
  ],
  "segments": [
    {
      "num_of_node": "rel_1",
      "groupId": "grp_main",
      "name": "Main Light",
      "groupType": "custom",
      "segType": "Digital",
      "gpio": 5,
      "is_led_on": "off"
    },
    {
      "num_of_node": "dim_1",
      "groupId": "grp_main",
      "name": "Ambient LED",
      "groupType": "custom",
      "segType": "PWM",
      "gpio": 18,
      "is_led_on": "on",
      "val_of_slide": 145
    },
    {
      "num_of_node": "reg_0",
      "groupId": "grp_main",
      "name": "Chandelier 1",
      "groupType": "register",
      "segType": "Digital",
      "dsPin": 13,
      "shcpPin": 14,
      "stcpPin": 15,
      "regBitIndex": 0,
      "is_led_on": "off"
    },
    {
      "num_of_node": "reg_3",
      "groupId": "grp_main",
      "name": "Wall Wash",
      "groupType": "register",
      "segType": "Digital",
      "dsPin": 13,
      "shcpPin": 14,
      "stcpPin": 15,
      "regBitIndex": 3,
      "is_led_on": "on"
    },
    {
      "num_of_node": "dht_1",
      "groupId": "grp_garden",
      "name": "Garden Sensor",
      "groupType": "weather",
      "segType": "DHT",
      "dhtPin": 4,
      "dhtType": "DHT22",
      "temperature": 26.5,
      "humidity": 45.2
    },
    {
      "num_of_node": "pir_1",
      "groupId": "grp_garden",
      "name": "Entrance Motion",
      "groupType": "input",
      "segType": "Input-0-1",
      "gpio": 12,
      "inputActive": false
    },
    {
      "num_of_node": "oled_1",
      "groupId": "grp_main",
      "name": "System Info",
      "groupType": "display",
      "segType": "OLED",
      "sdaPin": 21,
      "sclPin": 22,
      "i2cAddress": "0x3C",
      "displayWidth": 128,
      "displayHeight": 64,
      "displayContent": "CPU OK"
    }
  ],
  "schedules": [
    {
      "id": "sch_8am_on",
      "enabled": true,
      "type": "daily",
      "time": "08:00",
      "targetSegmentId": "rel_1",
      "action": "ON",
      "repeatMode": "daily"
    },
    {
      "id": "sch_auto_cool",
      "enabled": true,
      "type": "weather",
      "sourceSegmentId": "dht_1",
      "conditionMetric": "temp",
      "conditionOperator": ">",
      "conditionValue": 30.0,
      "targetSegmentId": "dim_1",
      "action": "SET_VALUE",
      "targetValue": 255
    },
    {
      "id": "sch_motion_light",
      "enabled": false,
      "type": "input",
      "sourceGpio": 12,
      "inputTrigger": 2,
      "targetSegmentId": "reg_0",
      "action": "ON"
    }
  ]
}
```
