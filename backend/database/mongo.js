const mongoose = require('mongoose');

const dayTime = require('../services/daytime')

// Conecta a la instancia de MongoDB local
// MongoDb connection string and options

exports.DbName = "MongoDb";
exports.DbConnectionString = 'mongodb://localhost/IotMonitoring';
exports.DbConnectionOptions = { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true } 
