const Gateway = require("../models/gatewayModel");
const validationHandler = require('../validations/validationHandler');
var mongoose = require('mongoose');
var Registry = require('azure-iothub').Registry;
var Client = require('azure-iothub').Client;

// Conexion al IoT Hub
var iotHubConnectionString = "HostName=" + process.env.IOT_HUB_HOST + ";" +
                             "SharedAccessKeyName=" + process.env.IOT_HUB_SHARED_ACCESS_KEY_NAME + ";" +
                             "SharedAccessKey=" + process.env.IOT_HUB_SHARED_ACCESS_KEY;
var registry = Registry.fromConnectionString(iotHubConnectionString);
var client = Client.fromConnectionString(iotHubConnectionString);

exports.index = async (req, res, next) => {

    var logMessage = "\x1b[34mApi: " + req.method + "(" + req.originalUrl + ") | Retrieve Gateways\x1b[0m";

    // Validacion

    try {
        validationHandler(req);
    }
    catch (err) {
        next(err);
        console.log(logMessage + "\x1b[31m -> " + err.message + "\x1b[0m");
        return;
    }

    // Procesamiento

    try {

        logMessage = logMessage + "\x1b[0m";
        console.log(logMessage);

        const gateways = await Gateway.find().sort({ CreatedAt: -1 });

        if(!gateways.length)
        {
            var msg = "No data found";
            next({
                statusCode: 404,
                message: msg
            });
            console.log("\x1b[35mDatabase: Gateways | No data retrieved \x1b[0m");
        } else {
            console.log("\x1b[35mDatabase: Gateways | Data retrieved (" + gateways.length + " records)\x1b[0m");
            res.send(gateways);
        }
    } catch (err) {
        next(err);
        console.log("\x1b[35mDatabase: Gateways) | \x1b[31mError retrieving data \x1b[35m -> " + err.message + "\x1b[0m");
    }
};

exports.show = async (req, res, next) => {
    try {
        const gateway = await Gateway.findOne({ 
            _id: req.params.id
        });
        res.send(gateway);
    } catch (err) {
        next(err);
    }
};

exports.store = async (req, res, next) => {
    try {
        //validationHandler(req);  
        
        // Crea el dispositivo edge para el IoT Hub
        var device = {
            deviceId: mongoose.Types.ObjectId().toHexString(),
            status: 'enabled',
            capabilities: {
                iotEdge: true
            },
        };

        // Crea los Tags y propiedades del gemelo
        var twinData = {
            tags: {
                Name: req.body.Name,
                Description: "Raspberry Gateway",
                SerialNumber: "",
                Latitude: 0,
                Longitude: 0
            }
        };

        // Cadena de conexion del dispositivo
        let deviceConnectionString = "";

        // Registra el dispositivo
        registry.create(device, function (err) {
            if(err) {
                console.error('Could not create device: ' + err.message);
            } 
            else {
                // Obtiene la cadena de conexion (TODO)
                registry.get(device.deviceId, function(err, deviceInfo) {
                    if(err) {
                        console.error('Could not get device: ' + err.message);
                    } else {
                        deviceConnectionString = "HostName=" + config.iotHub.HostName + ";" +
                                                 "DeviceId=" + deviceInfo.deviceId + ";" +
                                                 "SharedAccessKey=" + deviceInfo.authentication.symmetricKey.primaryKey;
                        //Actualiza los tags
                        registry.getTwin(device.deviceId, function(err, twin){
                            if (err) {
                                console.error('Could not get device twin: ' + err.message);
                            } else {                          
                                twin.update(twinData, async function(err) {
                                    if (err) {
                                        console.error('Could not update device twin: ' + err.message);
                                    } else {
                                        let gateway = new Gateway();
                                        gateway._id = device.deviceId;
                                        gateway.ConnectionString = deviceConnectionString;
                                        gateway.Tags= twinData.tags;
                                        gateway = await gateway.save();
                                        console.log("Gateway " +  gateway.Tags.Name + " (ID =" + gateway._id + ") creado en Hub y Db.");
                                        res.send(gateway);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });         
    } catch (err) {
        next(err);
    }
};

exports.destroy = async (req, res, next) => {
    try {
        
        registry.delete(req.params.id, async function (err) {
            if(err) {
                console.error('Could not delete device: ' + err.message);
            } 
            else {
                    let gateway = await Gateway.findOne({ 
                        _id: req.params.id
                    });
                    await gateway.delete();
                    console.log("Gateway " +  gateway.Tags.Name + " (ID = " + gateway._id + ") eliminado en Hub y Db.");
                    res.send({message: "success"});
            }
        });
    } catch (err) {
        next(err);
    }
};

