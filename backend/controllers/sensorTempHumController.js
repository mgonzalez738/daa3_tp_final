const validationHandler = require('../validations/validationHandler');
const { SensorTempHum, DataTempHum, EventTempHum } = require('../models/sensorTempHumModel');
const ErrorResponse = require('../utils/errorResponse');
const { Levels, Logger } = require('../services/loggerService');
const mongoose = require('mongoose');
const iotHub = require('../services/azureIotHub');
const { Client } = require('../models/clientModel');

const sensorCollectionName = SensorTempHum.collection.collectionName;
const dataCollectionName = DataTempHum.collection.collectionName;
const eventCollectionName = EventTempHum.collection.collectionName;

exports.storeSensor = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Store new sensor to ${sensorCollectionName}`;  
    try { 
        validationHandler(req);
    }
    catch (error) {
        logMessage += ' -> Validation Error';
        Logger.Save(Levels.Warning, 'Api', logMessage, req.user._id); 
        return next(new ErrorResponse(error.message, error.statusCode, error.validation));
    }
    Logger.Save(Levels.Debug, 'Api', logMessage, req.user._id); 
    
    // Procesa el pedido
    try {
        const { Name, Location, Configuration, ProjectId } = req.body;
        const { ClientId } = req.user;
        if(!ClientId) {
            Logger.Save(Levels.Error, 'Database', `Error storing sensor -> ClientId undefined`, req.user._id);
            return next(new ErrorResponse('ClientId undefined', 400));
        }
        // Obtiene la informacion del cliente
        let client = await Client.findById(ClientId);
        // Crea el dispositivo en el hub
        let connectionString = await iotHub.CreateDevice(client.Tag + '-' + Name, false);
        // Guarda el dispositivo en la base de datos
        let sensor = await SensorTempHum.create({ Name, Location, Configuration, ProjectId, ClientId });
        Logger.Save(Levels.Info, 'Database', `Sensor ${sensor._id} stored in ${sensorCollectionName}`, req.user._id);
        res.send({Success: true, Data: { _id: sensor._id } });

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error storing sensor to ${sensorCollectionName} -> ${error.message}`, req.user._id);
        return next(error);
    }
};

exports.deleteSensor = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Delete sensor ${req.params.sensorId} from ${sensorCollectionName}`;  
    try { 
        validationHandler(req);
    }
    catch (error) {
        logMessage += ' -> Validation Error';
        Logger.Save(Levels.Warning, 'Api', logMessage, req.user._id); 
        return next(new ErrorResponse(error.message, error.statusCode, error.validation));
    }
    Logger.Save(Levels.Debug, 'Api', logMessage, req.user._id); 
    
    // Procesa el pedido
    try {
        const { ClientId } = req.user;
        if(!ClientId) {
            Logger.Save(Levels.Error, 'Database', `Error deleting sensor -> ClientId undefined`, req.user._id);
            return next(new ErrorResponse('ClientId undefined', 400));
        }        
        // Obtiene la informacion del sensor
        let sensor = await SensorTempHum.findById(req.params.sensorId);
        if(!sensor) {
            Logger.Save(Levels.Info, 'Database', `Sensor ${req.params.sensorId} not found in ${sensorCollectionName}`, req.user._id);
            return next(new ErrorResponse('Sensor not found', 404));
        }
        if(ClientId.toString() !== sensor.ClientId.toString()) {
            Logger.Save(Levels.Error, 'Database', `Error deleting sensor -> User and sensor ClientIds differ`, req.user._id);
            return next(new ErrorResponse('User and sensor ClientIds differ', 400));
        }
        // Obtiene la informacion del cliente
        let client = await Client.findById(ClientId);
        // Elimina el dispositivo del hub
        await iotHub.DeleteDevice(client.Tag + '-' + sensor.Name);
        // Borra el sensor de la base de datos
        await sensor.remove();
        // Respuesta
        Logger.Save(Levels.Info, 'Database', `Sensor ${req.params.sensorId} deleted from ${sensorCollectionName}`, req.user._id);
        res.send( {Success: true, Data: {} });

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error deleting sensor ${req.params.sensorId} from ${sensorCollectionName} -> ${error.message}`, req.user._id);
        return next(error);   
    }
};

