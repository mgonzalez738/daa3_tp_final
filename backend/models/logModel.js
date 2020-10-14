const mongoose = require('mongoose');

/** Log schema */
const LogSchema = new mongoose.Schema({ 
    Timestamp: { type: Date, required: true },
    Level: { type: String, required: true },
    Process: { type: String, required: true },
    UserId: { type: mongoose.Schema.Types.ObjectId },
    Ip: {type: String },
    Message: { type: String },
    Data: { type: mongoose.Schema.Types.Mixed }
}, { id: false, toJSON: { virtuals: true }, toObject: { virtuals: true }});
LogSchema.index({ Timestamp: 1 });

// Virtuals

LogSchema.virtual('User', {
    localField: 'UserId',
    foreignField: '_id',
    ref: 'User',
    justOne: true
 });

 // Metodos

/** toJSON override */
LogSchema.method('toJSON', function() {
    let log = this.toObject();
    if(this.User) {
        delete log.UserId;
    }
    return log;
  });

// Modelo

exports.Log = mongoose.model('Log', LogSchema, 'Logs');