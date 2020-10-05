const { body, param, query, oneOf, check } = require('express-validator');

// PARAMS

exports.paramGatewayIdIsMongoId = param("gwId")
    .isMongoId()
    .withMessage("Parameter 'Gateway Id' must be a valid hex-encoded representation of a MongoDB ObjectId");

exports.paramSensorIdIsMongoId = param("sensorId")
    .isMongoId()
    .withMessage("Parameter 'sensorId' must be a valid hex-encoded representation of a MongoDB ObjectId");

exports.paramDataIdIsMongoId = param("dataId")
    .isMongoId()
    .withMessage("Parameter 'dataId' must be a valid hex-encoded representation of a MongoDB ObjectId");

exports.paramUserIdIsMongoId = param("userId")
    .isMongoId()
    .withMessage("Parameter 'userId' must be a valid hex-encoded representation of a MongoDB ObjectId");

exports.paramCompanyIdIsMongoId = param("companyId")
    .isMongoId()
    .withMessage("Parameter 'companyId' must be a valid hex-encoded representation of a MongoDB ObjectId");

exports.paramClientIdIsMongoId = param("clientId")
    .isMongoId()
    .withMessage("Parameter 'clientId' must be a valid hex-encoded representation of a MongoDB ObjectId");

exports.paramProjectIdIsMongoId = param("projectId")
    .isMongoId()
    .withMessage("Parameter 'projectId' must be a valid hex-encoded representation of a MongoDB ObjectId");

exports.paramLogIdIsMongoId = param("logId")
    .isMongoId()
    .withMessage("Parameter 'logId' must be a valid hex-encoded representation of a MongoDB ObjectId");


// QUERIES

exports.queryClientIdIsMongoId = query("clientid")
    .optional().isMongoId()
    .withMessage("Query 'clientid' must be a valid hex-encoded representation of a MongoDB ObjectId");

exports.queryFromDateIsISO8601 = query("fromDate")
    .optional().isISO8601({ strict: true })
    .withMessage("Query parameter 'fromDate' must be a valid ISO 8601 datetime");

exports.queryToDateIsISO8601 = query("toDate")
    .optional().isISO8601({ strict: true })
    .withMessage("Query parameter 'toDate' must be a valid ISO 8601 datetime");

exports.querySkipIsInt = query("skip")
    .optional().isInt({ min: 0 }).toInt()
    .withMessage("Query parameter 'skip' must be an integer value greater than or equal to zero");

exports.queryLimitIsInt = query("limit")
    .optional().isInt({ min: 1 }).toInt()
    .withMessage("Query parameter 'limit' must be an integer value greater than zero");

exports.querySortCustom = query("sort")
    .custom((value, { req })  => {
        if(value !== undefined) {
            if((Number(value) === 1) || (Number(value) === -1))
                    return true;
                else 
                    throw new Error("Query parameter 'sort' must be a 1 or -1 value");
        } else {
            return true;
        }
    });

exports.queryPopulateIsBoolean = query("populate")
    .optional().isBoolean().toBoolean()
    .withMessage("Query parameter 'populate' must be a boolean value");

// BODY

exports.bodyClientIdOptionalNull = oneOf([
    body("ClientId").optional().custom((value) => {
        if(value === null) 
            return true; 
    }),
    body("ClientId").optional().isMongoId()
], "Body key 'ClientId' must be a valid hex-encoded representation of a MongoDB ObjectId");

exports.bodyNameRequired = body("Name")
    .notEmpty()
    .withMessage("Body key 'Name' must be present and unique");

exports.bodyTagRequired = body("Tag")
    .notEmpty()
    .withMessage("Body key 'Tag' must be present and unique");

exports.bodyClientIdOptional = body("ClientId")
    .optional().isMongoId()
    .withMessage("Body key 'ClientId' must be a valid hex-encoded representation of a MongoDB ObjectId");





    
exports.bodyIsAggregationStageArray = body()
    .custom((value, { req })  => {
       if(Object.keys(req.body).length !== 0)
            if (req.body.constructor != [].constructor) 
                throw new Error("Body must contain an array of Mongo aggregation stages");
            else
                return true;
        else
            return true;
    });

exports.bodyUtcTimeIsISO8601 = body("UtcTime")
    .isISO8601({ strict: true })
    .withMessage("Body 'UtcTime' must be a valid ISO 8601 datetime");

exports.bodyPowerVoltageIsFloat = body("PowerVoltage")
    .optional().isFloat({ min: 0, max: 50 })
    .withMessage("Body 'PowerVoltage' must be a Float between 0 and 50");

exports.bodySensedVoltageIsFloat = body("SensedVoltage")
    .optional().isFloat({ min: 0, max: 50 })
    .withMessage("Body 'SensedVoltage' must be a Float between 0 and 50");

exports.bodyBatteryVoltageIsFloat = body("BatteryVoltage")
    .optional().isFloat({ min: 0, max: 5 })
    .withMessage("Body 'BatteryVoltage' must be a Float between 0 and 5");

exports.bodyTemperatureIsFloat = body("Temperature")
    .optional().isFloat({ min: -10, max: 60 })
    .withMessage("Body 'Temperature' must be a Float between -10 and 60");