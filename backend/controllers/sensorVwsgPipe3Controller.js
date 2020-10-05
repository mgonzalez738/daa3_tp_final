var mongoose = require('mongoose');

const dayTime = require('../services/daytime');
const validationHandler = require('../validations/validationHandler');
const VwsgPipe3 = require('../models/sensorVwsgPipe3Model');
const iotHub = require('../services/azureIotHub');
const { ConnectionType } = require('../configs/types');

const iotHubName = process.env.IOT_HUB_HOST.slice(0, process.env.IOT_HUB_HOST.indexOf("."));

// API SENSOR

exports.indexSensor = async (req, res, next) => {
    
    var collectionName = VwsgPipe3.Sensor.collection.collectionName; 
    var logMessage = dayTime.getUtcString() + `\x1b[34mApi: ${req.method} (${req.originalUrl}) | Retrieve documents from ${collectionName}`;    
    try { // Validacion
        validationHandler(req);
    }
    catch (err) {
        next(err);
        console.log(logMessage + "\x1b[31m -> " + err.message + "\x1b[0m");
        return;
    }
    console.log(logMessage + '\x1b[0m');   
    
    try {
        // Etapa comun: Match Filtra por Tag si esta definido
        var stageCommon = { $match : { $and: [ ] }};
        if(req.query.name !== undefined)
            stageCommon.$match.$and.push({ Name: req.query.name});
        else
            stageCommon.$match.$and.push({ });
        // Facet 1: Ordena por Name y aplica skip y limit si estan definidos
        var facet1Array = [ ];
        if(req.query.sort !== undefined)
            facet1Array.push({ $sort : { Name: parseInt(req.query.sort) }});
        else
            facet1Array.push({ $sort : { Name: 1 }}); // Asscendente por defecto
        if(req.query.skip !== undefined)
            facet1Array.push({ $skip : parseInt(req.query.skip) });
        if(req.query.limit !== undefined) {
            facet1Array.push({ $limit : parseInt(req.query.limit) });
        }
        // Facet 2: Count
        var facet2Array = [{ $count: "Total" }];
        // Ejecuta la Query
        AggregationArray = [ stageCommon, { $facet: { Items: facet1Array, Count: facet2Array }}, { $project: { Items: 1, 'Info.Total': '$Count.Total'}}, { $unwind: '$Info.Total'}];
        var result = await VwsgPipe3.Sensor.aggregate(AggregationArray);
        // Completa la respuesta con informacion de paginacion
        var response = {};
        response.Items = {};
        response.Info = {};
        response.Info.From = null;
        response.Info.To = null;
        if(result.length == 0) { // No hubo respuesta
            response.Items = [];   
            response.Info.Retrieved = 0;
            response.Info.Total = 0;
        } else {
            response.Items =  result[0].Items;
            if(result[0].Items.length) {
                response.Info.From = (req.query.skip !== undefined) ? Number(req.query.skip) + 1 : 1;
                response.Info.To = (req.query.limit !== undefined) ? response.Info.From + Number(req.query.limit) - 1 : result[0].Info.Total;
                if((response.Info.To !== null) && (response.Info.To > result[0].Info.Total))
                    response.Info.To = result[0].Info.Total;
            }
            response.Info.Retrieved = result[0].Items.length;
            response.Info.Total = result[0].Info.Total;
        }      
        // Envia la respuesta
        console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Retrieved ${response.Info.Retrieved} documents\x1b[0m`);   
        res.send(response);
    } catch (error) {
        next(error);
        console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Error retrieving documents -> ${error.message }\x1b[0m`); 
    }
};

exports.showSensor = async (req, res, next) => {

    var collectionName = VwsgPipe3.Sensor.collection.collectionName; 
    var logMessage = dayTime.getUtcString() + `\x1b[34mApi: ${req.method} (${req.originalUrl}) | Retrieve document from ${collectionName}`;  
    try { // Validacion
        validationHandler(req);
    }
    catch (err) {
        next(err);
        console.log(logMessage + "\x1b[31m -> " + err.message + "\x1b[0m");
        return;
    }
    console.log(logMessage + '\x1b[0m');
   
    try {
        // Obtiene el documento
        var result = await VwsgPipe3.Sensor.find( { _id: new mongoose.Types.ObjectId(req.params.sensorId) } );
        // Envia la respuesta
        console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Retrieved ${result.length} document\x1b[0m`);   
        res.send((result.length > 0) ? result[0] : {});
    } catch (error) {
        next(error);
        console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Error retrieving document -> ${error.message }\x1b[0m`); 
    }
};

exports.storeSensor = async (req, res, next) => {
    
    var collectionName = VwsgPipe3.Sensor.collection.collectionName;
    var logMessage = dayTime.getUtcString() + `\x1b[34mApi: ${req.method} (${req.originalUrl}) | Store document to ${collectionName}`;  
    try { // Validacion
        validationHandler(req);
    }
    catch (err) {
        next(err);
        console.log(logMessage + "\x1b[31m -> " + err.message + "\x1b[0m");
        return;
    }
    console.log(logMessage + '\x1b[0m');   

    req.body._id = new mongoose.Types.ObjectId(req.body._id);

    // Si es un sensor Azure lo crea en el IotHub
    if(req.body.ConnectionType == ConnectionType.Azure)
    {
        try {
            var connectionString = await iotHub.CreateDevice(req.body.Name, false);
            req.body.Device = {};
            console.log(connectionString);
            req.body.Device.ConnectionString = connectionString;
            console.log(dayTime.getUtcString() + `\x1b[33mAzureIot: ${iotHubName} | Device ${req.body.Name} created\x1b[0m`); 
        }
        catch (error) {
            next(error);
            console.log(dayTime.getUtcString() + `\x1b[33mAzureIot: ${iotHubName} | Error creating device ${req.body.Name} -> ${error.message}\x1b[0m`); 
            console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Document storing omitted\x1b[0m`); 
            return;
        }
    }   

    try {
        let sensor = await VwsgPipe3.Sensor.create(req.body);
        console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Stored 1 document\x1b[0m`);   
        res.send(sensor);
    } catch (error) {
        // Si era azure borrarlo porque fallo al incluirlo en la base de datos
        console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Error storing document -> ${error.message }\x1b[0m`); 
        if(req.body.ConnectionType == ConnectionType.Azure) {
            await iotHub.DeleteDevice(req.body.Name);
            console.log(dayTime.getUtcString() + `\x1b[33mAzureIot: ${iotHubName} | Device ${req.body.Name} deleted\x1b[0m`);
        }
        next(error);
        return;
    }
};

exports.updateSensor = async (req, res, next) => {
    
    var collectionName = VwsgPipe3.Sensor.collection.collectionName;
    var logMessage = dayTime.getUtcString() + `\x1b[34mApi: ${req.method} (${req.originalUrl}) | Update document from ${collectionName}`;  
    try { // Validacion
        validationHandler(req);
    }
    catch (err) {
        next(err);
        console.log(logMessage + "\x1b[31m -> " + err.message + "\x1b[0m");
        return;
    }
    console.log(logMessage + '\x1b[0m');   

    try {
        let result = await VwsgPipe3.Sensor.updateOne({ _id: req.params.sensorId }, { $set: req.body } );
        if(result.n === 0) {
            console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Error updating document -> Not found\x1b[0m`);   
            const error = new Error( `Sensor _id: ${req.params.sensorId} not found`);
            error.statusCode = 404;
            next(error);
        } else if ( result.nModified === 0) {
            console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Error updating document -> Found but not updated\x1b[0m`);   
            const error = new Error( `Sensor _id: ${req.params.sensorId} found but not updated`);
            error.statusCode = 400;
            next(error);
        }
        else {
            console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Updated 1 document\x1b[0m`); 
            res.send({message: `Sensor _id: ${req.params.sensorId} updated`});
        }
    } catch (error) {
        next(error);
        console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Error storing document -> ${error.message }\x1b[0m`); 
    }
};

exports.deleteSensor = async (req, res, next) => {
    
    var collectionName = VwsgPipe3.Sensor.collection.collectionName;
    var logMessage = dayTime.getUtcString() + `\x1b[34mApi: ${req.method} (${req.originalUrl}) | Delete document from ${collectionName}`; 
    try { // Validacion
        validationHandler(req);
    }
    catch (err) {
        next(err);
        console.log(logMessage + "\x1b[31m -> " + err.message + "\x1b[0m");
        return;
    }
    console.log(logMessage + '\x1b[0m');   
    
    try {

        // Ubica el sensor en la base de datos
        let sensor = await VwsgPipe3.Sensor.findOne({ _id: req.params.sensorId });
        if(sensor == null) {
            console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Error deleting document -> Not found\x1b[0m`);   
            const error = new Error( `Sensor _id: ${req.params.sensorId} not found`);
            error.statusCode = 404;
            next(error);
            return;
        } 
        // Si es un sensor Azure lo elimina en el IotHub
        if(sensor.ConnectionType == ConnectionType.Azure)
        {
            try {
                await iotHub.DeleteDevice(sensor.Name);
                console.log(dayTime.getUtcString() + `\x1b[33mAzureIot: ${iotHubName} | Device ${sensor.Name} deleted\x1b[0m`); 
            }
            catch (error) {
                next(error);
                console.log(dayTime.getUtcString() + `\x1b[33mAzureIot: ${iotHubName} | Error deleting device ${sensor.Name} -> ${error.message}\x1b[0m`); 
                console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Document deletion omitted\x1b[0m`); 
                return;
            }
        }   
        // Borra el sensor de la base de datos
        await sensor.delete();
        console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Deleted 1 document\x1b[0m`); 
        res.send({message: `Sensor _id: ${req.params.sensorId} deleted`});
    } catch (error) {
        next(error);
        console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Error deleting document -> ${error.message }\x1b[0m`); 
        return;
    }

    
};

// API DATA

exports.indexData = async (req, res, next) => {
    
    var collectionName = VwsgPipe3.Data.collection.collectionName; 
    var logMessage = dayTime.getUtcString() + `\x1b[34mApi: ${req.method} (${req.originalUrl}) | Retrieve documents from ${collectionName}`;
    try { // Validacion
        validationHandler(req);
    }
    catch (err) {
        next(err);
        console.log(logMessage + "\x1b[31m -> " + err.message + "\x1b[0m");
        return;
    }
    console.log(logMessage + '\x1b[0m');

    try {
        // Etapa comun: Match Filtra por SensorId y fechas si estan definidas
        var stageCommon = { $match : { $and: [ ] }};
        stageCommon.$match.$and.push({ SensorId: new mongoose.Types.ObjectId(req.params.sensorId) });
        if(req.query.fromDate !== undefined)
            stageCommon.$match.$and.push({ Date: { $gte: new Date(req.query.fromDate) }});
        if(req.query.toDate !== undefined)
            stageCommon.$match.$and.push({ Date: { $lt: new Date(req.query.toDate) }});
        // Facet 1: Project filtra valores devueltos, ordena y aplica skip y limit si estan definidos
        var facet1Array = [{ $project: {SensorId: 0, __v: 0} }];
        if(req.query.sort !== undefined)
            facet1Array.push({ $sort : { Date: parseInt(req.query.sort) }});
        else
            facet1Array.push({ $sort : { Date: -1 }}); // Descendente por defecto
        if(req.query.skip !== undefined)
            facet1Array.push({ $skip : parseInt(req.query.skip) });
        if(req.query.limit !== undefined) {
            facet1Array.push({ $limit : parseInt(req.query.limit) });
        }
        // Facet 2: Count
        var facet2Array = [{ $count: "Total" }];
        // Ejecuta la Query
        AggregationArray = [ stageCommon, { $facet: { Items: facet1Array, Count: facet2Array }}, { $project: { Items: 1, 'Info.Total': '$Count.Total'}}, { $unwind: '$Info.Total'}];
        const result = await VwsgPipe3.Data.aggregate(AggregationArray);
        // Completa la respuesta con datos calculados e informacion de paginacion
        var response = {};
        response.Items = {};
        response.Info = {};
        response.Info.From = null;
        response.Info.To = null;
        if(result.length == 0) { // No hubo respuesta
            response.Items = [];   
            response.Info.Retrieved = 0;
            response.Info.Total = 0;
        } else {
            response.Items =  await VwsgPipe3.AddCalculatedData(req.params.sensorId, result[0].Items);     
            if(result[0].Items.length) {
                response.Info.From = (req.query.skip !== undefined) ? Number(req.query.skip) + 1 : 1;
                response.Info.To = (req.query.limit !== undefined) ? response.Info.From + Number(req.query.limit) - 1 : result[0].Info.Total;
                if((response.Info.To !== null) && (response.Info.To > result[0].Info.Total))
                    response.Info.To = result[0].Info.Total;
            }
            response.Info.Retrieved = result[0].Items.length;
            response.Info.Total = result[0].Info.Total;
        }          
        // Envia la respuesta
        console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Retrieved ${response.Info.Retrieved} documents\x1b[0m`);   
        res.send(response);
    }
    catch (error)
    {
        next(error);
        console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Error retrieving documents -> ${error.message }\x1b[0m`); 
    }
}

exports.showData = async (req, res, next) => {

    var collectionName = VwsgPipe3.Data.collection.collectionName;
    var logMessage = dayTime.getUtcString() + `\x1b[34mApi: ${req.method} (${req.originalUrl}) | Retrieve document from ${collectionName}`; 
    try { // Validacion
        validationHandler(req);
    }
    catch (err) {
        next(err);
        console.log(logMessage + "\x1b[31m -> " + err.message + "\x1b[0m");
        return;
    }
    console.log(logMessage + '\x1b[0m');
   
    try {
        // Obtiene el documento
        var result = await VwsgPipe3.Data.find( {_id: req.params.dataId}, {SensorId: 0, __v: 0} ).lean();
        // Envia la respuesta
        result =  await VwsgPipe3.AddCalculatedData(req.params.sensorId, result);     
        console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Retrieved ${result.length} document\x1b[0m`);   
        res.send((result.length > 0) ? result[0] : {});
    } catch (error) {
        next(error);
        console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Error retrieving document -> ${error.message }\x1b[0m`); 
    }
};

exports.storeData = async (req, res, next) => {
    
    var collectionName = VwsgPipe3.Data.collection.collectionName;
    var logMessage = dayTime.getUtcString() + `\x1b[34mApi: ${req.method} (${req.originalUrl}) | Store document to ${collectionName}`;  
    try { // Validacion
        validationHandler(req);
    }
    catch (err) {
        next(err);
        console.log(logMessage + "\x1b[31m -> " + err.message + "\x1b[0m");
        return;
    }
    console.log(logMessage + '\x1b[0m');   

    try {
        req.body._id = new mongoose.Types.ObjectId(req.body._id);
        let data = await VwsgPipe3.Data.create(req.body);
        console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Stored 1 document\x1b[0m`);   
        res.send(data);
    } catch (error) {
        next(error);
        console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Error storing document -> ${error.message }\x1b[0m`); 
    }
};

exports.updateData = async (req, res, next) => {
    
    var collectionName = VwsgPipe3.Data.collection.collectionName;
    var logMessage = dayTime.getUtcString() + `\x1b[34mApi: ${req.method} (${req.originalUrl}) | Update document from ${collectionName}`;  
    try { // Validacion
        validationHandler(req);
    }
    catch (err) {
        next(err);
        console.log(logMessage + "\x1b[31m -> " + err.message + "\x1b[0m");
        return;
    }
    console.log(logMessage + '\x1b[0m');   

    try {
        let result = await VwsgPipe3.Data.updateOne({ _id: req.params.dataId }, { $set: req.body } );
        if(result.n === 0) {
            console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Error updating document -> Not found\x1b[0m`);   
            const error = new Error( `Data _id: ${req.params.dataId} not found`);
            error.statusCode = 404;
            next(error);
        } else if ( result.nModified === 0) {
            console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Error updating document -> Found but not updated\x1b[0m`);   
            const error = new Error( `Sensor _id: ${req.params.dataId} found but not updated`);
            error.statusCode = 400;
            next(error);
        }
        else {
            console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Updated 1 document\x1b[0m`); 
            res.send({message: `Sensor _id: ${req.params.dataId} updated`});
        }
    } catch (error) {
        next(error);
        console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Error storing document -> ${error.message }\x1b[0m`); 
    }
};

exports.deleteData = async (req, res, next) => {
    
    var collectionName = VwsgPipe3.Data.collection.collectionName;
    var logMessage = dayTime.getUtcString() + `\x1b[34mApi: ${req.method} (${req.originalUrl}) | Delete document from ${collectionName}`; 
    try { // Validacion
        validationHandler(req);
    }
    catch (err) {
        next(err);
        console.log(logMessage + "\x1b[31m -> " + err.message + "\x1b[0m");
        return;
    }
    console.log(logMessage + '\x1b[0m');   

    try {
        let data = await VwsgPipe3.Data.findOne({ _id: req.params.dataId });
        if(data == null) {
            console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Error deleting document -> Not found\x1b[0m`);   
            const error = new Error( `Sensor _id: ${req.params.dataId} not found`);
            error.statusCode = 404;
            next(error);
        } else { 
            await data.delete();
            console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Deleted 1 document\x1b[0m`); 
            res.send({message: `Sensor _id: ${req.params.dataId} deleted`});
        }       
    } catch (error) {
        next(error);
        console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${collectionName} | Error deleting document -> ${error.message }\x1b[0m`); 
    }
};



