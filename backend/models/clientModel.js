const mongoose = require('mongoose');

const ErrorResponse = require('../utils/errorResponse');

/** Clients schema */
const ClientSchema = new mongoose.Schema({ 
    Name: { type: String, required: true, unique: true },
    Tag: { type: String, required: true, unique: true },
    CreatedAt: { type: Date, default: Date.now }   
}, { id: false, toJSON: { virtuals: true }, toObject: { virtuals: true }});

// Virtuals

ClientSchema.virtual('Users', {
    localField: '_id',
    foreignField: 'ClientId',
    ref: 'User',
    justOne: false
 });

 ClientSchema.virtual('Companies', {
    localField: '_id',
    foreignField: 'ClientId',
    ref: 'Company',
    justOne: false
 });

 // Modelo

exports.Client = mongoose.model('Client', ClientSchema, 'Clients');