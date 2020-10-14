const express = require('express');
const router = express.Router();

const CompanyController = require('../controllers/companyController');
const { Authorize } = require('../middleware/authorization');
const { paramCompanyIdIsMongoId, querySkipIsInt, queryLimitIsInt, bodyNameRequired, queryPopulateIsBoolean } = require('../validations/commonValidators');

// GETS

router.get('/:companyId',
    [ 
        Authorize('super', 'administrator'),
        paramCompanyIdIsMongoId, queryPopulateIsBoolean
    ],
    CompanyController.showCompany   
);

router.get('/',
    [ 
        Authorize('super', 'administrator'),
        querySkipIsInt, queryLimitIsInt
    ],
    CompanyController.indexCompany
);

// POST

router.post('/',
    [ 
        Authorize('super', 'administrator'),
        bodyNameRequired
    ],
    CompanyController.storeCompany
);

// PUT

router.put('/:companyId',
    [ 
        Authorize('super', 'administrator'),
        paramCompanyIdIsMongoId
    ],
    CompanyController.updateCompany
);

// DELETE

router.delete('/:companyId',
    [ 
        Authorize('super', 'administrator'),
        paramCompanyIdIsMongoId
    ],
    CompanyController.deleteCompany
);

module.exports = router;