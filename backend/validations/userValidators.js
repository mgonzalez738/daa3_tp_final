const { query, body } = require('express-validator');

// QUERY

exports.queryEmailValid = query("email")
    .optional().isEmail()
    .withMessage("Invalid email address");

// BODY

exports.bodyUserIdRequired = body("UserId")
    .notEmpty()
    .withMessage("Body key 'UserId' must be present and unique");

exports.bodyFirstNameRequired = body("FirstName")
    .notEmpty()
    .withMessage("Body key 'FirstName' must be present and unique in collection");

exports.bodyLastNameRequired = body("LastName")
    .notEmpty()
    .withMessage("Body key 'FirstName' must be present and unique in collection");

exports.bodyEmailRequired = body("Email")
    .isEmail()
    .withMessage("Invalid email address");

exports.bodyEmailOptional = body("Email")
    .optional().isEmail()
    .withMessage("Invalid email address");

exports.bodyPasswordRequired = body("Password")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,20}$/, "i")
    .withMessage("Password should be combination of one uppercase , one lower case, one digit and min 8 , max 20 char long");

exports.bodyPasswordOptional = body("Password")
    .optional().matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,20}$/, "i")
    .withMessage("Password should be combination of one uppercase , one lower case, one digit and min 8 , max 20 char long");

exports.bodyCompanyIdOptional = body("CompanyId")
    .optional().isMongoId()
    .withMessage("Body key 'CompanyId' must be a valid hex-encoded representation of a MongoDB ObjectId");

