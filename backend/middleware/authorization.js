const jwt = require('jsonwebtoken');
const { User } = require('../models/userModel');
const ErrorResponse = require('../utils/errorResponse');
const { Levels, Logger } = require('../services/loggerService');

// Protege las rutas
exports.Authenticate = async (req, res, next) => {
    let token;
    // Obtiene el token del header
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } 
//    else if(req.cookies.token) {
//        token = req.cookies.token;
//    }
    try {
        // Error si no se recibio token
        if(!token) {
            Logger.Save(Levels.Warning, 'Api', `${req.method} (${req.originalUrl}) | Authentication failed -> No token`);
            return next(new ErrorResponse('Authentication failed', 401));
        }
        // Verifica el token (Lanza error si falla)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Obtiene el usuario con el id del token y lo agrega a req
        req.user = await User.findById(decoded.id);
        if(!req.user) {
            Logger.Save(Levels.Warning, 'Api', `${req.method} (${req.originalUrl}) | Authentication failed -> Wrong id in token`);
            return next(new ErrorResponse('Authentication failed', 401));
        }
        next()
    }
    catch (error) {
        Logger.Save(Levels.Warning, 'Api', `${req.method} (${req.originalUrl}) | Authentication failed -> ${error.message}`);
        return next(new ErrorResponse('Authentication failed', 401));
    }
}

exports.Authorize = (...roles) => {
    // Verifica el rol del usuario respcto a una lista de roles
    return (req, res, next) => {
        if(!roles.includes(req.user.Role)) {
            Logger.Save(Levels.Warning, 'Api', `${req.method} (${req.originalUrl}) | Authorization failed`, req.user._id);
            return next(new ErrorResponse('Authorization failed', 403));
        }
        return next();
    }
}
/*
exports.CheckClientId = async (...roles) => {
    // Verifica que el usuario tenga asignado un ClientId valido
    return (req, res, next) => {
        if(!roles.includes(req.user.Role)) {
            if(req.user.CientId == null)
                return next(new ErrorResponse('Authorization failed', 403));
        }
        return next();
    }
}*/


