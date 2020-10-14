const express = require('express');
const router = express.Router();

const UserController = require('../controllers/userController');
const { Authorize } = require('../middleware/authorization');
const { bodyFirstNameRequired, bodyLastNameRequired, bodyEmailRequired, bodyPasswordRequired, bodyCompanyIdOptional, queryEmailValid } = require('../validations/userValidators');
const { bodyEmailOptional, bodyPasswordOptional } = require('../validations/userValidators');
const { paramUserIdIsMongoId, querySkipIsInt, queryLimitIsInt, queryPopulateIsBoolean, bodyClientIdOptionalNull } = require('../validations/commonValidators');

// GETS

router.get('/me',
    [ Authorize('super', 'administrator', 'user', 'guest') ],
    UserController.getMe
);

router.get('/:userId',
    [ 
        Authorize('super', 'administrator'),
        paramUserIdIsMongoId, queryPopulateIsBoolean
    ],
    UserController.showUser   
);

router.get('/',
    [ 
        Authorize('super', 'administrator'),
        querySkipIsInt, queryLimitIsInt, queryEmailValid
    ],
    UserController.indexUser
);

// POST

router.post('/',
    [ 
        Authorize('super', 'administrator'),
        bodyFirstNameRequired, bodyLastNameRequired, bodyEmailRequired,
        bodyPasswordRequired, bodyCompanyIdOptional
    ],
    UserController.storeUser
);

// PUT

router.put('/:userId',
    [ 
        Authorize('super', 'administrator', 'user', 'guest'),
        paramUserIdIsMongoId, bodyEmailOptional,
        bodyPasswordOptional, bodyCompanyIdOptional, bodyClientIdOptionalNull
    ],
    UserController.updateUser
);

// DELETE

router.delete('/:userId',
    [ 
        Authorize('super', 'administrator'),
        paramUserIdIsMongoId
    ],
    UserController.deleteUser
);

module.exports = router;