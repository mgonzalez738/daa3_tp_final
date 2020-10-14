const validationHandler = require('../validations/validationHandler');
const { Project } = require('../models/projectModel');
const ErrorResponse = require('../utils/errorResponse');
const { Levels, Logger } = require('../services/loggerService');
const mongoose = require('mongoose');

const collectionName = Project.collection.collectionName;

exports.indexProject = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Retrieve projects from ${collectionName}`;  
    try { 
        validationHandler(req);
    }
    catch (error) {
        logMessage += ' -> Validation Error';
        Logger.Save(Levels.Warning, 'Api', logMessage, req.user._id); 
        return next(new ErrorResponse(error.message, error.statusCode, error.validation));
    }
    Logger.Save(Levels.Debug, 'Api', logMessage, req.user._id); 
    
    // Verifica que si no es super no filtre por ClientId
    if((req.user.Role !=='super') && req.query.clientid) {
        Logger.Save(Levels.Error, 'Database', `User ${req.user._id} can not filter by Client Id`, req.user._id);
        return next(new ErrorResponse('Filter by Client Id is not allowed for this user', 403));
    }

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
            AggregationArray.push({ $match : { _id: { $in: req.user.ProjectsId } }});
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
            let result = await Project.aggregate(AggregationArray);
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
            Logger.Save(Levels.Info, 'Database', `${response.Data.length} projects retrieved from ${collectionName}`, req.user._id);
            res.send(response);     
        }
        else
        {
            // Sin paginacion
            let result = await Project.aggregate(AggregationArray);
            Logger.Save(Levels.Info, 'Database', `${result.length} projects retrieved from ${collectionName}`, req.user._id);
            res.send({ Success: true, Data: result });
        }

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error retrieving projects from ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);
    }
};

exports.showProject = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Retrieve project ${req.params.projectId} from ${collectionName}`;  
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
        // Verifica que si es user o guest pertenezca al proyecto
        if((req.user.Role !=='super') && (req.user.Role !=='administrator')) {
            if(!req.user.ProjectsId.includes(req.params.projectId)) {
                Logger.Save(Levels.Error, 'Database', `User ${req.user._id} can not get this project info`, req.user._id);
                return next(new ErrorResponse('Authorization failed', 403));
            }
        } 
        // Busqueda
        let project;
        if(req.user.Role ==='super') { // Oculta ClientId sino es super
            project = await Project.findById(req.params.projectId)
        }
        else {
            project = await Project.findById(req.params.projectId).select('-ClientId');
        }
        if(req.query.populate) {
            if(req.user.Role ==='super') { // Populate Client si es super
                await project.populate('Client').execPopulate();
            }
            if((req.user.Role ==='super') || (req.user.Role ==='administrator')) { // Populate Users si es super o administrator
                await project.populate('Users').execPopulate();
            }
        }
        if(!project) {
            Logger.Save(Levels.Info, 'Database', `Project ${req.params.projectId} not found in ${collectionName}`, req.user._id);
            return next(new ErrorResponse('Project not found', 404));
        }
        // Respuesta
        Logger.Save(Levels.Info, 'Database', `Project ${req.params.projectId} retrieved from ${collectionName}`, req.user._id);
        res.send( {Success: true, Data: project});
    
    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error retrieving project ${req.params.projectId} from ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);   
    }
};

exports.storeProject = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Store new project to ${collectionName}`;  
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
        const { Name } = req.body;
        const { ClientId } = req.user;
        if(!ClientId) {
            Logger.Save(Levels.Error, 'Database', `Error storing project -> ClientId undefined`, req.user._id);
            return next(new ErrorResponse('ClientId undefined', 400));
        }
        let project = await Project.create({ Name, ClientId });
        Logger.Save(Levels.Info, 'Database', `Project ${project._id} stored in ${collectionName}`, req.user._id);
        res.send({Success: true, Data: { _id: project._id } });

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error storing project to ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);
    }
};

exports.deleteProject = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Delete project ${req.params.projectId} from ${collectionName}`;  
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
        let project = await Project.findById(req.params.projectId);
        if(!project) {
            Logger.Save(Levels.Info, 'Database', `Project ${req.params.projectId} not found in ${collectionName}`, req.user._id);
            return next(new ErrorResponse('Project not found', 404));
        }
        // Borra
        await project.remove();
        // Respuesta
        Logger.Save(Levels.Info, 'Database', `Project ${req.params.projectId} deleted from ${collectionName}`, req.user._id);
        res.send( {Success: true, Data: {} });

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error deleting project ${req.params.projectId} from ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);   
    }
};

exports.updateProject = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Update project ${req.params.projectId} from ${collectionName}`;  
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
        let project = await Project.findById(req.params.projectId);
        if(!project) {
            Logger.Save(Levels.Info, 'Database', `Project ${req.params.projectId} not found in ${collectionName}`, req.user._id);
            return next(new ErrorResponse('Project not found', 404));
        }
        // Actualizacion
        const { Name, UsersId } = req.body;
        if(Name) 
            project.Name = Name;
        if(UsersId) 
            project.UsersId = UsersId;
        await project.save();
        // Respuesta
        Logger.Save(Levels.Info, 'Database', `Project ${req.params.projectId} updated in ${collectionName}`, req.user._id);
        res.send( {Success: true, Data: { _id: project._id } });

    // Error inesperado
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error updating project ${req.params.userId} in ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);   
    }
};