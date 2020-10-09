const mongoose = require('mongoose');

const { Client } = require('./clientModel');
const { Project } = require('./projectModel');

const ErrorResponse = require('../utils/errorResponse');

// Esquema Sensor

const SensorSchema = new mongoose.Schema(
{ 
    _id: { type: mongoose.Schema.Types.ObjectId },
    Name: { type: String, required: true },
    Location: { 
        latitude: { type: Number },
        longitude: { type: Number }
    },
    ConnectionString: { type: String },
    Configuration: {
        PollPeriod: { type: Number }
    },
    ClientId: { type: mongoose.Schema.Types.ObjectId, required: true },
    ProjectId: { type: mongoose.Schema.Types.ObjectId, required: true },
    CreatedAt: { type: Date, default: Date.now } 
}, { id: false, toJSON: { virtuals: true }, toObject: { virtuals: true }});
SensorSchema.index({ Name: 1, ClientId: 1 }, { unique: true });

// Virtuals

SensorSchema.virtual('Client', {
    localField: 'ClientId',
    foreignField: '_id',
    ref: 'Client',
    justOne: true
});

SensorSchema.virtual('Project', {
    localField: 'ProjectId',
    foreignField: '_id',
    ref: 'Project',
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
    // Verifica que exista el id de proyecto
    if(this.ProjectId && this.isModified('ProjectId')) {
        const project = await Project.findById(this.ProjectId);
        if(!project) {
            return next(new ErrorResponse('ProjectId not found', 400));
        }
    }
    // Verifica que el proyecto corresponda al mismo cliente 
    if(this.isModified('ProjectId'))
    next();  
});

// Metodos

/** toJSON override */
SensorSchema.method('toJSON', function() {
    let sensor = this.toObject();
    if(this.Client) {
        delete sensor.ClientId;
    }
    if(this.Project) {
        delete sensor.ProjectId;
    }
    return sensor;
  });

// Modelos

const Sensor = mongoose.model('SensorTempHum', SensorSchema, 'SensorsTempHum');
exports.SensorTempHum = Sensor;

// Esquema Datos

const DataSchema = new mongoose.Schema({ 
    Timestamp: { type: Date, required: true },
    Temperature: { type: Number },
    Humidity: { type: Number },
    SensorId: { type: mongoose.Schema.Types.ObjectId, required: true }
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
exports.DataTempHum = Data;

// Esquema Eventos

const EventSchema = new mongoose.Schema({ 
    SensorId: { type: mongoose.Schema.Types.ObjectId, required: true },
    Timestamp: { type: Date, required: true },
    Message: { type: String, required: true },
}, { id: false, toJSON: { virtuals: true }, toObject: { virtuals: true } });
DataSchema.index({ Timestamp: 1 });

// Virtuals

EventSchema.virtual('Sensor', {
    localField: 'SensorId',
    foreignField: '_id',
    ref: 'SensorTempHum',
    justOne: true
 });

 // Middlewares

/** Valida referencias */
EventSchema.pre('save', async function(next) {
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
EventSchema.method('toJSON', function() {
    let event = this.toObject();
    if(this.Sensor) {
        delete event.SensorId;
    }
    return event;
});

// Modelo

const Event = mongoose.model('EventTempHum', EventSchema, 'EventTempHum');
exports.EventTempHum = Event;