const mongoose = require('mongoose');
const numeral = require('numeral');
const moment = require('moment');

const dayTime = require('../services/daytime');
const { TagsSchema, CampbellSchema, AzureSchema } = require('./commonModels');
const { ConnectionType } = require('../configs/types');

const Schema = mongoose.Schema;

// DISCRIMINADOR DE TIPOS

const discriminator = { discriminatorKey: 'ConnectionType' };

// CONFIGURACION BASE SENSOR VWSG PIPE3

const ConfigurationSchema = new Schema({ 
    Date: { type: Date, default: Date.now() },
    InitStrains: { type: Array, default: [0.0, 0.0, 0.0] },
    InitTemps: { type: Array, default: [0.0, 0.0, 0.0] },
    TempSensorCount: { type: Number, default: 3 },
    TempCorrEnable: { type: Boolean, default: false },
    TempCorrFreeExpan: { type: Boolean, default: false },
    TempSensorsCount: { type: Number, default: 3 },
    TeCoeffPipe: { type: Number, default: 12.0 }, // uStrain/°C
    TeCoeffVwsg: { type: Number, default: 10.8 }, // uStrain/°C
});

// ESQUEMA SENSOR VWSG PIPE3

// Esquema base
const SensorSchema = new Schema({ 
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    Name: { type: String, required: true, unique: true },
    Tags: { type: TagsSchema, default: { 'Description':  "Sensor VWSG Pipe 3" }},
    Configurations: [ ConfigurationSchema ] 
}, discriminator );

// Exporta el modelo de sensor
const Sensor = mongoose.model('SensorVwsgPipe3', SensorSchema, 'SensorVwsgPipe3');
const SensorCampbell = Sensor.discriminator('SensorVwsgPipe3Campbell', new Schema({ Device: {type: CampbellSchema}}), ConnectionType.Campbell);
const SensorAzure = Sensor.discriminator('SensorVwsgPipe3Azure', new Schema({ Device: {type: AzureSchema}}), ConnectionType.Azure);
exports.Sensor = Sensor;

// DATOS SENSOR VWSG PIPE3

// Esquema base
const DataSchema = new Schema({ 
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    SensorId: { type: mongoose.Schema.Types.ObjectId, ref: 'SensorVwsgPipe3', required: true },
    Date: { type: Date, required: true },
    Strains: { type: Array, default: [] },
    Temps: { type: Array, default: [] }
});
DataSchema.index({ SensorId: 1, Date: 1 }, { unique: true })

// Exporta los modelos de datos de sensor
const Data = mongoose.model('DataVwsgPipe3', DataSchema, 'DataVwsgPipe3');
exports.Data = Data;

// FUNCIONES

const GetSensorConfigurations = async (sensorId = undefined, lastOnly = false, connectionType = undefined) => {    
    try {
        var aggregationArray = [];

        // Etapa : Match1 sensorId 
        if(sensorId != null) {
            let match1 = { $match : {_id: new mongoose.Types.ObjectId(sensorId)}};
            aggregationArray.push(match1);
        }
        // Etapa : Match2 connectionType
        if(connectionType != null) {
            let match2 = { $match : {ConnectionType: connectionTyp }};
            aggregationArray.push(match2);
        }
        // Etapa : Project Devuelve solo el id de sensor y las configuraciones
        var project = { 
            $project: { 'Configurations': 1 }
        }
        aggregationArray.push(project);   
        // Etapa : Set Obtiene el documento con solo el elemento mas nuevo del array de configuracion
        if(lastOnly)
        {
            var addFields = { 
                $addFields: {
                    'Configurations': [{
                        $arrayElemAt: [ '$Configurations', { $indexOfArray: [ '$Configurations.Date', { $max:'$Configurations.Date' } ] } ]
                    }]
                }
            }
            aggregationArray.push(addFields);
        }
        // Etapa : Ordena las configuraciones por fecha (Mas antigua primero)
        if(!lastOnly)
        {
            var sort1 =  { $unwind: "$Configurations" };
            var sort2 =  { $sort: { "Configurations.Date": 1 } };
            var sort3 =  { $group: { _id: "$_id", "Configurations": { "$push" : "$Configurations" } } };
            aggregationArray.push(sort1);
            aggregationArray.push(sort2);
            aggregationArray.push(sort3);
        }
        // Ejecuta la Query
        const sensors = await Sensor.aggregate(aggregationArray);
        return sensors;
    } catch (error) {
        console.log(dayTime.getUtcString() + `\x1b[35mDatabase: Error executing function GetSensorConfigurations -> ${error}\x1b[0m`); 
    }
};
exports.GetSensorConfigurations = GetSensorConfigurations;

const LoadFromParsedData = async (connectionType, fileName, parsedData) => {  
    
    if((connectionType === undefined) || (fileName === undefined) || (parsedData === undefined))
        throw new Error('Parameters could not be undefined.')

    if(connectionType === ConnectionType.Campbell)
    {
        try {
            // Obtiene los id de sensores Campbell con los datos de archivo
            var sensors = await Sensor.find( {ConnectionType: ConnectionType.Campbell}, {'Device.DataSource': 1}).lean();
            // Verifica si coincide con la configuracion de alguno de los sensores
            for (i = 0; i < sensors.length; i++) { 
                 if(sensors[i].Device.DataSource.FileName == fileName )
                { 
                    for(j = 0; j < parsedData.length; j++)
                    {
                        try {
                            // Carga los dados del sensor y guarda
                            let data = new Data();
                            data._id = mongoose.Types.ObjectId().toHexString();
                            data.SensorId = sensors[i]._id;
                            data.Date = moment(parsedData[j][0]+numeral(sensors[i].Device.DataSource.Timezone).format('+00'), moment.ISO_8601)
                            data.Strains.push(parsedData[j][sensors[i].Device.DataSource.StrainCols[0]]);
                            data.Strains.push(parsedData[j][sensors[i].Device.DataSource.StrainCols[1]]);
                            data.Strains.push(parsedData[j][sensors[i].Device.DataSource.StrainCols[2]]);
                            data.Temps.push(parsedData[j][sensors[i].Device.DataSource.TempCols[0]]);
                            data.Temps.push(parsedData[j][sensors[i].Device.DataSource.TempCols[1]]);
                            data.Temps.push(parsedData[j][sensors[i].Device.DataSource.TempCols[2]]);
                            await data.save();
                        } catch (error) {
                            console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${Data.collection.collectionName} | Error inserting entry ${j} -> ${error}\x1b[0m`); 
                        }
                    }
                    console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${Data.collection.collectionName} | Inserted ${parsedData.length} documents\x1b[0m`); 
                }
            }
        } catch (error) {
            console.log(dayTime.getUtcString() + `\x1b[35mDatabase: ${Data.collection.collectionName} | Error loading data from ${ConnectionType.Campbell} parsed file -> ${error}\x1b[0m`); 
        }
    }
}
exports.LoadFromParsedData = LoadFromParsedData;

const AddCalculatedData = async (sensorId, sensorData) => {

    // Obtiene las configuraciones del sendor
    var sensorConfigs = await GetSensorConfigurations(sensorId);

    // Agrega los datos calculados a cada documento
    for(i=0; i<sensorData.length; i++) {

        // Obtiene la configuracion a aplicar segun la fecha de los datos
        confIndex = -1;
        for(j=0; j<sensorConfigs[0].Configurations.length; j++)
        {
            if(sensorData[i].Date > sensorConfigs[0].Configurations[j].Date)
                confIndex = j;
            else
                break;
        }
        if(confIndex == -1)
        {
            // No pudo encontrar una configuracion anterior a la fecha de los datos
            sensorData[i].StrainsDelta = [NaN, NaN, NaN];   
            sensorData[i].StrainAxial = NaN;  
            sensorData[i].StrainBending = NaN;    
            sensorData[i].AngleBending = NaN;   
            sensorData[i].Error = "Could not find a valid configuration for calculations. Check data and sensor configurations dates."
        }
        else
        {
            sensorData[i].StrainsDelta = CalcRelativeStrains(sensorConfigs[0].Configurations[confIndex], sensorData[i]);
            sensorData[i].StrainAxial = CalcAxialStrain(sensorData[i].StrainsDelta);
            sensorData[i].StrainBending = CalcBendingStrain(sensorData[i].StrainsDelta);  
            sensorData[i].AngleBending = CalcBendingAngle(sensorData[i].StrainsDelta);
        }
        
    }
    return sensorData;
}
exports.AddCalculatedData = AddCalculatedData;

const CalcRelativeStrains = (conf, data) => {
    strains = [];

    // Sin corrección de temperatura
    if(!conf.TempCorrEnable) {
        strains[0] = data.Strains[0] - conf.InitStrains[0];
        strains[1] = data.Strains[1] - conf.InitStrains[1];
        strains[2] = data.Strains[2] - conf.InitStrains[2];
    }

    // Con corrección de temperatura
    else {   
        var deltaTemp0, deltaTemp1, deltaTemp2;

        // Cantidad de sensores de temperatura
        deltaTemp0 = data.Temps[0] - conf.InitTemps[0];
        if(conf.TempSensorCount == 1) {
            deltaTemp1 = data.Temps[0] - conf.InitTemps[0];
            deltaTemp2 = data.Temps[0] - conf.InitTemps[0];
        } else if (conf.TempSensorCount == 3) {
            deltaTemp1 = data.Temps[1] - conf.InitTemps[1];
            deltaTemp2 = data.Temps[2] - conf.InitTemps[2];
        }

        // Con restriccion a la expansion axial de la tuberia
        if(!conf.TempCorrFreeExpan)
        {
            strains[0] = data.Strains[0] - conf.InitStrains[0] + conf.TeCoeffVwsg * deltaTemp0;
            strains[1] = data.Strains[1] - conf.InitStrains[1] + conf.TeCoeffVwsg * deltaTemp1;
            strains[2] = data.Strains[2] - conf.InitStrains[2] + conf.TeCoeffVwsg * deltaTemp2;
        }
        // Sin restriccion a la expansion axial de la tuberia
        else if(!conf.TempCorrFreeExpan)
        {
            strains[0] = data.Strains[0] - conf.InitStrains[0] + (conf.TeCoeffVwsg - conf.TeCoeffPipe) * deltaTemp0;
            strains[1] = data.Strains[1] - conf.InitStrains[1] + (conf.TeCoeffVwsg - conf.TeCoeffPipe) * deltaTemp1;
            strains[2] = data.Strains[2] - conf.InitStrains[2] + (conf.TeCoeffVwsg - conf.TeCoeffPipe) * deltaTemp2;
        }
    }
    return strains
}

const CalcAxialStrain = (strains) => {
    strain = (strains[0] + strains[1] + strains[2]) / 3;
    return strain;
}

const CalcBendingStrain = (strains) => {
    strain = 2 / 3 *Math.sqrt( Math.pow(strains[0],2) + Math.pow(strains[1],2) + Math.pow(strains[2],2) 
                               - strains[0]*strains[1] - strains[0]*strains[2] - strains[1]*strains[2]);
    return strain;
}

const CalcBendingAngle = (strains) => {
    angle = Math.atan(Math.sqrt(3) * (strains[1] - strains[2]) / (2 * strains[0] - strains[1] - strains[2])) * 180 / Math.PI + 180;
    return angle;
}
