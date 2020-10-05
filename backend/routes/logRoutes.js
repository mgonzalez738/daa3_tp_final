const express = require('express');
const router = express.Router();

const LogController = require('../controllers/logController');
const { Authorize } = require('../middleware/authorization');
const Validators = require('../validations/commonValidators');

// GETS

router.get('/:logId',
    [ 
        Authorize('super'),
        Validators.paramLogIdIsMongoId, Validators.queryPopulateIsBoolean
    ],
    LogController.showLog   
);

router.get('/',
    [ 
        Authorize('super'),
        Validators.querySkipIsInt, Validators.queryLimitIsInt,
        Validators.queryFromDateIsISO8601, Validators.queryToDateIsISO8601, 
        Validators.querySkipIsInt, Validators.queryLimitIsInt, Validators.querySortCustom 
    ],
    LogController.indexLog
);

// POST

router.post('/',
    [ 
        Authorize('super'),
        //Validators.bodyNameRequired, Validators.bodyTagRequired
    ],
    LogController.storeLog
);

// PUT

router.put('/:logId',
    [ 
        Authorize('super'),
        Validators.paramLogIdIsMongoId
    ],
    LogController.updateLog
);

// DELETE

router.delete('/:logId',
    [ 
        Authorize('super'),
        Validators.paramLogIdIsMongoId
    ],
    LogController.deleteLog
);

module.exports = router;