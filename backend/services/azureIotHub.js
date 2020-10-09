const crypto = require('crypto');
const { EventHubConsumerClient } = require("@azure/event-hubs");

var Registry = require('azure-iothub').Registry;
var Client = require('azure-iothub').Client;

const { Levels, Logger } = require('../services/loggerService');

const { DataTempHum, EventTempHum } = require('../models/sensorTempHumModel')

// Cadena de conexion al IoT Hub
var iotHubConnectionString = "HostName=" + process.env.IOT_HUB_HOST + ";" +
                             "SharedAccessKeyName=" + process.env.IOT_HUB_SHARED_ACCESS_KEY_NAME + ";" +
                             "SharedAccessKey=" + process.env.IOT_HUB_SHARED_ACCESS_KEY;

let registry = Registry.fromConnectionString("HostName=MonitoringHub.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=aOFsWnGlHYPBUyO+J4QJtrq7zXITgnxlHuOewLiyTpU=");                           
let consumer = new EventHubConsumerClient(process.env.IOT_HUB_EVENT_CONSUMER_GROUP, process.env.IOT_HUB_EVENT_ENDPOINT);
let client = Client.fromConnectionString(iotHubConnectionString);

exports.Suscribe = () => {
    consumer.subscribe({
        processEvents: processMessages,
        processError: printError,
    });
    Logger.Save(Levels.Trace, 'EventHub',`Start listening on ${process.env.IOT_HUB_HOST}`);
};

// Procesa los eventos recibidos
var processMessages = function (messages) {
    for (const message of messages) {
      
        // Eventos de Telemetria
        if(message.systemProperties['iothub-message-source'] == "Telemetry")
        {
            Logger.Save(Levels.Info, 'IotHub', `Telemetria recibida -> Sensor ${message.properties.DeviceType} (${message.systemProperties['iothub-connection-device-id']}) ${message.properties.MessageType}`);

            // Datos
            if(message.properties.MessageType == "Data")
            {
                if(message.properties.DeviceType== "SensorTempHum")
                {
                    let data;
                    try {
                        data = new DataTempHum();
                        data.Timestamp = message.body.Timestamp;
                        data.Temperature = message.body.Temperature;
                        data.Humidity = message.body.Humidity;
                        data.SensorId = message.properties.id;
                        data.save();
                        Logger.Save(Levels.Info, 'Database', `Telemetry data from ${data.SensorId} stored in ${DataTempHum.collection.collectionName}`);
                        return;
                    }
                    catch (error) {
                        Logger.Save(Levels.Error, 'Database', `Error stroning telemetry data from ${data.SensorId} in ${DataTempHum.collection.collectionName} -> ${error.message}`);
                        return;
                    }
                }
            }
            // Eventos
            if(message.properties.MessageType == "Event")
            {
                if(message.properties.DeviceType== "SensorTempHum")
                {
                    let event;
                    try {
                        event = new EventTempHum();
                        event.Timestamp = message.body.Timestamp;
                        event.Message = message.body.Event;
                        event.SensorId = message.properties.id;
                        event.save();
                        Logger.Save(Levels.Info, 'Database', `Telemetry event from ${event.SensorId} stored in ${EventTempHum.collection.collectionName}`);
                        return;
                    }
                    catch (error) {
                        Logger.Save(Levels.Error, 'Database', `Error stroning telemetry event from ${event.SensorId} in ${EventTempHum.collection.collectionName} -> ${error.message}`);
                        return;
                    }
                }
            }
        }
    }
};

var printError = function (error) {
    Logger.Save(Levels.Error, 'IotHub', `Error -> ${error.message}`);
    return;
};

exports.CreateDevice = async (deviceId, type, id, configuration, tags, isEdge, primaryKey) => {

    // Genera las claves
    let primary;
    const hmac1 = crypto.createHmac('sha256', process.env.AZURE_SECRET1).update(deviceId).digest('base64');
    const hmac2 = crypto.createHmac('sha256', process.env.AZURE_SECRET2).update(deviceId).digest('base64');
   if(primaryKey) {
       primary = primaryKey;
   } else {
       primary = hmac1;
   }

    // Arma la estructura del dispositivo
    var deviceInfo = {
        deviceId: deviceId,
        status: 'enabled',
        capabilities: { iotEdge: isEdge },
        authentication: {
            symmetricKey: {
              primaryKey: primary,
              secondaryKey: hmac2
            },
        }
    };

    // Crea el dispositivo
    let device = (await registry.create(deviceInfo)).responseBody;

    // Obtiene el gemelo
    let twin = (await registry.getTwin(deviceId)).responseBody;

    // Actualiza el gemelo
    let twinPatch = {
        tags,
        properties: {
            desired: {
                id,
                type,
                configuration
            }
        }
    };
    await twin.update(twinPatch);

    // Devuelve la cadena de conexion
    return 'HostName=' + process.env.IOT_HUB_HOST + ';' + 
           'DeviceId=' + device.deviceId + ';' +
           'SharedAccessKey=' + device.authentication.symmetricKey.primaryKey;
};

exports.DeleteDevice = async (deviceId) => {
    
    const result = await registry.delete(deviceId);
    return result;

};

exports.GetDevice = async (deviceId) => {
    
    const result = await registry.get(deviceId);
    return result.responseBody;

}