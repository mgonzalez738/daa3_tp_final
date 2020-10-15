#include <Arduino.h>
#include <WiFi.h>
#include "AzureIotHub.h"
#include "Esp32MQTTClient.h"
#include "NTPClient.h"
#include <EasyButton.h>
#include "DHT.h"

// DATOS DE CONEXION DEL DISPOSITIVO
//#define DEVICE_ID "CEIoT-Esp32-A"
#define DEVICE_ID "CEIoT-Esp32-B"
//#define MONGO_ID "5f7e8600bf704300353b1a43"
#define MONGO_ID "5f7e8761bf704300353b1ae7"
#define DEVICE_TYPE "SensorTempHum"
//static const char* connectionString = "HostName=MonitoringHub.azure-devices.net;DeviceId=CEIoT-Esp32-A;SharedAccessKey=yd50JChs28iFp44VESQMB+/9A2ge4c55fOKik3xXGpg=";
static const char* connectionString = "HostName=MonitoringHub.azure-devices.net;DeviceId=CEIoT-Esp32-B;SharedAccessKey=IQHA0PZMI4Vzjj1BkzaBXswSizjBLI2TKkcYr0haGTk=";

// CONFIGURACION
#define MESSAGE_MAX_LEN 256
#define ONBOARD_LED  2
#define INTERVAL 60000
#define DHTPIN 4
#define DHTTYPE DHT22   // DHT 22  (AM2302), AM2321

// WIFI
const char* ssid     = "GyMFondo";
const char* password = "matangalatanga";

// MENSAJE DATOS
const char *messageData = "{\"Timestamp\":\"%s\", \"Temperature\":%f, \"Humidity\":%f}";

// MENSAJE EVENTO
const char *messageEvent = "{\"Timestamp\":\"%s\", \"Event\":\"%s\"}";

// CLIENTE NTP
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP);

static bool hasWifi = false;
static bool messageSending = true;
static bool sendLedOnEvent = false;
static bool sendLedOffEvent = false;
static uint64_t send_interval_ms;
bool ledStatus = false;

// Initialize DHT sensor.
DHT dht(DHTPIN, DHTTYPE);


//////////////////////////////////////////////////////////////////////////////////////////////////////////
// Utilities
static void InitWifi()
{
  Serial.println("Connecting...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  hasWifi = true;
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
}

static void SendConfirmationCallback(IOTHUB_CLIENT_CONFIRMATION_RESULT result)
{
  if (result == IOTHUB_CLIENT_CONFIRMATION_OK)
  {
    Serial.println("Send Confirmation Callback finished.");
  }
}

static void MessageCallback(const char* payLoad, int size)
{
  Serial.println("Message callback:");
  Serial.println(payLoad);
}

static void DeviceTwinCallback(DEVICE_TWIN_UPDATE_STATE updateState, const unsigned char *payLoad, int size)
{
  char *temp = (char *)malloc(size + 1);
  if (temp == NULL)
  {
    return;
  }
  memcpy(temp, payLoad, size);
  temp[size] = '\0';
  // Display Twin message.
  Serial.println(temp);
  free(temp);
}

static int  DeviceMethodCallback(const char *methodName, const unsigned char *payload, int size, unsigned char **response, int *response_size)
{
  const char *responseMessage = "\"Successfully invoke device method\"";
  int result = 200;

  if (strcmp(methodName, "start") == 0)
  {
    LogInfo("Start sending temperature and humidity data");
    messageSending = true;
  }
  else if (strcmp(methodName, "stop") == 0)
  {
    LogInfo("Stop sending temperature and humidity data");
    messageSending = false;
  }
  else if (strcmp(methodName, "ledOn") == 0)
  {
    LogInfo("Led On");
    ledStatus = true;
    digitalWrite(ONBOARD_LED, HIGH);
    sendLedOnEvent = true;
  }
  else if (strcmp(methodName, "ledOff") == 0)
  {
    LogInfo("Led Off");
    ledStatus = false;
    digitalWrite(ONBOARD_LED, LOW);
    sendLedOffEvent = true;
  }
  else if (strcmp(methodName, "ledStatus") == 0)
  {
    LogInfo("Led Status");
    if(ledStatus == true)
      responseMessage = "\"true\"";
    else
      responseMessage = "\"false\"";
  }
  else
  {
    LogInfo("No method %s found", methodName);
    responseMessage = "\"No method found\"";
    result = 404;
  }

  *response_size = strlen(responseMessage);
  *response = (unsigned char *)strdup(responseMessage);  

  return result;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
// Arduino sketch
void setup()
{
  Serial.begin(115200);
  Serial.println("ESP32 Device");
  Serial.println("Initializing...");

  dht.begin();

  pinMode(ONBOARD_LED, OUTPUT);

  // Initialize the WiFi module
  Serial.println(" > WiFi");
  hasWifi = false;
  InitWifi();
  if (!hasWifi)
  {
    return;
  }
  
  randomSeed(analogRead(0));

  timeClient.begin();

  Serial.println(" > IoT Hub");
  Esp32MQTTClient_SetOption(OPTION_MINI_SOLUTION_NAME, "GetStarted");
  Esp32MQTTClient_Init((const uint8_t*)connectionString, true);

  Esp32MQTTClient_SetSendConfirmationCallback(SendConfirmationCallback);
  Esp32MQTTClient_SetMessageCallback(MessageCallback);
  Esp32MQTTClient_SetDeviceTwinCallback(DeviceTwinCallback);
  Esp32MQTTClient_SetDeviceMethodCallback(DeviceMethodCallback);

  send_interval_ms = millis();
}

void loop()
{
  if (hasWifi)
  {
    if (messageSending)
    {
      if ( (int)(millis() - send_interval_ms) >= INTERVAL || sendLedOnEvent || sendLedOffEvent)
      {
        char messagePayload[MESSAGE_MAX_LEN];

        if(!sendLedOnEvent && !sendLedOffEvent)
        {
          send_interval_ms = millis();
        }

        // Obtiene fecha y hora

        while(!timeClient.update()) {
          timeClient.forceUpdate();
        }
        char* dayTime = (char *)malloc(50);
        String formattedDate = timeClient.getFormattedDate();
        formattedDate.toCharArray(dayTime, 50);

        if(sendLedOnEvent)
        {
          sendLedOnEvent = false;
          snprintf(messagePayload,MESSAGE_MAX_LEN, messageEvent, dayTime, "Led encendido");
          Serial.println(messagePayload);
          EVENT_INSTANCE* message = Esp32MQTTClient_Event_Generate(messagePayload, MESSAGE);
          Esp32MQTTClient_Event_AddProp(message, "id", MONGO_ID);
          Esp32MQTTClient_Event_AddProp(message, "DeviceType", DEVICE_TYPE);
          Esp32MQTTClient_Event_AddProp(message, "MessageType", "Event");
          Esp32MQTTClient_SendEventInstance(message);
          return;
        }

        if(sendLedOffEvent)
        {
          sendLedOffEvent = false;
          snprintf(messagePayload,MESSAGE_MAX_LEN, messageEvent, dayTime, "Led apagado");
          Serial.println(messagePayload);
          EVENT_INSTANCE* message = Esp32MQTTClient_Event_Generate(messagePayload, MESSAGE);
          Esp32MQTTClient_Event_AddProp(message, "id", MONGO_ID);
          Esp32MQTTClient_Event_AddProp(message, "DeviceType", DEVICE_TYPE);
          Esp32MQTTClient_Event_AddProp(message, "MessageType", "Event");
          Esp32MQTTClient_SendEventInstance(message);
          return;
        }

        // Send teperature data
        float temperature = (float)random(5,35);//dht.readTemperature();
        float humidity = (float)random(100, 900)/10; //dht.readHumidity();
        snprintf(messagePayload,MESSAGE_MAX_LEN, messageData, dayTime, temperature,humidity);
        Serial.println(messagePayload);
        EVENT_INSTANCE* message = Esp32MQTTClient_Event_Generate(messagePayload, MESSAGE);
        Esp32MQTTClient_Event_AddProp(message, "id", MONGO_ID);
        Esp32MQTTClient_Event_AddProp(message, "DeviceType", DEVICE_TYPE);
        Esp32MQTTClient_Event_AddProp(message, "MessageType", "Data");
        Esp32MQTTClient_SendEventInstance(message);
      }
      else
      {
        Esp32MQTTClient_Check();
      }
    }
  }
  delay(10);
}