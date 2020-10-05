const { EventHubConsumerClient } = require("@azure/event-hubs");
const gatewayDataController = require('../controllers/gatewayDataController');
var mongoose = require('mongoose');

const dayTime = require('../services/daytime')

const { Levels, Logger } = require('../services/loggerService');

const consumerClient = new EventHubConsumerClient(process.env.IOT_HUB_EVENT_CONSUMER_GROUP, process.env.IOT_HUB_EVENT_ENDPOINT);
const iotHubName = process.env.IOT_HUB_HOST.slice(0, process.env.IOT_HUB_HOST.indexOf("."));

// Procesa los eventos recibidos
var processMessages = function (messages) {
    for (const message of messages) {
      
      // Eventos de Telemetria
      if(message.systemProperties['iothub-message-source'] == "Telemetry")
      {
        var logMessage = "\x1b[33mEventHubEndpoint(" + iotHubName + "): Telemetria";
        logMessage = logMessage + " | " + message.properties.DeviceType + "(" + message.systemProperties['iothub-connection-device-id'] + ")"; 

        // Datos
        if(message.properties.MessageType == "Data")
        {
          // Guarda en Db 
          //var id = saveDataToDb(message);
          saveDataToDb(message);
          // Log
          logMessage = logMessage + " | Data(" + message.body.UtcTime + ") \x1b[0m";
          console.log(logMessage);
        }

        // Eventos
        if(message.properties.MessageType == "Event")
        {
          // Log
          logMessage = logMessage + " | " + message.properties.DeviceType + " (" + message.systemProperties['iothub-connection-device-id'] + ") | Event \x1b[0m";
          console.log(logMessage);
          // Guarda en Db 
          saveEventToDb(message);
          
        }
      }

      // Actualizacion Propiedades
      if(message.systemProperties['iothub-message-source'] == "twinChangeEvents")
      {
        // Filtro modulos hub y edge
        if((message.properties['moduleId'] != '$edgeAgent') && (message.properties['moduleId'] != '$edgeHub'))
        {       
          // Reportadas
          if(message.body.properties['reported'] != undefined)
          {
            // Log
            var logMessage = "\x1b[33mEventHubEndpoint(" + process.env.IOT_HUB_HOST + "): Actualización Propiedades Reportadas";          
            logMessage = logMessage + " | (" + message.systemProperties['iothub-connection-device-id'] + ").\x1b[0m";
            console.log(logMessage);
          }
        }
      }
    }
  };

  // Guarda el mensaje de datos en dB
  var saveDataToDb = function (msg) {
    switch( msg.properties.DeviceType) {
      case "Gateway":
        gatewayDataController.saveData(msg.systemProperties['iothub-connection-device-id'], msg.body);
        break;
    }
    //return id;
  }

  var saveEventToDb = function (msg) {
    switch( msg.properties.DeviceType) {
      case "Gateway":
        //gatewayDataController.saveData(msg.systemProperties['iothub-connection-device-id'], msg.body);
        break;
    }
  }

  var printError = function (err) {
    var logMessage = "\x1b[33mEventHubEndpoint(" + iotHubName + "): Error -> " + err.message + "\x1b[0m";
    console.log(logMessage);
  };

exports.suscribe = () => {
    consumerClient.subscribe({
        processEvents: processMessages,
        processError: printError,
    });
    Logger.Save(Levels.Trace, 'EventHub',`Start listening on ${iotHubName}`);
}