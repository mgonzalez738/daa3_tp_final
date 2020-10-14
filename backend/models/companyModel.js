const mongoose = require('mongoose');

const { User } = require('../models/userModel');
const { Client } = require('../models/clientModel');

const ErrorResponse = require('../utils/errorResponse');

// Esquema

const CompanySchema = new mongoose.Schema({ 
    Name: { type: String, required: true  },
    ClientId: { type: mongoose.Schema.Types.ObjectId, required: true },
    CreatedAt: { type: Date, default: Date.now }   
}, { id: false, toJSON: { virtuals: true }, toObject: { virtuals: true }});
CompanySchema.index({ Name: 1, ClientId: 1 }, { unique: true });

// Virtuals

CompanySchema.virtual('Client', {
    localField: 'ClientId',
    foreignField: '_id',
    ref: 'Client',
    justOne: true
 });
 
CompanySchema.virtual('Users', {
    localField: '_id',
    foreignField: 'CompanyId',
    ref: 'User',
    justOne: false
 });

// Middlewares

/** Valida referencias */
CompanySchema.pre('save', async function(next) {
    // Verifica que exista el id de cliente
    if(this.ClientId && this.isModified('ClientId')) {
        const client = await Client.findById(this.ClientId);
        if(!client) {
            return next(new ErrorResponse('ClientId not found', 400));
        }
    } 
    next();  
});

 /** Impide borrar una compania que tiene usuarios */
CompanySchema.pre('remove', async function(next) {
    // Verifica si hay usuarios de esta compania
    const user = await this.model('User').findOne({ CompanyId: this._id });
    if(user) {
        return next(new ErrorResponse('Can not delete a company with users related', 400));
    }
    next();   
});

// Metodos

/** toJSON override */
CompanySchema.method('toJSON', function() {
    let company = this.toObject();
    if(this.Client) {
        delete company.ClientId;
    }
    return company;
  });

// Modelo

exports.Company = mongoose.model('Company', CompanySchema, 'Companies');