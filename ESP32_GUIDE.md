
# راهنمای توسعه فرم‌ور ESP32 - پروتکل V4.0 (Variable Length)

پروتکل جدید (نسخه 4.0) از بسته‌های داده با طول متغیر پشتیبانی می‌کند تا سرعت بالاتر برای دستورات ساده (مثل خاموش/روشن) و قابلیت ارسال متن (برای OLED) را فراهم کند.

---

## 1. ساختار پکت جدید (Packet V4)

هر پکت شامل **هدر (4 بایت)** + **دیتا (متغیر)** + **فوتر (1 بایت)** است.

| بایت | نام | توضیحات |
| :--- | :--- | :--- |
| 0 | `CMD` | دستور (uint8) |
| 1 | `SEG_L` | شناسه سگمنت/پین (Low Byte) |
| 2 | `SEG_H` | شناسه سگمنت/پین (High Byte) |
| 3 | `LEN` | طول دیتای بعدی (0 تا 255) |
| 4... | `DATA` | بایت‌های دیتا (به تعداد LEN) |
| 4+LEN | `CRC` | چک‌سام کل پکت (Header + Data) |

### مثال‌های طول پکت
1.  **روشن کردن (LED_ON):** دیتا ندارد. LEN=0. کل پکت = 5 بایت.
2.  **تنظیم نور (PWM):** دیتای عدد صحیح (4 بایت). LEN=4. کل پکت = 9 بایت.
3.  **متن "Hi":** دیتای متنی (2 بایت). LEN=2. کل پکت = 7 بایت.

---

## 2. پیاده‌سازی گیرنده (C++ State Machine)

از آنجا که طول پکت متغیر است، دیگر نمی‌توانید فقط 8 بایت بخوانید. باید ابتدا هدر را بخوانید، `LEN` را بفهمید و سپس بقیه را بخوانید.

```cpp
#include <Arduino.h>

// بافر موقت برای دریافت پکت
uint8_t rxBuffer[260]; // Max Header(4) + Data(255) + CRC(1)

// ساختار پکت دیکد شده
struct Packet {
  uint8_t cmd;
  uint16_t seg;
  uint8_t len;
  uint8_t *data; // اشاره‌گر به شروع دیتا در بافر
  
  // هلپر برای خواندن عدد صحیح (مثل پروتکل قدیم)
  int32_t getInt() {
    if (len < 4) return 0;
    int32_t val;
    memcpy(&val, data, 4);
    return val; // فرض بر Little Endian بودن ESP32
  }
  
  // هلپر برای خواندن متن
  String getString() {
    char str[len + 1];
    memcpy(str, data, len);
    str[len] = 0; // Null terminate
    return String(str);
  }
};

// محاسبه CRC8
uint8_t calcCRC8(uint8_t *data, size_t len) {
  uint8_t crc = 0;
  for (size_t i = 0; i < len; i++) {
    uint8_t inbyte = data[i];
    for (uint8_t j = 0; j < 8; j++) {
      uint8_t mix = (crc ^ inbyte) & 0x01;
      crc >>= 1;
      if (mix) crc ^= 0x8C;
      inbyte >>= 1;
    }
  }
  return crc;
}

void handleWebSocketData(uint8_t *payload, size_t length) {
  // 1. بررسی حداقل طول (هدر + CRC = 5 بایت)
  if (length < 5) return;

  // 2. استخراج هدر
  uint8_t cmd = payload[0];
  uint16_t seg = payload[1] | (payload[2] << 8);
  uint8_t dataLen = payload[3];

  // 3. بررسی صحت طول کل پکت
  if (length != (4 + dataLen + 1)) {
    Serial.println("Packet Size Mismatch!");
    return;
  }

  // 4. بررسی CRC
  uint8_t receivedCRC = payload[4 + dataLen];
  uint8_t calculatedCRC = calcCRC8(payload, 4 + dataLen);
  
  if (receivedCRC != calculatedCRC) {
    Serial.println("CRC Error!");
    return;
  }

  // 5. ساخت آبجکت پکت برای استفاده راحت
  Packet pkt;
  pkt.cmd = cmd;
  pkt.seg = seg;
  pkt.len = dataLen;
  pkt.data = &payload[4];

  // 6. اجرای دستورات
  switch (pkt.cmd) {
    case 0x01: // LED_ON
      pinMode(pkt.seg, OUTPUT);
      digitalWrite(pkt.seg, HIGH);
      break;

    case 0x02: // LED_OFF
      pinMode(pkt.seg, OUTPUT);
      digitalWrite(pkt.seg, LOW);
      break;

    case 0x04: // LED_PWM (عدد 4 بایتی)
      {
        int32_t pwmVal = pkt.getInt();
        ledcWrite(pkt.seg, pwmVal); // کانال باید قبلا مپ شده باشد
      }
      break;
      
    case 0x19: // DISPLAY_UPDATE (جدید: دریافت متن)
      {
        String text = pkt.getString();
        Serial.print("OLED Text: ");
        Serial.println(text);
        // oled.print(text);
      }
      break;
  }
}
```

---

## 3. نحوه ارسال پکت از ESP32 به داشبورد (V4)

برای ارسال دما یا وضعیت، شما هم باید همین فرمت را رعایت کنید.

### مثال: ارسال دما (عدد صحیح)
```cpp
void sendTemp(uint8_t pin, float temp) {
  int32_t val = (int32_t)(temp * 10);
  
  uint8_t buf[9]; // 4 Header + 4 Data + 1 CRC
  
  // Header
  buf[0] = 0x09; // CMD: TEMP_DATA
  buf[1] = pin & 0xFF;
  buf[2] = (pin >> 8) & 0xFF;
  buf[3] = 4;    // LEN: 4 bytes
  
  // Data (Little Endian)
  memcpy(&buf[4], &val, 4);

  // Footer
  buf[8] = calcCRC8(buf, 8);
  
  webSocket.sendBIN(num, buf, 9);
}
```

### مثال: ارسال لاگ متنی (CONSOLE)
```cpp
void sendLog(String msg) {
  uint8_t len = msg.length();
  uint8_t totalSize = 4 + len + 1;
  uint8_t *buf = (uint8_t *)malloc(totalSize);
  
  buf[0] = 0x11; // CMD: CONSOLE
  buf[1] = 0;    // SEG L (Unused)
  buf[2] = 0;    // SEG H (Unused)
  buf[3] = len;  // Payload Length
  
  memcpy(&buf[4], msg.c_str(), len);
  
  buf[4 + len] = calcCRC8(buf, 4 + len);
  
  webSocket.sendBIN(num, buf, totalSize);
  free(buf);
}
```
