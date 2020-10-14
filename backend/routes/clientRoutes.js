const express = require('express');
const router = express.Router();

const ClientController = require('../controllers/clientController');
const { Authorize } = require('../middleware/authorization');
const Validators = require('../validations/commonValidators');

// GETS

router.get('/:clientId',
    [ 
        Authorize('super'),
        Validators.paramClientIdIsMongoId, Validators.queryPopulateIsBoolean
    ],
    ClientController.showClient   
);

router.get('/',
    [ 
        Authorize('super'),
        Validators.querySkipIsInt, Validators.queryLimitIsInt
    ],
    ClientController.indexClient
);

// POST

router.post('/',
    [ 
        Authorize('super'),
        Validators.bodyNameRequired, Validators.bodyTagRequired
    ],
    ClientController.storeClient
);

// PUT

router.put('/:clientId',
    [ 
        Authorize('super'),
        Validators.paramClientIdIsMongoId
    ],
    ClientController.updateClient
);

// DELETE

router.delete('/:clientId',
    [ 
        Authorize('super'),
        Validators.paramClientIdIsMongoId
    ],
    ClientController.deleteClient
);

module.exports = router;