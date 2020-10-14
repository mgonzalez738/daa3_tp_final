const express = require('express');
const router = express.Router();
const gatewayController = require('../controllers/gatewayController');
const gatewayDataController = require('../controllers/gatewayDataController');
const {queryFromDateIsISO8601, queryToDateIsISO8601, paramGatewayIdIsMongoId, paramDataIdIsMongoId, bodyIsAggregationStageArray} = require('../validations/commonValidators');
const {bodyUtcTimeIsISO8601, bodyPowerVoltageIsFloat, bodySensedVoltageIsFloat, bodyBatteryVoltageIsFloat, bodyTemperatureIsFloat} = require('../validations/commonValidators');

// Datos Gateway

router.get(
    '/data/',
    [
        queryFromDateIsISO8601,
        queryToDateIsISO8601,
        bodyIsAggregationStageArray
    ], 
    gatewayDataController.indexAllGw
);

router.get(
    '/:gwId/data/',
    [
        paramGatewayIdIsMongoId,
        queryFromDateIsISO8601,
        queryToDateIsISO8601,
        bodyIsAggregationStageArray
    ], 
    gatewayDataController.indexOneGw
);

router.get(
    '/:gwId/data/:dataId',
    [
        paramGatewayIdIsMongoId,
        paramDataIdIsMongoId
    ],
    gatewayDataController.show
);

router.post(
    '/:gwId/data/', 
    [
        paramGatewayIdIsMongoId,
        bodyUtcTimeIsISO8601,
        bodyPowerVoltageIsFloat,
        bodySensedVoltageIsFloat,
        bodyBatteryVoltageIsFloat,
        bodyTemperatureIsFloat
    ],
    gatewayDataController.store
);

router.delete(
    '/:gwId/data/:dataId', 
    [
        paramGatewayIdIsMongoId,
        paramDataIdIsMongoId
    ],
    gatewayDataController.destroy
);

router.put(
    '/:gwId/data/:dataId', 
    [
        paramGatewayIdIsMongoId,
        paramDataIdIsMongoId,
        bodyUtcTimeIsISO8601,
        bodyPowerVoltageIsFloat,
        bodySensedVoltageIsFloat,
        bodyBatteryVoltageIsFloat,
        bodyTemperatureIsFloat
    ],
    gatewayDataController.update
);

// Gateways

router.get(
    '/', 
    gatewayController.index
);

router.get(
    '/:gwId', 
    [
        paramGatewayIdIsMongoId
    ],
    gatewayController.show
);

router.post(
    '/', 
    gatewayController.store
);

router.delete(
    '/:gwId', 
    [
        paramGatewayIdIsMongoId
    ],
    gatewayController.destroy
);

module.exports = router;