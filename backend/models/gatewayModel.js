const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);

const Schema = mongoose.Schema;

const GatewaySchema = new Schema({
    _id: { type: mongoose.Schema.Types.ObjectId },
    ConnectionString : { type: String, required : false},
    Tags: {
        Name: { type: String, required : true},
        Description: { type: String, required : false},
        SerialNumber: { type: String, required : false },
        Latitude: { type: Number, required : false },
        Longitude: { type: Number, required : false }
    },
    Properties: {
        PollData: {
            Enabled: { type: Boolean, required : false },
            Period: { type: Number, required : false },
            Unit: { type: String, required : false }
        },
        DetachedTelemetry: {
            Enabled: { type: Boolean, required : false },
            Period: { type: Number, required : false },
            Unit: { type: String, required : false }
        }
    },
    CreatedAt: { type: Date, default: Date.now() }
});

module.exports = mongoose.model("gateway", GatewaySchema);