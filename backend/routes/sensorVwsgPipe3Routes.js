const express = require('express');
const router = express.Router();

const { Authorize } = require('../middleware/authorization');

const {paramSensorIdIsMongoId, paramDataIdIsMongoId} = require('../validations/commonValidators');
const {queryFromDateIsISO8601, queryToDateIsISO8601, querySkipIsInt, queryLimitIsInt, querySortCustom } = require('../validations/commonValidators');
const {bodyConfigurationCustom, bodyNameRequired} = require('../validations/sensorVwsgPipe3Validators');

const SensorController = require('../controllers/sensorVwsgPipe3Controller');

// GETS

// Un dato de un sensor
router.get('/:sensorId/data/:dataId',
    [ 
        Authorize('super', 'administrator', 'user', 'guest'),
        paramSensorIdIsMongoId, paramDataIdIsMongoId 
    ], 
    SensorController.showData
);

// Todos los datos de un sensor
router.get('/:sensorId/data',
    [ 
        Authorize('super', 'administrator', 'user', 'guest'),
        paramSensorIdIsMongoId, 
        queryFromDateIsISO8601, queryToDateIsISO8601, 
        querySkipIsInt, queryLimitIsInt, querySortCustom 
    ], 
    SensorController.indexData
);

// Un sensor
router.get('/:sensorId',
    [ 
        Authorize('super', 'administrator', 'user', 'guest'),
        paramSensorIdIsMongoId 
    ],
    SensorController.showSensor
);

// Todos los sensores
router.get('/',
    [
        Authorize('super', 'administrator', 'user', 'guest'),
        querySkipIsInt, queryLimitIsInt, querySortCustom
    ],
    SensorController.indexSensor
);

// POSTS

// Un sensor
router.post('/',
    [ 
        Authorize('super', 'administrator'),
        bodyNameRequired, bodyConfigurationCustom 
    ],
    SensorController.storeSensor
);

// Un dato de un sensor
router.post('/:sensorId/data/',
    [ 
        Authorize('super', 'administrator', 'user'),
        paramSensorIdIsMongoId 
    ], // Date required, validar data
    SensorController.storeData
);

// PUTS

// Un sensor
router.put('/:sensorId',
    [ 
        Authorize('super', 'administrator'),
        paramSensorIdIsMongoId 
    ],
    SensorController.updateSensor
);

// Un dato de un sensor
router.put('/:sensorId/data/:dataId',
    [ 
        Authorize('super', 'administrator', 'user'),
        paramSensorIdIsMongoId, paramDataIdIsMongoId 
    ],
    SensorController.updateSensor
);

// DELETES

// Un sensor
router.delete('/:sensorId',
    [ 
        Authorize('super', 'administrator'),
        paramSensorIdIsMongoId 
    ],
    SensorController.deleteSensor
);

/// Un dato de un sensor
router.delete('/:sensorId/data/:dataId',
    [ 
        Authorize('super', 'administrator', 'user'),
        paramSensorIdIsMongoId, paramDataIdIsMongoId 
    ],
    SensorController.deleteSensor
);

module.exports = router;