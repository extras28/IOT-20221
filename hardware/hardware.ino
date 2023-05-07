#include <ESP8266WiFi.h>
#include <Wire.h>
#include <PCF8574.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"
#include <ArduinoJson.h>
#include <string>

// địa chi wifi
const char* ssid = "dungna";
const char* password = "88888888";

// MQTT Broker
const char* mqtt_server = "broker.mqttdashboard.com";
const int mqtt_port = 1883;
const char* mqtt_user = "dungna";
const char* mqtt_password = "dungna";
const char* sending_topic = "DUNGNA_SENDING";
const char* receiving_topic = "DUNGNA_RECEIVING";
const char* mqtt_topic = "DUNGNA";
const String sensorId = WiFi.macAddress();


WiFiClient espClient;
PubSubClient client(espClient);

// Cảm biến nhiệt độ, độ ẩm môi trường DHT11
#define DHT11Pin 3
#define DHTType DHT11
DHT DHT(DHT11Pin, DHTType);

const int s0 = 14;  // chân S0 của module 74HC4067
const int s1 = 15;  // chân S1 của module 74HC4067
const int s2 = 12;  // chân S2 của module 74HC4067
const int s3 = 13;  // chân S3 của module 74HC4067

const int sensor_pin = A0;  // chân GPIO của ESP8266 để đọc dữ liệu từ module 74HC4067
const int COM_PIN = 14;     // chân COM kết nối với chân GND của 74HC4067

// Địa chỉ I2C của module PCF8574
PCF8574 pcf85741(0x27);
PCF8574 pcf85742(0x20);


// Trạng thái của các relay
bool relay_sensor_state[16];

// trạng thái của relay máy bơm
bool relay_pumper_state = false;

// trạng thái auto mode của từng vòi
bool auto_mode[16];

// breakpoint của từng sensor
int breakpoint[16];

// Hàm kết nối wifi
void connectWiFi() {
  // Connect to WiFi network
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  Serial.print("esp8266 MAC address: ");
  Serial.println(WiFi.macAddress());
}

// Hàm nhận dữ liệu từ MQTT broker
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived in topic: ");
  Serial.println(receiving_topic);
  Serial.print("Message:");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();

  // converse to JSON
  StaticJsonDocument<256> doc;
  deserializeJson(doc, payload);
  if (doc["balconyId"] == sensorId.c_str()) {
    switch (doc["flag"].as<int>()) {
      case 0:
        //manual control
        if (doc["requestCode"].as<int>() == 1) {
          setRelayState(doc["plantId"].as<int>(), true);
        } else if (doc["requestCode"].as<int>() == 0) {
          setRelayState(doc["plantId"].as<int>(), false);
        };
        break;
      case 1:
        // toggle auto mode
        auto_mode[doc["plantId"].as<int>()] = doc["autoMode"];
        if (!auto_mode[doc["plantId"].as<int>()]) {
          setRelayState(doc["plantId"].as<int>(), false);
        }
        break;
      case 2:
        // set breakpoint
        breakpoint[doc["plantId"].as<int>()] = doc["soilMoistureBreakpoint"];
        break;
      default:
        /*
          If x is not equal to one of the values above
          the code in this block will be executed
        */
        break;
    }
  }
}

// Hàm reconnect khi mất kết nối đến MQTT broker
void reconnect() {
  while (!client.connected()) {
    String client_id = "esp8266-client-";
    client_id += String(WiFi.macAddress());
    Serial.printf("The client %s is connecting to the public mqtt broker\n", client_id.c_str());
    if (client.connect(client_id.c_str(), mqtt_user, mqtt_password)) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
  client.subscribe(receiving_topic);
}

// Hàm gửi dữ liệu điều khiển relay đến module PCF8574
void setRelayState(uint8_t relay, bool state) {
   int temp_relay = relay;
  if (!state) {
    if (relay_sensor_state[relay]) {
      if (relay < 8) {
        Serial.println("tắt nhỏ hơn 8");
        pcf85741.digitalWrite(relay, HIGH);
      } else {
        temp_relay = relay - 8;
        Serial.println("tắt lớn hơn 8");
        pcf85742.digitalWrite(temp_relay, HIGH);
      }
      relay_sensor_state[relay] = false;
    }

    for (int i = 0; i < 16; i++) {
      if (relay_sensor_state[i]) {
        relay_pumper_state = true;
        break;
      } else {
        relay_pumper_state = false;
      }
    }

    if (!relay_pumper_state) {
      digitalWrite(0, HIGH);
    }
    Serial.print("turn off relay: ");
    Serial.println(relay);
  } else {
    if (!relay_sensor_state[relay]) {
      if (relay < 8) {
        Serial.println("bật nhỏ hơn 8");
        pcf85741.digitalWrite(relay, LOW);
      } else {
        temp_relay = relay - 8;
        Serial.println("bật lớn hơn 8");
        pcf85742.digitalWrite(temp_relay, LOW);
      }
      relay_sensor_state[relay] = true;
    }

    if (!relay_pumper_state) {
      digitalWrite(0, LOW);
      relay_pumper_state = true;
    }

    Serial.print("turn on relay: ");
    Serial.println(relay);
  }
}

int readMoisture(int channel) {
  switch (channel) {
    case 0:
      digitalWrite(s0, LOW);
      digitalWrite(s1, LOW);
      digitalWrite(s2, LOW);
      digitalWrite(s3, LOW);
      break;
    case 1:
      digitalWrite(s0, HIGH);
      digitalWrite(s1, LOW);
      digitalWrite(s2, LOW);
      digitalWrite(s3, LOW);
      break;
    case 2:
      digitalWrite(s0, LOW);
      digitalWrite(s1, HIGH);
      digitalWrite(s2, LOW);
      digitalWrite(s3, LOW);
      break;
    case 3:
      digitalWrite(s0, HIGH);
      digitalWrite(s1, HIGH);
      digitalWrite(s2, LOW);
      digitalWrite(s3, LOW);
      break;
    case 4:
      digitalWrite(s0, LOW);
      digitalWrite(s1, LOW);
      digitalWrite(s2, HIGH);
      digitalWrite(s3, LOW);
      break;
    case 5:
      digitalWrite(s0, HIGH);
      digitalWrite(s1, LOW);
      digitalWrite(s2, HIGH);
      digitalWrite(s3, LOW);
      break;
    case 6:
      digitalWrite(s0, LOW);
      digitalWrite(s1, HIGH);
      digitalWrite(s2, HIGH);
      digitalWrite(s3, LOW);
      break;
    case 7:
      digitalWrite(s0, HIGH);
      digitalWrite(s1, HIGH);
      digitalWrite(s2, HIGH);
      digitalWrite(s3, LOW);
      break;
    case 8:
      digitalWrite(s0, LOW);
      digitalWrite(s1, LOW);
      digitalWrite(s2, LOW);
      digitalWrite(s3, HIGH);
      break;
    case 9:
      digitalWrite(s0, HIGH);
      digitalWrite(s1, LOW);
      digitalWrite(s2, LOW);
      digitalWrite(s3, HIGH);
      break;
    case 10:
      digitalWrite(s0, LOW);
      digitalWrite(s1, HIGH);
      digitalWrite(s2, LOW);
      digitalWrite(s3, HIGH);
      break;
    case 11:
      digitalWrite(s0, HIGH);
      digitalWrite(s1, HIGH);
      digitalWrite(s2, LOW);
      digitalWrite(s3, HIGH);
      break;
    case 12:
      digitalWrite(s0, LOW);
      digitalWrite(s1, LOW);
      digitalWrite(s2, HIGH);
      digitalWrite(s3, HIGH);
      break;
    case 13:
      digitalWrite(s0, HIGH);
      digitalWrite(s1, LOW);
      digitalWrite(s2, HIGH);
      digitalWrite(s3, HIGH);
      break;
    case 14:
      digitalWrite(s0, LOW);
      digitalWrite(s1, HIGH);
      digitalWrite(s2, HIGH);
      digitalWrite(s3, HIGH);
      break;
    case 15:
      digitalWrite(s0, HIGH);
      digitalWrite(s1, HIGH);
      digitalWrite(s2, HIGH);
      digitalWrite(s3, HIGH);
      break;
  }

  int moisture = analogRead(sensor_pin);

  int moisture_percent = map(moisture, 0, 1023, 100, 0);  // chuyển đổi giá trị ADC sang phần trăm độ ẩm đất

  //  if (moisture_percent < 60) {
  return moisture_percent;
  //  }
  //  return 100;
}

void setup() {
  Serial.begin(115200);

  connectWiFi();

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);


  // chân pin cho relay bật tắt máy bơm
  pinMode(0, OUTPUT);

  // Set pinMode to OUTPUT
  pcf85741.pinMode(0, OUTPUT);
  pcf85741.pinMode(1, OUTPUT);
  pcf85741.pinMode(2, OUTPUT);
  pcf85741.pinMode(3, OUTPUT);
  pcf85741.pinMode(4, OUTPUT);
  pcf85741.pinMode(5, OUTPUT);
  pcf85741.pinMode(6, OUTPUT);
  pcf85741.pinMode(7, OUTPUT);
  pcf85742.pinMode(0, OUTPUT);
  pcf85742.pinMode(1, OUTPUT);
  pcf85742.pinMode(2, OUTPUT);
  pcf85742.pinMode(3, OUTPUT);
  pcf85742.pinMode(4, OUTPUT);
  pcf85742.pinMode(5, OUTPUT);
  pcf85742.pinMode(6, OUTPUT);
  pcf85742.pinMode(7, OUTPUT);

  // Khởi tạo kết nối I2C
  pcf85741.begin();
  pcf85742.begin();


  pinMode(s0, OUTPUT);
  pinMode(s1, OUTPUT);
  pinMode(s2, OUTPUT);
  pinMode(s3, OUTPUT);

  pinMode(sensor_pin, INPUT);


  // set trạng thái mặc định cho các relay là tắt
  pcf85741.digitalWrite(0, HIGH);
  pcf85741.digitalWrite(1, HIGH);
  pcf85741.digitalWrite(2, HIGH);
  pcf85741.digitalWrite(3, HIGH);
  pcf85741.digitalWrite(4, HIGH);
  pcf85741.digitalWrite(5, HIGH);
  pcf85741.digitalWrite(6, HIGH);
  pcf85741.digitalWrite(7, HIGH);
  pcf85742.digitalWrite(0, HIGH);
  pcf85742.digitalWrite(1, HIGH);
  pcf85742.digitalWrite(2, HIGH);
  pcf85742.digitalWrite(3, HIGH);
  pcf85742.digitalWrite(4, HIGH);
  pcf85742.digitalWrite(5, HIGH);
  pcf85742.digitalWrite(6, HIGH);
  pcf85742.digitalWrite(7, HIGH);

  for (int i = 0; i < 16; i++) {
    relay_sensor_state[i] = false;
    auto_mode[i] = false;
    breakpoint[i] = 100;
  }

  digitalWrite(0, HIGH);
  relay_pumper_state = false;
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Nhiệt độ, độ ẩm môi trường
  float temp = DHT.readTemperature();
  float humid = DHT.readHumidity();

  //  send data to mqtt
  DynamicJsonDocument doc(1024);
  JsonObject obj = doc.as<JsonObject>();
  doc["balconyId"] = sensorId.c_str();
  doc["enviromentTemperature"] = temp;
  doc["enviromentHumidity"] = humid;

  int sensorArr[16];

  // Tạo một JSONArray mới với kích thước bằng với mảng myArray
  JsonArray jsonArray = doc.createNestedArray("sensorArr");

  for (int channel = 0; channel < 16; channel++) {

    int moisture = readMoisture(channel);  // đọc giá trị độ ẩm đất từ kênh được chọn

    jsonArray.add(moisture);

    delay(20);
  }

  for (int i = 0; i < 16; i++) {
    if (auto_mode[i]) {
      if (breakpoint[i] > readMoisture(i)) {
        setRelayState(i, true);
        int mois = readMoisture(i);
        Serial.print("turn on");
        Serial.println(mois);
      } else {
        setRelayState(i, false);
        int mois = readMoisture(i);
        Serial.print("turn off");
        Serial.println(mois);
      }
    }
  }



  char jsonStr[1000];
  serializeJson(doc, jsonStr);

  client.publish(sending_topic, jsonStr);
  delay(1000);
}