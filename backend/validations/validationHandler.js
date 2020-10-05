const {validationResult} = require('express-validator');

module.exports = req => {
    const validationErrors = validationResult(req);
    if(!validationErrors.isEmpty()){
        let error = new Error('Validation Failed -> ');
        for(i=0; i<validationErrors.errors.length; i++)
            error.message += validationErrors.errors[0].msg;
        error.statusCode = 422; // Unprocessable Entity
        //error.validation = validationErrors.array();
        throw error;
    }
}