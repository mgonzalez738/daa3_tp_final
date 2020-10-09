const mongoose = require('mongoose');

const validationHandler = require('../validations/validationHandler');
const ErrorResponse = require('../utils/errorResponse');

const { SensorTempHum, DataTempHum, EventTempHum } = require('../models/sensorTempHumModel');
const { Client } = require('../models/clientModel');
const { Project } = require('../models/projectModel');

const { Levels, Logger } = require('../services/loggerService');
const iotHub = require('../services/azureIotHub');

const sensorCollectionName = SensorTempHum.collection.collectionName;
const dataCollectionName = DataTempHum.collection.collectionName;
const eventCollectionName = EventTempHum.collection.collectionName;

exports.indexSensor = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Retrieve sensors from ${sensorCollectionName}`;  
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
        let AggregationArray = [];
        // Filtra por ClientId de la query si esta definido 
        if(req.query.clientid) {
            AggregationArray.push({ $match : { ClientId: new mongoose.Types.ObjectId(req.query.clientid) }});
        } else {
            AggregationArray.push({ $match : { ClientId: req.user.ClientId }});
        }
        // Filtra por Rol de user y guest
        if((req.user.Role !== 'super') && (req.user.Role !== 'administrator')) {
            AggregationArray.push({ $match : { ProjectId: { $in: req.user.ProjectsId } }});
        }
        // Filtra por Name si esta definido
        if(req.query.name) {
            AggregationArray.push({ $match : { Name: req.query.name }});
        }
        // Ordena por Name
        AggregationArray.push({ $sort : { Name: 1, ClientId: 1}});
         // Oculta campos
         if(req.user.Role !== 'super') {
            AggregationArray.push({ $project : { ClientId:0 }});        
        }   
        // Aplica paginacion si esta definido limit o skip
        if(req.query.skip || req.query.limit)
        {
            // Con paginacion
            let facet1Array = [];
            if(req.query.skip) {
                facet1Array.push({ $skip : parseInt(req.query.skip) });
            }
            if(req.query.limit) {
                facet1Array.push({ $limit : parseInt(req.query.limit) });
            }
            // Facet 2: Count
            let facet2Array = [{ $count: "Total" }];
            // Ejecuta la consulta
            AggregationArray.push({ $facet: { Items: facet1Array, Count: facet2Array }}, { $project: { Items: 1, 'Pagination.Total': '$Count.Total'}}, { $unwind: '$Pagination.Total'});
            let result = await SensorTempHum.aggregate(AggregationArray);
            // Completa la respuesta con informacion de paginacion
            var response = { Success: true, Pagination: { From: null, To: null}, Data: [] };
            if(result.length == 0) { // No hubo respuesta 
                response.Pagination.Retrieved = 0;
                response.Pagination.Total = 0;
            } else {
                response.Data =  result[0].Items;
                if(result[0].Items.length) {
                    response.Pagination.From = (req.query.skip) ? Number(req.query.skip) + 1 : 1;
                    response.Pagination.To = (req.query.limit) ? response.Pagination.From + Number(req.query.limit) - 1 : result[0].Pagination.Total;
                    if((response.Pagination.To) && (response.Pagination.To > result[0].Pagination.Total))
                        response.Pagination.To = result[0].Pagination.Total;
                }
                response.Pagination.Retrieved = result[0].Items.length;
                response.Pagination.Total = result[0].Pagination.Total;
            } 
            Logger.Save(Levels.Info, 'Database', `${response.Data.length} sensors retrieved from ${sensorCollectionName}`, req.user._id);
            res.send(response);     
        }
        else
        {
            // Sin paginacion
            let result = await SensorTempHum.aggregate(AggregationArray);
            Logger.Save(Levels.Info, 'Database', `${result.length} sensors retrieved from ${sensorsCollectionName}`, req.user._id);
            res.send({ Success: true, Data: result });
        }

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error retrieving sensors from ${sensorCollectionName} -> ${error.message}`, req.user._id);
        return next(error);
    }
};

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
        // Datos del pedido
        const { Name, Location, ProjectId, PrimaryKey } = req.body;
        let { Configuration } = req.body;

        // Obtiene la informacion del proyecto
        let project = await Project.findById(ProjectId);
        if(!project) {
            Logger.Save(Levels.Error, 'Database', `Error storing sensor in ${sensorCollectionName} -> Project id ${ProjectId} not found`, req.user._id);
            return next(new ErrorResponse('Project not found', 400));
        }

        // Obtiene la informacion del cliente
        let client = await Client.findById(project.ClientId);
        if(!client) {
            Logger.Save(Levels.Error, 'Database', `Error storing sensor in ${sensorCollectionName} -> Client id ${project.ClientId} not found`, req.user._id);
            return next(new ErrorResponse('Client not found', 400));
        }

        // Crea los datos del dispositivo
        let deviceId = client.Tag + '-' + Name;
        let deviceType = 'SensorTempHum';
        let _id = new mongoose.Types.ObjectId().toHexString();
        let tags = { Location };
         if(!Configuration) {
            Configuration = { PollPeriod: 5 }
        }

        // Crea el dispositivo en el hub
        let ConnectionString = await iotHub.CreateDevice(deviceId, deviceType, _id, Configuration, tags, false, PrimaryKey);

        // Guarda el dispositivo en la base de datos
        let sensor = await SensorTempHum.create({_id, Name, Location, ConnectionString, Configuration, ProjectId: project._id, ClientId: client._id });
        Logger.Save(Levels.Info, 'Database', `Sensor ${sensor._id} stored in ${sensorCollectionName}`, req.user._id);
        res.send({Success: true, Data: { _id: sensor._id } });

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error storing sensor in ${sensorCollectionName} -> ${error.message}`, req.user._id);
        return next(error);
    }
};

exports.deleteSensor = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Delete sensor id ${req.params.sensorId} from ${sensorCollectionName}`;  
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
        // Obtiene la informacion del sensor
        let sensor = await SensorTempHum.findById(req.params.sensorId);
        if(!sensor) {
            Logger.Save(Levels.Warning, 'Database', `Error deleting sensor id ${req.params.sensorId} -> Sensor not found in ${sensorCollectionName}`, req.user._id);
            return next(new ErrorResponse('Sensor not found', 404));
        }

        // Obtiene la informacion del cliente
        let client = await Client.findById(sensor.ClientId);

        // Elimina el dispositivo del hub
        await iotHub.DeleteDevice(client.Tag + '-' + sensor.Name);
        
        // Borra el sensor de la base de datos
        await sensor.remove();

        // Respuesta
        Logger.Save(Levels.Info, 'Database', `Sensor id ${req.params.sensorId} deleted from ${sensorCollectionName}`, req.user._id);
        res.send( {Success: true, Data: {} });

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error deleting sensor ${req.params.sensorId} from ${sensorCollectionName} -> ${error.message}`, req.user._id);
        return next(error);   
    }
};

exports.indexData = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Retrieve data from ${dataCollectionName}`;  
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
        let AggregationArray = [];
        // Filtra por sensorId
        //AggregationArray.push({ $match : { SensorId: req.params.sensorId }});
        // Filtra por From si esta definido
        if(req.query.from !== undefined) {
             AggregationArray.push({ $match : { Timestamp: { $gte: new Date(req.query.from)}}});
        }
        // Filtra por To si esta definido
        if(req.query.to !== undefined) {
            AggregationArray.push({ $match : { Timestamp: { $lt: new Date(req.query.to)}}});
        }
        // Ordena por Sort si esta definido
        if(req.query.sort) {
            AggregationArray.push({ $sort : { Timestamp: parseInt(req.query.sort) }});
        } else {
            AggregationArray.push({ $sort : { Timestamp: -1 }}); // Descendente por defecto
        }
        // Aplica paginacion si esta definido limit o skip
        if(req.query.skip || req.query.limit)
        {
            // Con paginacion
            let facet1Array = [];
            if(req.query.skip) {
                facet1Array.push({ $skip : parseInt(req.query.skip) });
            }
            if(req.query.limit) {
                facet1Array.push({ $limit : parseInt(req.query.limit) });
            }
            // Facet 2: Count
            let facet2Array = [{ $count: "Total" }];
            // Ejecuta la consulta
            AggregationArray.push({ $facet: { Items: facet1Array, Count: facet2Array }}, { $project: { Items: 1, 'Pagination.Total': '$Count.Total'}}, { $unwind: '$Pagination.Total'});
            let result = await DataTempHum.aggregate(AggregationArray);
            // Completa la respuesta con informacion de paginacion
            var response = { Success: true, Pagination: { From: null, To: null}, Data: [] };
            if(result.length == 0) { // No hubo respuesta 
                response.Pagination.Retrieved = 0;
                response.Pagination.Total = 0;
            } else {
                response.Data =  result[0].Items;
                if(result[0].Items.length) {
                    response.Pagination.From = (req.query.skip) ? Number(req.query.skip) + 1 : 1;
                    response.Pagination.To = (req.query.limit) ? response.Pagination.From + Number(req.query.limit) - 1 : result[0].Pagination.Total;
                    if((response.Pagination.To) && (response.Pagination.To > result[0].Pagination.Total))
                        response.Pagination.To = result[0].Pagination.Total;
                }
                response.Pagination.Retrieved = result[0].Items.length;
                response.Pagination.Total = result[0].Pagination.Total;
            } 
            Logger.Save(Levels.Info, 'Database', `${response.Data.length} registers retrieved from ${dataCollectionName}`, req.user._id);
            res.send(response);     
        }
        else
        {
            // Sin paginacion
            let result = await DataTempHum.aggregate(AggregationArray);
            Logger.Save(Levels.Info, 'Database', `${result.length} registers retrieved from ${dataCollectionName}`, req.user._id);
            res.send({ Success: true, Data: result });
        }

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error retrieving data from ${dataCollectionName} -> ${error.message}`, req.user._id);
        return next(error);
    }
};

exports.indexEvent = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Retrieve events from ${eventCollectionName}`;  
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
        let AggregationArray = [];
        // Filtra por sensorId
        AggregationArray.push({ $match : { SensorId: req.params.sensorId }});
        // Filtra por From si esta definido
        if(req.query.from !== undefined) {
             AggregationArray.push({ $match : { Timestamp: { $gte: new Date(req.query.from)}}});
        }
        // Filtra por To si esta definido
        if(req.query.to !== undefined) {
            AggregationArray.push({ $match : { Timestamp: { $lt: new Date(req.query.to)}}});
        }
        // Ordena por Sort si esta definido
        if(req.query.sort) {
            AggregationArray.push({ $sort : { Timestamp: parseInt(req.query.sort) }});
        } else {
            AggregationArray.push({ $sort : { Timestamp: -1 }}); // Descendente por defecto
        }
        // Aplica paginacion si esta definido limit o skip
        if(req.query.skip || req.query.limit)
        {
            // Con paginacion
            let facet1Array = [];
            if(req.query.skip) {
                facet1Array.push({ $skip : parseInt(req.query.skip) });
            }
            if(req.query.limit) {
                facet1Array.push({ $limit : parseInt(req.query.limit) });
            }
            // Facet 2: Count
            let facet2Array = [{ $count: "Total" }];
            // Ejecuta la consulta
            AggregationArray.push({ $facet: { Items: facet1Array, Count: facet2Array }}, { $project: { Items: 1, 'Pagination.Total': '$Count.Total'}}, { $unwind: '$Pagination.Total'});
            let result = await EventTempHum.aggregate(AggregationArray);
            // Completa la respuesta con informacion de paginacion
            var response = { Success: true, Pagination: { From: null, To: null}, Data: [] };
            if(result.length == 0) { // No hubo respuesta 
                response.Pagination.Retrieved = 0;
                response.Pagination.Total = 0;
            } else {
                response.Data =  result[0].Items;
                if(result[0].Items.length) {
                    response.Pagination.From = (req.query.skip) ? Number(req.query.skip) + 1 : 1;
                    response.Pagination.To = (req.query.limit) ? response.Pagination.From + Number(req.query.limit) - 1 : result[0].Pagination.Total;
                    if((response.Pagination.To) && (response.Pagination.To > result[0].Pagination.Total))
                        response.Pagination.To = result[0].Pagination.Total;
                }
                response.Pagination.Retrieved = result[0].Items.length;
                response.Pagination.Total = result[0].Pagination.Total;
            } 
            Logger.Save(Levels.Info, 'Database', `${response.Data.length} events retrieved from ${eventCollectionName}`, req.user._id);
            res.send(response);     
        }
        else
        {
            // Sin paginacion
            let result = await DataTempHum.aggregate(AggregationArray);
            Logger.Save(Levels.Info, 'Database', `${result.length} events retrieved from ${eventCollectionName}`, req.user._id);
            res.send({ Success: true, Data: result });
        }

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error retrieving events from ${eventCollectionName} -> ${error.message}`, req.user._id);
        return next(error);
    }
};

