const mongoose = require('mongoose');

const { LocationSchema, AzureSchema } = require('./commonModels');
const { Client } = require('../models/clientModel');
const { ConnectionType } = require('../configs/types');

const ErrorResponse = require('../utils/errorResponse');

// Esquema de configuraciones

const SensorConfigurationSchema = new Schema({ 
    Timestamp: { type: Date, default: Date.now() }, 
});

// Esquema Sensor

const SensorSchema = new mongoose.Schema(
{ 
    DeviceId: { type: String, required: true },
    Location: { type: LocationSchema },
    SensorConfigurations: [ SensorConfigurationSchema ],
    ClientId: { type: mongoose.Schema.Types.ObjectId, required: true },
    CreatedAt: { type: Date, default: Date.now } 
}, 
{   id: false, 
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true },
    discriminatorKey: 'DeviceType' 
});
SensorSchema.index({ DeviceId: 1, ClientId: 1 }, { unique: true });

// Virtuals

SensorSchema.virtual('Client', {
    localField: 'ClientId',
    foreignField: '_id',
    ref: 'Client',
    justOne: true
});

// Middlewares

/** Valida referencias */
SensorSchema.pre('save', async function(next) {
    // Verifica que exista el id de cliente
    if(this.ClientId && this.isModified('ClientId')) {
        const client = await Client.findById(this.ClientId);
        if(!client) {
            return next(new ErrorResponse('ClientId not found', 400));
        }
    } 
    next();  
});

// Metodos

/** toJSON override */
SensorSchema.method('toJSON', function() {
    let project = this.toObject();
    if(this.Client) {
        delete project.ClientId;
    }
    return project;
  });

// Modelos

const Sensor = mongoose.model('SensorTempHum', SensorSchema, 'SensorsTempHum');
const SensorAzure = Sensor.discriminator('SensorTempHumAzure', new Schema({ DeviceConfiguration: { type: AzureSchema } }), ConnectionType.Azure);

exports.Sensor = Sensor;

// Esquema Datos

const DataSchema = new Schema({ 
    SensorId: { type: mongoose.Schema.Types.ObjectId, required: true },
    Timestamp: { type: Date, required: true },
    Temperature: { type: Number},
    Humidity: { type: Number }
}, { id: false, toJSON: { virtuals: true }, toObject: { virtuals: true } });
DataSchema.index({ Timestamp: 1 });

// Virtuals

DataSchema.virtual('Sensor', {
    localField: 'SensorId',
    foreignField: '_id',
    ref: 'SensorTempHum',
    justOne: true
 });

 // Middlewares

/** Valida referencias */
DataSchema.pre('save', async function(next) {
    // Verifica que exista el id de sensor
    if(this.SensorId && this.isModified('SensorId')) {
        const sensor = await Sensor.findById(this.SensorId);
        if(!sensor) {
            return next(new ErrorResponse('SensorId not found', 400));
        }
    } 
    next();  
});

// Metodos

/** toJSON override */
DataSchema.method('toJSON', function() {
    let data = this.toObject();
    if(this.Sensor) {
        delete data.SensorId;
    }
    return data;
});

// Modelo

const Data = mongoose.model('DataTempHum', DataSchema, 'DataTempHum');