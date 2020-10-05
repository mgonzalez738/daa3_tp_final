const crypto = require('crypto');

var Registry = require('azure-iothub').Registry;
var Client = require('azure-iothub').Client;

// Cadena de conexion al IoT Hub
var iotHubConnectionString = "HostName=" + process.env.IOT_HUB_HOST + ";" +
                             "SharedAccessKeyName=" + process.env.IOT_HUB_SHARED_ACCESS_KEY_NAME + ";" +
                             "SharedAccessKey=" + process.env.IOT_HUB_SHARED_ACCESS_KEY;

var registry = Registry.fromConnectionString("HostName=MonitoringHub.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=aOFsWnGlHYPBUyO+J4QJtrq7zXITgnxlHuOewLiyTpU=");                           
var client = Client.fromConnectionString(iotHubConnectionString);

exports.CreateDevice = async (deviceId, isEdge) => {

    const hmac1 = crypto.createHmac('sha256', process.env.AZURE_SECRET1).update(deviceId).digest('base64');
    const hmac2 = crypto.createHmac('sha256', process.env.AZURE_SECRET2).update(deviceId).digest('base64');

    console.log('Hmac1:' + hmac1);
    console.log('Hmac2:' + hmac2);
    
    var deviceInfo = {
        deviceId: deviceId,
        status: 'enabled',
        capabilities: { iotEdge: isEdge },
        authentication: {
            symmetricKey: {
              primaryKey: hmac1,
              secondaryKey: hmac2
            },
        }
    };

    const result = await registry.create(deviceInfo);
    return result;//HostName=" + process.env.IOT_HUB_HOST + ";" +
           //"DeviceId=" + result.responseBody.deviceId + ";" +
           //"SharedAccessKey=" + result.responseBody.authentication.symmetricKey.primaryKey;
}

exports.DeleteDevice = async (deviceId) => {
    
    const result = await registry.delete(deviceId);
    return result;
}

exports.GetDevice = async (deviceId) => {
    
    const result = await registry.get(deviceId);
    return result.responseBody;
}

