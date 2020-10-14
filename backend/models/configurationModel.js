const mongoose = require('mongoose');

/** Config schema */
const LogSchema = new mongoose.Schema({ 
    LoggerLevel: { type: mongoose.Schema.Types.Mixed },
});

exports.Configuration = mongoose.model('Configuration', LogSchema, 'Configuration');