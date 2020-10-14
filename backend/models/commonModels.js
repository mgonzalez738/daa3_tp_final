const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/** Tags schema for all devices and gateways */
const TagsSchema = new Schema({ 
    Description: { type: String },
    SerialNumber: { type: String },
    Latitude: { type: Number },
    Longitude: { type: Number }
},{ _id : false });
exports.TagsSchema = TagsSchema;

const LocationSchema = new Schema({ 
    Latitude: { type: Number },
    Longitude: { type: Number }
},{ _id : false });
exports.LocationSchema = LocationSchema;

/** Esquema de Configuracion para dispositivos tipo Campbell */
const CampbellSchema = new Schema({
    DataSource: {
        FileName: { type: String, default: "" },
        StrainCols: { type: Array, default: [null, null, null] },
        TempCols: { type: Array, default: [null, null, null]  },
        Timezone: { type: Number, default: 0 }
    }
}, { _id: false });
exports.CampbellSchema = CampbellSchema;

/** Esquema de Configuracion para dispositivos tipo Azure */
const AzureSchema = new Schema({
    ConnectionString: { type: String, default: "" }
}, { _id: false });
exports.AzureSchema = AzureSchema;