const express = require('express');
const router = express.Router();

const SensorTempHumController = require('../controllers/sensorTempHumController');
const { Authorize } = require('../middleware/authorization');
const { querySkipIsInt, queryLimitIsInt, queryProjectIdIsMongoId, queryClientIdIsMongoId } = require('../validations/commonValidators');

// GETS

router.get('/:sensorId/data/last',
    [ 
        Authorize('super', 'administrator', 'user', 'guest'),
        //paramProjectIdIsMongoId, queryPopulateIsBoolean
    ],
    SensorTempHumController.indexDataLast 
);

router.get('/:sensorId/data',
    [ 
        Authorize('super', 'administrator', 'user', 'guest'),
        //paramProjectIdIsMongoId, queryPopulateIsBoolean
    ],
    SensorTempHumController.indexData 
);

router.get('/:sensorId/event/last',
    [ 
        Authorize('super', 'administrator', 'user', 'guest'),
        //paramProjectIdIsMongoId, queryPopulateIsBoolean
    ],
    SensorTempHumController.indexEventLast 
);

router.get('/:sensorId/event',
    [ 
        Authorize('super', 'administrator', 'user', 'guest'),
        //paramProjectIdIsMongoId, queryPopulateIsBoolean
    ],
    SensorTempHumController.indexEvent 
);

router.get('/:sensorId',
    [ 
        Authorize('super', 'administrator', 'user', 'guest'),
        //paramProjectIdIsMongoId, queryPopulateIsBoolean
    ],
    SensorTempHumController.showSensor  
);

router.get('/',
    [ 
        Authorize('super', 'administrator', 'user', 'guest'),
        querySkipIsInt, queryLimitIsInt, queryProjectIdIsMongoId, queryClientIdIsMongoId
    ],
    SensorTempHumController.indexSensor
);

// POST

router.post('/:sensorId/method/:method',
    [ 
        Authorize('super', 'administrator', 'user', 'guest'),
        //paramProjectIdIsMongoId, queryPopulateIsBoolean
    ],
    SensorTempHumController.execMethodSensor
);

router.post('/',
    [ 
        Authorize('super'),
        //bodyNameRequired
    ],
    SensorTempHumController.storeSensor
);
/*
// PUT

router.put('/:projectId',
    [ 
        Authorize('super', 'administrator'),
        paramProjectIdIsMongoId
    ],
    ProjectController.updateProject
);
*/
// DELETE

router.delete('/:sensorId',
    [ 
        Authorize('super'),
        //paramProjectIdIsMongoId
    ],
    SensorTempHumController.deleteSensor
);

module.exports = router;