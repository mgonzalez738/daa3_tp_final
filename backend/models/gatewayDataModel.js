const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);

const Schema = mongoose.Schema;

var GatewayDataSchema = new Schema({
    _gatewayId : { type: mongoose.Schema.Types.ObjectId, required : true },
    DocDate: { type: Date, required : true, unique : true},
    Data: [{
        UtcTime: { type: Date, required : true},
        PowerVoltage: { type: Number },
        SensedVoltage: { type: Number },
        BatteryVoltage: { type: Number },
        Temperature: { type: Number }
    }],
});

module.exports = mongoose.model("gatewayData", GatewayDataSchema);