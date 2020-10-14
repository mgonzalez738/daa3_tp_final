const validationHandler = require('../validations/validationHandler');
const { Log } = require('../models/logModel');
const ErrorResponse = require('../utils/errorResponse');
const { Levels, Logger } = require('../services/loggerService');

const collectionName = Log.collection.collectionName;

exports.indexLog = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Retrieve logs from ${collectionName}`;  
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
        // Filtra por Level si esta definido
        if(req.query.level) {
            AggregationArray.push({ $match : { Level: req.query.level }});
        }
        // Filtra por Process si esta definido
        if(req.query.process) {
            AggregationArray.push({ $match : { Process: req.query.process }});
        }
        // Filtra por UserId si esta definido
        if(req.query.UserId) {
            AggregationArray.push({ $match : { UserId: req.query.userid }});
        }
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
            let result = await Log.aggregate(AggregationArray);
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
            Logger.Save(Levels.Info, 'Database', `${response.Data.length} logs retrieved from ${collectionName}`, req.user._id);
            res.send(response);     
        }
        else
        {
            // Sin paginacion
            let result = await Log.aggregate(AggregationArray);
            Logger.Save(Levels.Info, 'Database', `${result.length} logs retrieved from ${collectionName}`, req.user._id);
            res.send({ Success: true, Data: result });
        }

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error retrieving logs from ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);
    }
};

exports.showLog = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Retrieve log ${req.params.logId} from ${collectionName}`;  
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
        // Busqueda
        let log;
        if(!req.query.populate) {
            log = await Log.findById(req.params.logId);
        } else {
            log = await Log.findById(req.params.logId)
                .populate('User') 
        }
        if(!log) {
            Logger.Save(Levels.Info, 'Database', `Log ${req.params.logId} not found in ${collectionName}`, req.user._id);
            return next(new ErrorResponse('Log not found', 404));
        }
        // Respuesta
        Logger.Save(Levels.Info, 'Database', `Log ${req.params.logId} retrieved from ${collectionName}`, req.user._id);
        res.send( {Success: true, Data: log});

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error retrieving log ${req.params.logId} from ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);   
    }
};

exports.storeLog = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Store new log to ${collectionName}`;  
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
        const { Timestamp, Level, Process, UserId, Ip, Message, Data } = req.body;
        let log = await Log.create({ Timestamp, Level, Process, UserId, Ip, Message, Data });
        Logger.Save(Levels.Info, 'Database', `Log ${log._id} stored in ${collectionName}`, req.user._id);
        res.send({Success: true, Data: { _id: log._id } });

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error storing log to ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);
    }
};

exports.deleteLog = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Delete log ${req.params.logId} from ${collectionName}`;  
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
        // Busqueda
        const log = await Log.findById(req.params.logId);
        if(!log) {
            Logger.Save(Levels.Info, 'Database', `Log ${req.params.logId} not found in ${collectionName}`, req.user._id);
            return next(new ErrorResponse('Log not found', 404));
        }
        // Borra
        await log.remove();
        // Respuesta
        Logger.Save(Levels.Info, 'Database', `Log ${req.params.logId} deleted from ${collectionName}`, req.user._id);
        res.send( {Success: true, Data: {}});

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error deleting log ${req.params.logId} from ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);   
    }
};

exports.updateLog = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Update log ${req.params.logId} from ${collectionName}`;  
    try { 
        validationHandler(req);
    }
    catch (error) {
        logMessage += ' -> Validation Error';
        Logger.Save(Levels.Warning, 'Api', logMessage, req.user._id); 
        return next(new ErrorResponse(error.message, error.statusCode, error.validation));
    }
    Logger.Save(Levels.Debug, 'Api', logMessage, req.user._id);  
    
    // Actualiza el documento 
    try {
        const { Timestamp, Level, Process, UserId, Ip, Message, Data } = req.body;
        const log = await Log.findById(req.params.logId);
        if(!log) {
            Logger.Save(Levels.Info, 'Database', `Log ${req.params.logId} not found in ${collectionName}`, req.user._id);
            return next(new ErrorResponse('Log not found', 404));
        }
        if(Timestamp) 
            log.Timestamp = Timestamp;
        if(Level) 
            log.Level = Level;
        if(Process) 
            log.Process = Process;
        if(UserId) 
            log.UserId = UserId;
        if(Ip) 
            log.Ip = Ip;
        if(Message) 
            log.Message = Message;
        if(Data) 
            log.Data = Data;
        await log.save();
        Logger.Save(Levels.Info, 'Database', `Log ${req.params.logId} updated in ${collectionName}`, req.user._id);
        res.send( {Success: true, Data: { _id: log._id } });

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error updating log ${req.params.userId} in ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);   
    }
};