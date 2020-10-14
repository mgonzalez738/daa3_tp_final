const validationHandler = require('../validations/validationHandler');
const { Client } = require('../models/clientModel');
const ErrorResponse = require('../utils/errorResponse');
const { Levels, Logger } = require('../services/loggerService');

const collectionName = Client.collection.collectionName;

exports.indexClient = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Retrieve clients from ${collectionName}`;  
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
        // Filtra por Name si esta definido
        if(req.query.name) {
            AggregationArray.push({ $match : { Name: req.query.name }});
        }
        // Filtra por Tag si esta definido
        if(req.query.tag) {
            AggregationArray.push({ $match : { Tag: req.query.tag }});
        }
        // Ordena por Name
        AggregationArray.push({ $sort : { Name: 1 }});
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
            let result = await Client.aggregate(AggregationArray);
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
            Logger.Save(Levels.Info, 'Database', `${response.Data.length} clients retrieved from ${collectionName}`, req.user._id);
            res.send(response);     
        }
        else
        {
            // Sin paginacion
            let result = await Client.aggregate(AggregationArray);
            Logger.Save(Levels.Info, 'Database', `${result.length} clients retrieved from ${collectionName}`, req.user._id);
            res.send({ Success: true, Data: result });
        }

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error retrieving clients from ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);
    }
};

exports.showClient = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Retrieve client ${req.params.clientId} from ${collectionName}`;  
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
        let client;
        if(!req.query.populate) {
            client = await Client.findById(req.params.clientId);
        } else {
            client = await Client.findById(req.params.clientId)
                .populate('Users') 
                .populate('Companies');
        }
        if(!client) {
            Logger.Save(Levels.Info, 'Database', `Client ${req.params.clientId} not found in ${collectionName}`, req.user._id);
            return next(new ErrorResponse('Client not found', 404));
        }
        // Respuesta
        Logger.Save(Levels.Info, 'Database', `Client ${req.params.clientId} retrieved from ${collectionName}`, req.user._id);
        res.send( {Success: true, Data: client});

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error retrieving client ${req.params.clientId} from ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);   
    }
};

exports.storeClient = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Store new client to ${collectionName}`;  
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
        const { Name, Tag } = req.body;
        let client = await Client.create({ Name, Tag });
        Logger.Save(Levels.Info, 'Database', `Client ${client._id} stored in ${collectionName}`, req.user._id);
        res.send({Success: true, Data: { _id: client._id } });

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error storing client to ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);
    }
};

exports.deleteClient = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Delete client ${req.params.clientId} from ${collectionName}`;  
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
        const client = await Client.findById(req.params.clientId);
        if(!client) {
            Logger.Save(Levels.Info, 'Database', `Client ${req.params.clientId} not found in ${collectionName}`, req.user._id);
            return next(new ErrorResponse('Client not found', 404));
        }
        // Borra
        await client.remove();
        // Respuesta
        Logger.Save(Levels.Info, 'Database', `Client ${req.params.clientId} deleted from ${collectionName}`, req.user._id);
        res.send( {Success: true, Data: {}});

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error deleting client ${req.params.clientId} from ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);   
    }
};

exports.updateClient = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Update client ${req.params.clientId} from ${collectionName}`;  
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
        const { Name, Tag } = req.body;
        const client = await Client.findById(req.params.clientId);
        if(!client) {
            Logger.Save(Levels.Info, 'Database', `Client ${req.params.clientId} not found in ${collectionName}`, req.user._id);
            return next(new ErrorResponse('Client not found', 404));
        }
        if(Name) 
            client.Name = Name;
        if(Tag) 
            client.Tag = Tag;
        await client.save();
        Logger.Save(Levels.Info, 'Database', `Client ${req.params.clientId} updated in ${collectionName}`, req.user._id);
        res.send( {Success: true, Data: { _id: client._id } });

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error updating client ${req.params.userId} in ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);   
    }
};