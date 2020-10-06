const express = require('express');
const router = express.Router();

const SensorTempHumController = require('../controllers/sensorTempHumController');
const { Authorize } = require('../middleware/authorization');
const {  } = require('../validations/commonValidators');

/*
// GETS

router.get('/:projectId',
    [ 
        Authorize('super', 'administrator', 'user', 'guest'),
        paramProjectIdIsMongoId, queryPopulateIsBoolean
    ],
    ProjectController.showProject   
);

router.get('/',
    [ 
        Authorize('super', 'administrator', 'user', 'guest'),
        querySkipIsInt, queryLimitIsInt, queryClientIdIsMongoId
    ],
    ProjectController.indexProject
);
*/
// POST

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