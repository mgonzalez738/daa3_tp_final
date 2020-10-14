const { ConnectionType } = require('../configs/types')
const { body, check} = require('express-validator');

exports.bodyNameRequired = body("Name")
    .notEmpty().withMessage("Body key 'Name' must be present and unique in collection");

exports.bodyConfigurationCustom = body("Configurations")
    .custom((value, { req })  => {
        // Valida que Configuration sea un array y contenga al menos una configuracion
        if(value == null) {
            throw new Error("Device definition must contain a configurations array");
        } 
        if (value.constructor != [].constructor) {
            throw new Error("Configuration must be an array of valid configurations");
        }
        if (value.length == 0) {
            throw new Error("Configuration must have at least one valid configuration element");
        }

        // Verifica que todas las configuraciones sean de un tipo valido
        for(i=0; i < value.length; i++) {
            if ( value[i].ConnectionType != ConnectionType.Campbell && value[i].ConnectionType != ConnectionType.Azure) 
            {
                throw new Error("Every Configuration element must have defined ConnectionType as 'Campbell' or 'Azure'");
            }
        }

        // Valida los elementos comunes de cada configuracion
        check("value.*.user_id").not().isEmpty();

        return true;
    });

