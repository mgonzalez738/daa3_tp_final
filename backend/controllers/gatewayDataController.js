const GatewayData = require("../models/gatewayDataModel");
const validationHandler = require('../validations/validationHandler');
var mongoose = require('mongoose');

exports.indexAllGw = async (req, res, next) => {

    var logMessage = "\x1b[34mApi: " + req.method + "(" + req.originalUrl + ") | Retrieve All Gateways Data\x1b[0m";

    // Validacion

    try {
        validationHandler(req);
    }
    catch (err) {
        next(err);
        console.log(logMessage + "\x1b[31m -> " + err.message + "\x1b[0m");
        return;
    }

    // Procesamiento

    try 
    { 
        // Verifica si hay parametros en la url

        var filterFromEnabled = false;
        if(req.query.from !== undefined)
        {
            filterFromEnabled = true;
            var fromDateTime = new Date(req.query.from);
            var fromDate = new Date((req.query.from).split('T')[0])       
        }

        var filterToEnabled = false;
        if(req.query.to !== undefined)
        {
            filterToEnabled = true;
            var toDateTime = new Date(req.query.to);
            var toDate = new Date((req.query.to).split('T')[0])       
        }

        // Verifica si hay un array de queries adicionales (aggregate) en body
        var queriesEnabled = false;
        if(Object.keys(req.body).length !== 0)
            queriesEnabled = true;
        
        logMessage = logMessage + "\x1b[0m";
        console.log(logMessage);
        
        // Arma el Aggregate

        // Primer Match (Antes de Unwind y Project)
        var firstMatch = { $match : { $and: [ ] } };
        // Parametro consulta "from"
        if(filterFromEnabled)
            firstMatch.$match.$and.push({DocDate: {$gte: fromDate }});
        // Parametro consulta "to"
        if(filterToEnabled)
            firstMatch.$match.$and.push({DocDate: {$lte: toDate }});

        // Segundo Match (Despues de Unwind y Project)
        var secondMatch = { $match : { $and: [ ] } };
        // Parametro consulta "from"
        if(filterFromEnabled)
            secondMatch.$match.$and.push({UtcTime: {$gte: fromDateTime }});
        // Parametro consulta "to"
        if(filterToEnabled)
            secondMatch.$match.$and.push({UtcTime: {$lte: toDateTime }});

        if(filterFromEnabled || filterToEnabled) {
            var aggregation = [firstMatch];  
            aggregation.push({ $unwind : { path: "$Data" } });
        } else {
            var aggregation = [{ $unwind : { path: "$Data" } }];
        }            
        aggregation.push({ $unwind : { path: "$Data" } });
        aggregation.push({ 
            $project : { 
                _id: "$Data._id",
                _gatewayId: 1,
                UtcTime: "$Data.UtcTime", 
                PowerVoltage : "$Data.PowerVoltage",
                SensedVoltage: "$Data.SensedVoltage",
                BatteryVoltage: "$Data.BatteryVoltage",
                Temperature: "$Data.Temperature" 
            } 
        });
        if(filterFromEnabled || filterToEnabled)
            aggregation.push( secondMatch );
        if(queriesEnabled)
            req.body.forEach(function(item,index,arr) {
                aggregation.push( item );
            });
        aggregation.push( { $sort : { UtcTime: - 1 } } );

        const gatewayData = await GatewayData.aggregate(aggregation);

        if(!gatewayData.length)
        {
            var msg = "No data found";
            next({
                statusCode: 404,
                message: msg
            });
            console.log("\x1b[35mDatabase: Gateway(All) | No data retrieved \x1b[0m");
        } else {
            console.log("\x1b[35mDatabase: Gateway(All) | Data retrieved (" + gatewayData.length + " records)\x1b[0m");
            res.send(gatewayData);
        }
    } catch (err) {
        next(err);
        console.log("\x1b[35mDatabase: Gateway(All) | \x1b[31mError retrieving data \x1b[35m -> " + err.message + "\x1b[0m");
    }
};

exports.indexOneGw = async (req, res, next) => {

    var logMessage = "\x1b[34mApi: " + req.method + "(" + req.originalUrl + ") | Retrieve Gateway Data\x1b[0m";

    // Validacion

    try {
        validationHandler(req);
    }
    catch (err) {
        next(err);
        console.log(logMessage + "\x1b[31m -> " + err.message + "\x1b[0m");
        return;
    }

    // Procesamiento

    try 
    {
        var gwId = req.params.gwId;       

        // Verifica si hay parametros en la url

        var filterFromEnabled = false;
        if(req.query.from !== undefined)
        {
            filterFromEnabled = true;
            var fromDateTime = new Date(req.query.from);
            var fromDate = new Date((req.query.from).split('T')[0])       
        }

        var filterToEnabled = false;
        if(req.query.to !== undefined)
        {
            filterToEnabled = true;
            var toDateTime = new Date(req.query.to);
            var toDate = new Date((req.query.to).split('T')[0])       
        }

        // Verifica si hay un array de queries adicionales (aggregate) en body
        var queriesEnabled = false;
        if(Object.keys(req.body).length !== 0)
            queriesEnabled = true;
        
        logMessage = logMessage + "\x1b[0m";
        console.log(logMessage);
        
        // Arma el Aggregate

        // Primer Match (Antes de Unwind y Project): Filtra por gateway
        var firstMatch = { $match : { $and: [ { _gatewayId: new mongoose.Types.ObjectId(gwId) } ] } };
        // Parametro consulta "from"
        if(filterFromEnabled)
            firstMatch.$match.$and.push({DocDate: {$gte: fromDate }});
        // Parametro consulta "to"
        if(filterToEnabled)
            firstMatch.$match.$and.push({DocDate: {$lte: toDate }});

        // Segundo Match (Despues de Unwind y Project)
        var secondMatch = { $match : { $and: [ ] } };
        // Parametro consulta "from"
        if(filterFromEnabled)
            secondMatch.$match.$and.push({UtcTime: {$gte: fromDateTime }});
        // Parametro consulta "to"
        if(filterToEnabled)
            secondMatch.$match.$and.push({UtcTime: {$lte: toDateTime }});

        var aggregation = [firstMatch];       
        aggregation.push({ $unwind : { path: "$Data" } });
        aggregation.push({ 
            $project : { 
                _id: "$Data._id",
                UtcTime: "$Data.UtcTime", 
                PowerVoltage : "$Data.PowerVoltage",
                SensedVoltage: "$Data.SensedVoltage",
                BatteryVoltage: "$Data.BatteryVoltage",
                Temperature: "$Data.Temperature" 
            } 
        });
        if(filterFromEnabled || filterToEnabled)
            aggregation.push( secondMatch );
        if(queriesEnabled)
            req.body.forEach(function(item,index,arr) {
                aggregation.push( item );
            });
        aggregation.push( { $sort : { UtcTime: - 1 } } );

        const gatewayData = await GatewayData.aggregate(aggregation);

        if(!gatewayData.length)
        {
            var msg = "No data found";
            next({
                statusCode: 404,
                message: msg
            });
            console.log("\x1b[35mDatabase: Gateway(" + gwId + ") | No data retrieved \x1b[0m");
        } else {
            console.log("\x1b[35mDatabase: Gateway(" + gwId + ") | Data retrieved (" + gatewayData.length + " records)\x1b[0m");
            res.send(gatewayData);
        }
    } catch (err) {
        next(err);
        console.log("\x1b[35mDatabase: Gateway(" + gwId + ") | \x1b[31mError retrieving data \x1b[35m -> " + err.message + "\x1b[0m");
    }
};

exports.show = async (req, res, next) => {

    var logMessage = "\x1b[34mApi: " + req.method + "(" + req.originalUrl + ") | Retrieve Gateway Data\x1b[0m";

    // Validacion

    try {
        validationHandler(req);
    }
    catch (err) {
        next(err);
        console.log(logMessage + "\x1b[31m -> " + err.message + "\x1b[0m");
        return;
    }

    // Procesamiento

    try {
        var gwId = req.params.gwId;
        var dataId = req.params.dataId;

        logMessage = logMessage + "\x1b[0m";
        console.log(logMessage);

        var aggregation = [{ $match : { _gatewayId: new mongoose.Types.ObjectId(gwId) } }];       
        aggregation.push({ $unwind : { path: "$Data" } });
        aggregation.push({ 
            $project : {
                _id: "$Data._id",
                UtcTime: "$Data.UtcTime", 
                PowerVoltage : "$Data.PowerVoltage",
                SensedVoltage: "$Data.SensedVoltage",
                BatteryVoltage: "$Data.BatteryVoltage",
                Temperature: "$Data.Temperature" 
            } 
        });
        aggregation.push({ $match : { _id: new mongoose.Types.ObjectId(dataId) } });
        
        const gatewayData = await GatewayData.aggregate(aggregation);

        if(!gatewayData.length)
        {
            var msg = "No data found";
            next({
                statusCode: 404,
                message: msg
            });
            console.log("\x1b[35mDatabase: Gateway(" + gwId + ") | No data retrieved \x1b[0m");
        } else {
            console.log("\x1b[35mDatabase: Gateway(" + gwId + ") | Data retrieved (1 records) \x1b[0m");
            res.send(gatewayData);
        }
    } catch (err) {
        next(err);
        console.log("\x1b[35mDatabase: Gateway(" + gwId + ") | \x1b[31mError retrieving data \x1b[35m -> " + err.message + "\x1b[0m");
    }
};

exports.store = async (req, res, next) => {

    var logMessage = "\x1b[34mApi: " + req.method + "(" + req.originalUrl + ") | | Add Gateway Data\x1b[0m";

    // Validacion

    try {
        validationHandler(req);
    }
    catch (err) {
        next(err);
        console.log(logMessage + "\x1b[31m -> " + err.message + "\x1b[0m");
        return;
    }

    // Procesamiento

    try {
        //validationHandler(req);  
        var dataId = mongoose.Types.ObjectId().toHexString();
        var gwId = req.params.gwId;
        var data = req.body;

        logMessage = logMessage + "\x1b[0m";
        console.log(logMessage);

        var result = await GatewayData.updateOne({
             // Filtro
            _gatewayId: gwId,
            DocDate: new Date((data.UtcTime).split('T')[0])
        },{
            //Update: Agrega elemento al array
            $push: { Data: data }
        },{
            // Si no existe el documento lo crea
            upsert: true
        });
        if(result.upserted) {
            console.log("\x1b[35mDatabase: Gateway(" + gwId + ") | Data Added (Upserted)\x1b[0m"); 
            res.send({message: "Data added (Userted)"});
        } else {
            console.log("\x1b[35mDatabase: Gateway(" + gwId + ") | Data Added\x1b[0m");
            res.send({message: "Data added"});
        }
    } catch (err) {
            console.log("\x1b[35mDatabase: Gateway(" + gwId + ") | \x1b[31mError adding data\x1b[35m -> " + err.message + "\x1b[0m");
            next(err);
    }
};

exports.destroy = async (req, res, next) => {
    
    var logMessage = "\x1b[34mApi: " + req.method + "(" + req.originalUrl + ") | Delete Gateway Data\x1b[0m";

    // Validacion

    try {
        validationHandler(req);
    }
    catch (err) {
        next(err);
        console.log(logMessage + "\x1b[31m -> " + err.message + "\x1b[0m");
        return;
    }

    // Procesamiento

    try {
        var gwId = req.params.gwId;
        var dataId = req.params.dataId;

        logMessage = logMessage + "\x1b[0m";
        console.log(logMessage);
       
        result = await GatewayData.updateOne(   
            { "_gatewayId": new mongoose.Types.ObjectId(gwId) },
            { $pull : { Data : {"_id": new mongoose.Types.ObjectId(dataId)} } }
        );
        if(result.nModified == 0)
        {
            var msg = "No data found";
            next({
                statusCode: 404,
                message: msg
            });
            console.log("\x1b[35mDatabase: Gateway(" + gwId + ") | \x1b[31mError deleting data \x1b[35m -> " + msg + "\x1b[0m");
        } else {
            console.log("\x1b[35mDatabase: Gateway(" + gwId + ") | Data deleted \x1b[0m");
            res.send({message: "Data deleted"});
        }
    } catch (err) {
        next(err);
        console.log("\x1b[35mDatabase: Gateway(" + gwId + ") | \x1b[31mError deleting data \x1b[35m -> " + err.message + "\x1b[0m");
    }
};

exports.update = async (req, res, next) => {

    var logMessage = "\x1b[34mApi: " + req.method + "(" + req.originalUrl + ") | Update Gateway Data\x1b[0m";

    // Validacion

    try {
        validationHandler(req);
    }
    catch (err) {
        next(err);
        console.log(logMessage + "\x1b[31m -> " + err.message + "\x1b[0m");
        return;
    }

    // Procesamiento

    try {

        var gwId = req.params.gwId;
        var dataId = req.params.dataId;
        var data = req.body;

        logMessage = logMessage + "\x1b[0m";
        console.log(logMessage);

        data["_id"] = dataId; // Evita que genere un nuevo id al reemplazar los datos

        result = await GatewayData.updateOne(
            { 
                "_gatewayId": new mongoose.Types.ObjectId(gwId),
                "Data._id": new mongoose.Types.ObjectId(dataId)
            },
            { $set : {  "Data.$": data }}
        );

        if(result.nModified == 0)
        {
            var msg = "No data updated";
            next({
                statusCode: 404,
                message: msg
            });
            console.log("\x1b[35mDatabase: Gateway(" + gwId + ") | \x1b[31mError updating data \x1b[35m -> " + msg + "\x1b[0m");
        } else {
            console.log("\x1b[35mDatabase: Gateway(" + gwId + ") | Data updated \x1b[0m");
            res.send({message: "Data updated"});
        }
    } catch (err) {
        next(err);
        console.log("\x1b[35mDatabase: Gateway(" + gwId + ") | \x1b[31mError updating data \x1b[35m -> " + err.message + "\x1b[0m");
    }
};

exports.saveData = async (gwId, data) => {    
    try {
        var result = await GatewayData.updateOne({
             // Filtro
            _gatewayId: gwId,
            DocDate: new Date((data.UtcTime).split('T')[0])
        },{
            //Update: Agrega elemento al array
            $push: { Data: data }
        },{
            // Si no existe el documento lo crea
            upsert: true
        });
        if(result.upserted)
            console.log("\x1b[35mDatabase: Gateway(" + gwId + ") | Data(" + data.UtcTime + ") Added (Upserted)\x1b[0m"); 
        else
            console.log("\x1b[35mDatabase: Gateway(" + gwId + ") | Data(" + data.UtcTime + ") Added\x1b[0m");
    } catch (err) {
            console.log("\x1b[35mDatabase: Gateway(" + gwId + ") | \x1b[31mError adding Data(" + data.UtcTime + ") \x1b[35m -> " + err.message + "\x1b[0m");
    }
};

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
};


