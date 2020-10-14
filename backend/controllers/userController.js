const crypto = require('crypto');

const { sendEmail } = require('../utils/sendEmail')
const validationHandler = require('../validations/validationHandler');
const { User } = require('../models/userModel');
const { Company } = require('../models/companyModel');
const ErrorResponse = require('../utils/errorResponse');
const { Levels, Logger } = require('../services/loggerService');

const collectionName = User.collection.collectionName;

exports.indexUser = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Retrieve users from ${collectionName}`;  
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
        // Filtra por ClientId del usuario si no es super
        if(req.user.ClientId && (req.user.Role !== 'super')) {
            AggregationArray.push({ $match : { ClientId: req.user.ClientId }});
        } 
        // Filtra usuarios Super
        if(req.user.Role !== 'super' ) {
            AggregationArray.push({ $match : { Role: { $ne: 'super' } }});
        }      
        // Filtra por UserId si esta definido
        if(req.query.userid) {
            AggregationArray.push({ $match : { UserId: req.query.userid }});
        }
        // Filtra por FirstName si esta definido
        if(req.query.firstname) {
            AggregationArray.push({ $match : { FirstName: req.query.firstname }});
        }
        // Filtra por LastName si esta definido
        if(req.query.lastname) {
            AggregationArray.push({ $match : { LastName: req.query.lastname }});
        }
        // Filtra por Email si esta definido
        if(req.query.email) {
            AggregationArray.push({ $match : { Email: req.query.email }});
        }
        // Ordena por LastName FirstName ascendente
        AggregationArray.push({ $sort : { LastName: 1, FirstName: 1 }});
        // Oculta campos
        if(req.user.Role === 'super') {
            AggregationArray.push({ $project : { Password: 0, ResetPasswordToken: 0, ResetPasswordExpire:0 }});        
        } else {
            AggregationArray.push({ $project : { Password: 0, ResetPasswordToken: 0, ResetPasswordExpire:0, ClientId:0 }});
        }
        // Aplica paginacion si esta definido limit o skip
        if(req.query.skip || req.query.limit)
        {
            // Con paginacion
            let facet1Array = [];
            if(req.query.skip) {
                facet1Array.push({ $skip : req.query.skip });
            }
            if(req.query.limit) {
                facet1Array.push({ $limit : req.query.limit });
            }
            // Facet 2: Count
            let facet2Array = [{ $count: "Total" }];
            // Ejecuta la consulta
            AggregationArray.push({ $facet: { Items: facet1Array, Count: facet2Array }}, { $project: { Items: 1, 'Pagination.Total': '$Count.Total'}}, { $unwind: '$Pagination.Total'});
            let result = await User.aggregate(AggregationArray);
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
            Logger.Save(Levels.Info, 'Database', `${response.Data.length} user retrieved from ${collectionName}`, req.user._id);
            res.send(response);     
        }
        else
        {
            // Sin paginacion
            let result = await User.aggregate(AggregationArray);
            Logger.Save(Levels.Info, 'Database', `${result.length} user retrieved from ${collectionName}`, req.user._id);
            res.send({ Success: true, Data: result });
        }

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error retrieving users from ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);
    }
};

exports.showUser = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Retrieve user ${req.params.userId} from ${collectionName}`;  
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
        let user;
        if(!req.query.populate) {
            user = await User.findById(req.params.userId).select((req.user.Role==='super')?'':'-ClientId');
        } else {
            user = await User.findById(req.params.userId).select((req.user.Role==='super')?'':'-ClientId')
                .populate('Company')
                .populate('Client')
                .populate('Projects')
                .populate('Project');
        }
        if(!user) {
            Logger.Save(Levels.Info, 'Database', `User ${req.params.userId} not found in ${collectionName}`, req.user._id);
            return next(new ErrorResponse('User not found', 404));
        }
        if((user.Role ==='super') && (req.user.Role !== 'super'))
        {
            Logger.Save(Levels.Error, 'Database', `User ${req.params.userId} can not get super user`, req.user._id);
            return next(new ErrorResponse('Authorization failed', 403));
        }
        // Respeuesta
        Logger.Save(Levels.Info, 'Database', `User ${req.params.userId} retrieved from ${collectionName}`, req.user._id);
        res.send( {Success: true, Data: user});

    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error retrieving user ${req.params.userId} from ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);   
    }
};

exports.storeUser = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Store new user to ${collectionName}`;  
    try { 
        validationHandler(req);
    }
    catch (error) {
        logMessage += ' -> Validation Error';
        Logger.Save(Levels.Warning, 'Api', logMessage, req.user._id); 
        return next(new ErrorResponse(error.message, error.statusCode, error.validation));
    }
    Logger.Save(Levels.Debug, 'Api', logMessage, req.user._id); 
    
    // Preocesa el pedido
    try {
        // Crea documento
        const { UserId, FirstName, LastName, Email, Password, Role, ProjectsId, CompanyId, ProjectId } = req.body;
        const { ClientId } = req.user;
        if(!ClientId && (Role !== 'super')){
            Logger.Save(Levels.Error, 'Database', `Could not create an user without having a ClientId assigned`, req.user._id);
            return next(new ErrorResponse('Error crating user without ClientId', 400));
        }
        if((Role ==='super') && (req.user.Role !== 'super'))
        {
            Logger.Save(Levels.Error, 'Database', `User ${req.params.userId} can not create super user`, req.user._id);
            return next(new ErrorResponse('Authorization failed', 403));
        }
        if((Role ==='super') && ProjectsId && (ProjectsId.length > 0))
        {
            Logger.Save(Levels.Error, 'Database', `User ${req.params.userId} can not add ProjectsId to super user`, req.user._id);
            return next(new ErrorResponse('Can not add ProjectsId to super user', 400));
        }
        let user = await User.create({ UserId, FirstName, LastName, Email, Password, Role, ProjectsId, CompanyId, ClientId, ProjectId });
        // Respuesta
        Logger.Save(Levels.Info, 'Database', `User ${user._id} stored in ${collectionName}`, req.user._id);
        res.send({Success: true, Data: { _id: user._id }});
    
    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error storing user to ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Delete user ${req.params.userId} from ${collectionName}`;  
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
        let user = await User.findById(req.params.userId);
        if(!user) {
            Logger.Save(Levels.Info, 'Database', `User ${req.params.userId} not found in ${collectionName}`, req.user._id);
            return next(new ErrorResponse('User not found', 404));
        }
        if((user.Role ==='super') && (req.user.Role !== 'super'))
        {
            Logger.Save(Levels.Error, 'Database', `User ${req.params.userId} can not delete super user`, req.user._id);
            return next(new ErrorResponse('Authorization failed', 403));
        }
        // Borra
        await user.remove();
        // Respuesta
        Logger.Save(Levels.Info, 'Database', `User ${req.params.userId} deleted from ${collectionName}`, req.user._id);
        res.send( {Success: true, Data: {}});
   
    // Errores inesperados
    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error deleting user ${req.params.userId} from ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);   
    }
};

exports.updateUser = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Update user ${req.params.userId} from ${collectionName}`;  
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
        let user = await User.findById(req.params.userId);
        if(!user) {
            Logger.Save(Levels.Info, 'Database', `User ${req.params.userId} not found in ${collectionName}`, req.user._id);
            return next(new ErrorResponse('User not found', 404));
        }
        if((user.Role ==='super') && (req.user.Role === 'administrator'))
        {
            Logger.Save(Levels.Error, 'Database', `User ${req.params.userId} can not edit super user`, req.user._id);
            return next(new ErrorResponse('Authorization failed', 403));
        }
        if((user.Role ==='super') && req.body.ProjectsId && (req.body.ProjectsId.length > 0))
        {
            Logger.Save(Levels.Error, 'Database', `User ${req.params.userId} can not add ProjectsId to super user`, req.user._id);
            return next(new ErrorResponse('Can not add ProjectsId to super user', 400));
        }
        if( ((req.user.Role==='user') || (req.user.Role==='guest')) && (!user._id.equals(req.user._id)))
        {
            Logger.Save(Levels.Error, 'Database', `Role ${user.Role} can not update other users`, req.user._id);
            return next(new ErrorResponse(`Role ${user.Role} can not update other users`, 403));
        }
        // Actualizacion
        const { UserId, FirstName, LastName, Email, Password, Role, CompanyId, ProjectsId, ClientId, ProjectId } = req.body; 
        if(UserId)
            user.UserId = UserId;
        if(FirstName) 
            user.FirstName = FirstName;
        if(LastName)
            user.LastName = LastName;
        if(Email)
            user.Email = Email;
        if(Password)
            user.Password = Password;
        if(ProjectId === null) {
            user.ProjectId = undefined;
        } else {
            user.ProjectId = ProjectId;
        }
        if((req.user.Role==='super') || (req.user.Role==='administrator')) {
            if(Role) 
                user.Role = Role;
            if(CompanyId)
                user.CompanyId = CompanyId;
            if(ProjectsId)
                user.ProjectsId = ProjectsId;
            if((ClientId !== undefined) && (req.user.Role === 'super')) {
                if(ClientId === null) {
                    user.ClientId = undefined;
                } else {
                    user.ClientId = ClientId;
                }
            }
        }       
        await user.save();
        // Respuesta
        Logger.Save(Levels.Info, 'Database', `User ${req.params.userId} updated in ${collectionName}`, req.user._id);
        res.send( {Success: true, Data: { _id: user._id }});

    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error updating user ${req.params.userId} in ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);   
    }
};

exports.loginUser = async (req, res, next) => {
    //await generateDefaultUser();
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Login try by user ${req.body.UserId})`;  
    try { 
        validationHandler(req);
    }
    catch (error) {
        logMessage += ' -> Validation Error';
        Logger.Save(Levels.Warning, 'Api', logMessage + " -> " + error.message); 
        return next(new ErrorResponse(error.message, error.statusCode, error.validation));
    }
    Logger.Save(Levels.Debug, 'Api', logMessage, undefined, req.body.Ip);   

    // Verifica los datos de login y devuelve el token
    try {
        const { UserId, Password } = req.body;
        // Verifica email usuario
        const user = await User.findOne({ UserId: UserId }).select('+Password');
        if(!user) {
            Logger.Save(Levels.Warning, 'Database', `User ${req.body.UserId} not found in ${collectionName} (Login)`, undefined, req.body.Ip);
            return next(new ErrorResponse('Invalid credentials', 401));
        }
        // Verifica password
        const isMatch = await user.matchPassword(Password);
        if(!isMatch) {
            Logger.Save(Levels.Warning, 'Database', `Login password for user ${req.body.UserId} did not match`, undefined, req.body.Ip);
            return next(new ErrorResponse('Invalid credentials', 401));
        }
        // Devuelve el token
        Logger.Save(Levels.Info, 'Database', `User ${req.body.UserId} logged in`, undefined, req.body.Ip);
        sendTokenResponse(user, res);

    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Login error -> ${error.message}`, undefined, req.body.Ip);
        return next(new ErrorResponse(error.message));
    }
};

exports.getMe = async (req, res, next) => {
    
    let logMessage = `${req.method} (${req.originalUrl}) | Retrieve user ${req.user._id} from ${collectionName} (Me)`;
    Logger.Save(Levels.Debug, 'Api', logMessage, req.user._id); 
    
    // Obtiene y devuelve los datos del usuario actual
    try {
        // Busqueda
        let user;
        if(!req.query.populate) {
            user = await User.findOne({ _id: req.user._id }).select((req.user.Role==='super')?'+ClientId':'');
        } else {
            user = await User.findOne({ _id: req.user._id }).select((req.user.Role==='super')?'+ClientId':'')
                .populate('Company')
                .populate('Client')
                .populate('Projects')
                .populate('Project');
        }
        if(!user) {
            Logger.Save(Levels.Info, 'Database', `User ${req.user._id} not found in ${collectionName}`, req.user._id);
        }
        Logger.Save(Levels.Info, 'Database', `User ${req.user._id} retrieved from ${collectionName}`, req.user._id);
        res.send( {Success: true, Data: user});

    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error retrieving user ${req.user._id} from ${collectionName} -> ${error.message}`, req.user._id);
        return next(error);   
    }
};

exports.forgotPassword = async (req, res, next) => {

    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | User ${req.body.Email} forgot password`;  
    try { 
        validationHandler(req);
    }
    catch (error) {
        logMessage += ' -> Validation Error';
        Logger.Save(Levels.Warning, 'Api', logMessage + " -> " + error.message, undefined, req.body.Ip); 
        return next(new ErrorResponse(error.message, error.statusCode, error.validation));
    }
    Logger.Save(Levels.Debug, 'Api', logMessage);  

    try {
        // Verifica el id de usuario
        const user = await User.findOne({ UserId: req.body.UserId });
        if(!user) {
            Logger.Save(Levels.Warning, 'Database', `User ${req.body.UserId} not found in ${collectionName} (Forgot password)`, undefined, req.body.Ip);
            return next(new ErrorResponse(`User ${req.body.UserId} not found`, 404));
        }
        // Genera el token
        const resetToken = user.getResetPasswordToken();
        await user.save({validationBeforeSave: false});
        // Envia el email con url y token
        const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/users/resetpassword/${resetToken}`;
        const message = `Make a PUT request to: \n\n ${resetUrl}`
        await sendEmail({
            email: user.Email,
            subject: 'Password Reset Token',
            message
        });
        // Envia respuesta
        Logger.Save(Levels.Info, 'Database', `Reset token saved for user ${user.UserId}. Email sent`, undefined, req.body.Ip);
        res.send( {Success: true, Data: 'Token saved and email sent'});

    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Forgot password error -> ${error.message}`, undefined, req.body.Ip);
        return next(new ErrorResponse(error.message));
    }
}

exports.resetPassword = async (req, res, next) => {
    
    // Valida los datos del pedido
    let logMessage = `${req.method} (${req.originalUrl}) | Reset password by user ${req.body.Email}`;  
    try {
        validationHandler(req);
    }
    catch (error) {
        logMessage += ' -> Validation Error';
        Logger.Save(Levels.Warning, 'Api', logMessage + " -> " + error.message, undefined, req.body.Ip); 
        return next(new ErrorResponse(error.message, error.statusCode, error.validation));
    }
    Logger.Save(Levels.Debug, 'Api', logMessage, undefined, req.body.Ip);
    
    // Verifica el token de reset, cambia el password y devuelve el nuevo login
    try {
        // Hash del token recibido
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');
        // Busca el usuario con el token que no haya expirado
        const user = await User.findOne({ResetPasswordToken: resetPasswordToken, ResetPasswordExpire: {$gt: Date.now()}});
        // Error si no pudo encontrar un usuario
        if(!user) { 
            Logger.Save(Levels.Warning, 'Database', `Invalid token (Reset Password)`, undefined, req.body.Ip);
            return next(new ErrorResponse('Invalid Token', 400));
        }
        // Establece el nuevo password y borra el token
        user.Password = req.body.Password;
        user.ResetPasswordToken = undefined;
        user.ResetPasswordExpire = undefined;
        await user.save();
        // Devuelve el token
        Logger.Save(Levels.Info, 'Database', `User ${user.UserId} password reset`, undefined, req.body.Ip);
        sendTokenResponse(user, res);

    } catch (error) {
        Logger.Save(Levels.Error, 'Database', `Error reseting password for user ${user.UserId} -> ${error.message}`, undefined, req.body.Ip);
        return next(error);   
    }
};

const sendTokenResponse = (user, res) => {
    // Crea el token
    const token = user.getSignedJwtToken();
    // Opciones del cookie
    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };
    if(process.env.NODE_ENV === 'production') {
        options.secure = true;
    }
    // Modifica res con token en cookie y en bodyuser.
    res.cookie('token', token, options).json({ Success: true, Token: token });
};

const generateDefaultUser = async () => {
    let user = await User.create({ 
        UserId: 'mgonzalez738',
        FirstName: 'Martin',
        LastName: 'Gonzalez',
        Email: 'mgonzalez738@gmail.com',
        Password: 'GieGie20',
        Role: 'super' });
}
