const express = require('express');
const router = express.Router();

const ProjectController = require('../controllers/projectController');
const { Authorize } = require('../middleware/authorization');
const { paramProjectIdIsMongoId, querySkipIsInt, queryLimitIsInt, bodyNameRequired, queryPopulateIsBoolean, queryClientIdIsMongoId } = require('../validations/commonValidators');

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

// POST

router.post('/',
    [ 
        Authorize('super', 'administrator'),
        bodyNameRequired
    ],
    ProjectController.storeProject
);

// PUT

router.put('/:projectId',
    [ 
        Authorize('super', 'administrator'),
        paramProjectIdIsMongoId
    ],
    ProjectController.updateProject
);

// DELETE

router.delete('/:projectId',
    [ 
        Authorize('super', 'administrator'),
        paramProjectIdIsMongoId
    ],
    ProjectController.deleteProject
);

module.exports = router;