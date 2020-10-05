const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const { Company } = require('../models/companyModel');
const { Client } = require('../models/clientModel');
const { Project } = require('../models/projectModel');

const ErrorResponse = require('../utils/errorResponse');

// Esquema

const UserSchema = new mongoose.Schema({ 
    UserId: { type: String, required: true },
    FirstName: { type: String, required: true },
    LastName: { type: String, required: true },
    Email: { type: String, required: true },
    Role: { type: String, enum: ['super', 'administrator', 'user', 'guest'], default: 'guest' },
    Password: { type: String, required: true, select: false },
    CompanyId: { type: mongoose.Schema.Types.ObjectId },
    ProjectsId: [{ type: mongoose.Schema.Types.ObjectId }],
    ClientId: { type: mongoose.Schema.Types.ObjectId },
    ProjectId: { type: mongoose.Schema.Types.ObjectId },
    ResetPasswordToken: { type: String, select: false },
    ResetPasswordExpire: { type: Date, select: false },
    CreatedAt: { type: Date, default: Date.now }   
} , { id: false, toJSON: { virtuals: true }, toObject: { virtuals: true }});
UserSchema.index({ LastName: 1, FirstName: 1 });
UserSchema.index({ UserId: 1 }, { unique: true });

// Virtuals

UserSchema.virtual('Company', {
    localField: 'CompanyId',
    foreignField: '_id',
    ref: 'Company',
    justOne: true
 });

 UserSchema.virtual('Client', {
    localField: 'ClientId',
    foreignField: '_id',
    ref: 'Client',
    justOne: true
 });

 UserSchema.virtual('Projects', {
    localField: 'ProjectsId',
    foreignField: '_id',
    ref: 'Project',
    justOne: false
 });

 UserSchema.virtual('Project', {
    localField: 'ProjectId',
    foreignField: '_id',
    ref: 'Project',
    justOne: true
 });

// Middleware

/** Encripta el password y valida referencias */
UserSchema.pre('save', async function(next) {
    // Hashea el password antes de guardarlo
    if(this.isModified('Password')) {
        const salt = await bcrypt.genSalt(10);
        this.Password = await bcrypt.hash(this.Password, salt);
    }
    // Verifica que exista el id de cliente
    if(this.ClientId && this.isModified('ClientId')) {
        const client = await Client.findById(this.ClientId);
        if(!client) {
            return next(new ErrorResponse('ClientId not found', 400));
        }
    } 
    // Verifica que exista el id de compania
    if(this.CompanyId && this.isModified('CompanyId')) {
        const company = await Company.findById(this.CompanyId);
        if(!company) {
            return next(new ErrorResponse('CompanyId not found', 400));
        }
    } 
    // Verifica que equistan los id de proyectos
    if(this.ProjectsId && this.isModified('ProjectsId')) {
        for(i=0; i<this.ProjectsId.length; i++) {
            const project = await Project.findById(this.ProjectsId[i]);
            if(!project) {
                return next(new ErrorResponse('ProjectId not found', 400));
            }
        }
    }
    // Verifica que exista el id de proyecto
    if(this.ProjectId && this.isModified('ProjectId')) {
        const project = await Project.findById(this.ProjectId);
        if(!project) {
            return next(new ErrorResponse('ProjectId not found', 400));
        }
    } 
    next();  
});

// Metodos

/** toJSON override */
UserSchema.method('toJSON', function() {
    let user = this.toObject();
    if(this.Company) {
        delete user.CompanyId;
    }
    if(this.Client) {
        delete user.ClientId;
    }
    if(this.Projects) {
        delete user.ProjectsId;
    }
    if(this.Project) {
        delete user.ProjectId;
    }
    return user;
  });

/** Firma y devuelve el token */
UserSchema.methods.getSignedJwtToken = function() {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

/** Compara el password ingresado */
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.Password);
};

/** Genera y hashea el token de password*/
UserSchema.methods.getResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.ResetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.ResetPasswordExpire = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

// Modelo

exports.User = mongoose.model('User', UserSchema, 'Users');