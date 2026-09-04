/*
 * Origin campus ERP — RFID attendance reader (ESP32 + MFRC522v2).
 *
 * Cards are no longer authorised on the device. Every tap is posted to
 * POST /api/attendance/rfid, and the server matches the UID against the card
 * register, marks the holder present for the day and answers with who they are.
 * That means cards can be issued, moved or revoked from the admin console
 * without reflashing this board.
 *
 * The servo acts as the gate: it only opens once the server confirms the mark.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <time.h>

#include <MFRC522v2.h>
#include <MFRC522DriverSPI.h>
#include <MFRC522DriverPinSimple.h>
#include <MFRC522Debug.h>
#include <ESP32Servo.h>

/* ---------------------------------------------------------------- config -- */

#define WIFI_SSID  "your-wifi"
#define WIFI_PASS  "your-wifi-password"

/* The backend. Use the host's LAN IP — "localhost" is the ESP32 itself. */
#define API_BASE   "http://192.168.1.10:8000"

/* Must match RFID_DEVICE_KEY in the backend .env. Leave "" if it is unset. */
#define DEVICE_KEY ""

/* Identifies this reader in the attendance log. */
#define READER_ID  "GATE-A"

/* IST. Offset in seconds; no daylight saving. */
#define TZ_OFFSET_SEC  19800
#define TZ_SUFFIX      "+05:30"

/* ------------------------------------------------------------------ pins -- */

#define SS_PIN     21
#define RST_PIN    22
#define SERVO_PIN  13
#define LED_PIN     2

#define SERVO_CLOSED   0
#define SERVO_OPEN    90
#define GATE_OPEN_MS 800

/* Ignore repeat taps of the same card so a card left on the reader does not
   hammer the API. Different cards are always sent straight through. */
#define SAME_CARD_COOLDOWN_MS 5000

#define HTTP_TIMEOUT_MS 5000

MFRC522DriverPinSimple ss_pin(SS_PIN);
MFRC522DriverSPI driver{ss_pin};
MFRC522 mfrc522{driver};
Servo gate;

String lastUid = "";
unsigned long lastScanMs = 0;

/* ----------------------------------------------------------------- utils -- */

/** UID bytes as uppercase hex, e.g. "9CFE1A4A" — the form the API stores. */
String uidToHex() {
  String out;
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) out += '0';
    out += String(mfrc522.uid.uidByte[i], HEX);
  }
  out.toUpperCase();
  return out;
}

/** Current time as ISO 8601 with offset, e.g. "2026-09-05T09:12:44+05:30". */
String isoTimestamp() {
  struct tm t;
  if (!getLocalTime(&t, 1000)) return "";  // clock not synced yet
  char buf[32];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%S", &t);
  return String(buf) + TZ_SUFFIX;
}

/**
 * Pulls a string field out of the JSON response. The reply shape is small and
 * fixed, so this avoids pulling in a JSON library. Swap for ArduinoJson if the
 * response ever grows.
 */
String jsonString(const String &body, const char *key) {
  String needle = String("\"") + key + "\":\"";
  int start = body.indexOf(needle);
  if (start < 0) return "";
  start += needle.length();
  int end = body.indexOf('"', start);
  if (end < 0) return "";
  return body.substring(start, end);
}

/* -------------------------------------------------------------- feedback -- */

void blink(int times, int onMs, int offMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(onMs);
    digitalWrite(LED_PIN, LOW);
    if (i < times - 1) delay(offMs);
  }
}

/** Marked present: hold the LED and let them through. */
void openGate() {
  digitalWrite(LED_PIN, HIGH);
  gate.write(SERVO_OPEN);
  delay(GATE_OPEN_MS);
  gate.write(SERVO_CLOSED);
  digitalWrite(LED_PIN, LOW);
}

/* ------------------------------------------------------------------ wifi -- */

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print(F("WiFi: connecting"));
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long started = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - started < 20000) {
    delay(500);
    Serial.print('.');
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print(F(" connected, IP "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F(" FAILED — will retry on next scan"));
  }
}

/* ------------------------------------------------------------- the call --- */

/**
 * Posts one tap. Returns true when the holder was marked present (or was
 * already present today), false for a rejected card or a transport failure.
 */
bool postScan(const String &uid) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println(F("  -> no network, scan dropped"));
      return false;
    }
  }

  String scannedAt = isoTimestamp();
  if (scannedAt.isEmpty()) {
    // Without a synced clock the server would date the scan on its own arrival
    // time; send nothing rather than a wrong timestamp and let it default.
    Serial.println(F("  !  clock not synced, omitting scannedAt"));
  }

  String payload = String("{\"cardId\":\"") + uid + "\"";
  if (!scannedAt.isEmpty()) payload += String(",\"scannedAt\":\"") + scannedAt + "\"";
  payload += String(",\"reader\":\"") + READER_ID + "\"}";

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.begin(String(API_BASE) + "/api/attendance/rfid");
  http.addHeader("Content-Type", "application/json");
  if (strlen(DEVICE_KEY) > 0) http.addHeader("x-device-key", DEVICE_KEY);

  int status = http.POST(payload);
  String body = http.getString();
  http.end();

  if (status <= 0) {
    Serial.print(F("  -> transport error: "));
    Serial.println(HTTPClient::errorToString(status));
    return false;
  }

  switch (status) {
    case 201: {  // first tap of the day
      Serial.print(F("  -> PRESENT: "));
      Serial.print(jsonString(body, "name"));
      Serial.print(F(" ("));
      Serial.print(jsonString(body, "id"));
      Serial.println(F(")"));
      return true;
    }
    case 200: {  // already marked earlier today
      Serial.print(F("  -> already present today: "));
      Serial.println(jsonString(body, "name"));
      return true;
    }
    case 401:
      Serial.println(F("  -> reader key rejected (check DEVICE_KEY)"));
      return false;
    case 403:
      Serial.print(F("  -> card blocked: "));
      Serial.println(jsonString(body, "error"));
      return false;
    case 404:
      Serial.print(F("  -> "));
      Serial.println(jsonString(body, "error"));
      return false;
    default:
      Serial.print(F("  -> HTTP "));
      Serial.print(status);
      Serial.print(F(": "));
      Serial.println(jsonString(body, "error"));
      return false;
  }
}

/* ----------------------------------------------------------------- setup -- */

void setup() {
  Serial.begin(115200);
  delay(2000);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  pinMode(RST_PIN, OUTPUT);
  digitalWrite(RST_PIN, LOW);
  delay(50);
  digitalWrite(RST_PIN, HIGH);
  delay(50);

  gate.setPeriodHertz(50);
  gate.attach(SERVO_PIN, 500, 2400);
  gate.write(SERVO_CLOSED);

  mfrc522.PCD_Init();
  delay(50);

  connectWiFi();

  // The board has no battery-backed clock, so the time comes from NTP.
  configTime(TZ_OFFSET_SEC, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print(F("Clock: syncing"));
  for (int i = 0; i < 20 && isoTimestamp().isEmpty(); i++) {
    delay(500);
    Serial.print('.');
  }
  String now = isoTimestamp();
  Serial.println(now.isEmpty() ? String(F(" FAILED")) : String(F(" ")) + now);

  Serial.println(F("Attendance reader ready. Present a card."));
  blink(2, 120, 120);
}

/* ------------------------------------------------------------------ loop -- */

void loop() {
  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  String uid = uidToHex();
  Serial.print(F("Card "));
  Serial.print(uid);

  // Only the same card is rate-limited; a different person is never delayed.
  if (uid == lastUid && millis() - lastScanMs < SAME_CARD_COOLDOWN_MS) {
    unsigned long left = (SAME_CARD_COOLDOWN_MS - (millis() - lastScanMs)) / 1000;
    Serial.print(F("  -> cooldown, "));
    Serial.print(left + 1);
    Serial.println(F("s remaining"));
  } else {
    Serial.println();
    if (postScan(uid)) {
      openGate();
    } else {
      blink(3, 80, 80);  // rejected or unreachable
    }
    lastUid = uid;
    lastScanMs = millis();
  }

  mfrc522.PICC_HaltA();
  delay(500);
}
