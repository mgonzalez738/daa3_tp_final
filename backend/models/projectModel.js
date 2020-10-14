const mongoose = require('mongoose');

const { User } = require('../models/userModel');
const { Client } = require('../models/clientModel');

const ErrorResponse = require('../utils/errorResponse');

// Esquema

const ProjectSchema = new mongoose.Schema({ 
    Name: { type: String, required: true  },
    ClientId: { type: mongoose.Schema.Types.ObjectId, required: true },
    CreatedAt: { type: Date, default: Date.now }   
}, { id: false, toJSON: { virtuals: true }, toObject: { virtuals: true }});
ProjectSchema.index({ Name: 1, ClientId: 1 }, { unique: true });

// Virtuals

ProjectSchema.virtual('Client', {
    localField: 'ClientId',
    foreignField: '_id',
    ref: 'Client',
    justOne: true
 });

 ProjectSchema.virtual('Users', {
    localField: '_id',
    foreignField: 'ProjectsId',
    ref: 'User',
    justOne: false
 });

// Middlewares

/** Valida referencias */
ProjectSchema.pre('save', async function(next) {
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
ProjectSchema.method('toJSON', function() {
    let project = this.toObject();
    if(this.Client) {
        delete project.ClientId;
    }
    return project;
  });

// Modelo

exports.Project = mongoose.model('Project', ProjectSchema, 'Projects');