const FtpSrv = require('ftp-srv'); 
const bunyan = require('bunyan'); 
const path = require('path');
const csv = require('csv-parser')
const fs = require('fs')
const moment = require('moment');
const { isText } = require('istextorbinary');

const dayTime = require('../services/daytime')
const dns = require('../services/dns')

const VwsgPipe3 = require("../models/sensorVwsgPipe3Model");
const { ConnectionType } = require('../configs/types');

const { Levels, Logger } = require('../services/loggerService');

// Inicia el servicio

exports.start = async () => {  

    // Resuelve la direccion IP externa
    let pasiveIp;
    try{
        pasiveIp = await dns.resolve(process.env.FTP_SRV_PASV_DNS);
    }catch(err){
        console.error(err);
    }

    // Crea el servicio

    const server = new FtpSrv({
        log: bunyan.createLogger({name: 'test', level: 60}),
        url: 'ftp://0.0.0.0:' + process.env.FTP_SRV_PORT,
        pasv_url: pasiveIp,
        pasv_min: process.env.FTP_SRV_PASV_PORT_MIN,
        pasv_max: process.env.FTP_SRV_PASV_PORT_MIN,
        greeting: ['Welcome', 'to', 'IotMonitoring', 'Server'],
        whitelist: ['ABOR', 'AUTH', 'CWD', 'DELE', 'LIST', 'OPTS', 'PASS', 'PASV', 'PORT', 'PWD', 'QUIT', 'RETR', 'STOR', 'TYPE', 'USER']
      });
  
    // Evento de loggeo
    server.on('login', ({ connection, username, password }, resolve, reject) => { 
    
        /// TODO: Cambiar a validar un usuario y pass asignado por proyecto
        /// TODO: Agregar habilitacion para carga de datos por ftp en proyecto
        if (username == "gie" && password == "giegie") { 
            //console.log(dayTime.getUtcString() + "\x1b[33mFtpServer: Client logged\x1b[0m");
            // Devuelve la carpeta raiz 
            /// TODO: Agregar subcarpeta por proyecto como raiz
            resolve({ root: path.join(__dirname, "../" + process.env.FTP_SRV_IMPORT_PATH) }); 
            // Agrega el handler para manejar las cargas de archivos
            connection.on('STOR', (error, filePath) => { 
                if (error) { 
                    console.log(dayTime.getUtcString() + `\x1b[33mFtpServer: Error receiving file ${path.basename(filePath)} | Error -> ${error}\x1b[0m`);
                } 
                console.log(dayTime.getUtcString() + `\x1b[33mFtpServer: File received | ${path.basename(filePath)}\x1b[0m`);
                // Parsea el archivo recibido
                parseFile(filePath);
            });
            connection.on('RETR', (error, filePath) => { 
                if (error) { 
                    console.log(dayTime.getUtcString() + `\x1b[33mFtpServer: Error retrieving file ${path.basename(filePath)} | Error -> ${error}\x1b[0m`);
                } 
                console.log(dayTime.getUtcString() + `\x1b[33mFtpServer: File retrieved ${path.basename(filePath)}\x1b[0m`);
            });             
        } else { 
            reject(new Error('Unable to authenticate with FTP server: bad username or password')); 
            console.log(dayTime.getUtcString() + `\x1b[33mFtpServer: Authentication error\x1b[0m`);
        } 
    }); 
  
    // Evento de error del cliente
    server.on('client-error', ({ context, error }) => { 
        console.log(dayTime.getUtcString() + `\x1b[33mFtpServer: Error interfacing with client | Error -> ${error}\x1b[0m`); 
    }); 
  
    const closeFtpServer = async () => { 
        await server.close(); 
    }; 
  
    // The types are incorrect here - listen returns a promise 
    await server.listen();

    Logger.Save(Levels.Trace, 'FtpServer',`Start listening on port ${process.env.FTP_SRV_PORT}`); 

    return { 
        shutdownFunc: async () => { 
        // server.close() returns a promise - another incorrect type 
        await closeFtpServer(); 
        }, 
    };   
}; 

function parseFile(file) {
    
    // Verifica que el archivo recibido sea de texto
    const fileBuffer = fs.readFileSync(file);
    if(isText(file, fileBuffer))
    {
        // Parsea el archivo
        const results = [];
        fs.createReadStream(file).pipe(csv({ headers: false }))
            .on('data', (data) => {
                // Verifica que el primer valor sea una fecha valida
                if(moment(data[0], moment.ISO_8601).isValid())
                    results.push(data);
            })
            .on('end', async () => {
                // Carga los datos en sensores VwsgPipe3
                console.log(dayTime.getUtcString() + `\x1b[33mFtpServer: File parsed | ${path.basename(file)} -> ${results.length} valid entries\x1b[0m`); 
                if(results.length > 0)
                    await VwsgPipe3.LoadFromParsedData(ConnectionType.Campbell, path.basename(file), results);
                deleteFile(file);
            });
    }
    else {
        console.log(dayTime.getUtcString() + `\x1b[33mFtpServer: Parsing omitted -> ${path.basename(file)} is not a text file\x1b[0m`); 
        deleteFile(file);
    }
    
};

function deleteFile(file) {
    // Elimina el archivo
    fs.unlink(file, (error) => {
        if (error) {
            console.log(dayTime.getUtcString() + `\x1b[33mFtpServer: Error deleting file ${path.basename(file)} | Error -> ${error}\x1b[0m`); 
        return
        }
        console.log(dayTime.getUtcString() + `\x1b[33mFtpServer: File deleted | ${path.basename(file)}\x1b[0m`); 
    });
}




