const { Log } = require('../models/logModel');
const { Configuration } = require('../models/configurationModel');

const Levels = {
    Trace: { Text: 'Trace', Value: 100 },
    Debug: { Text: 'Debug', Value: 200 },
    Info: { Text: 'Info', Value: 300 },
    Warning: { Text: 'Warning', Value: 400 },
    Error: { Text: 'Error', Value: 500 },
    Fatal: { Text: 'Fatal', Value:600 }
}

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}

GetUtcString = (date) => {
    var formatted_date = date.getDate().pad(2) + "/" + (date.getMonth() + 1).pad(2) + "/" +  date.getFullYear() + " " + date.getHours().pad(2) + ":" + date.getMinutes().pad(2) + ":" + date.getSeconds().pad(2);
    return "[" + formatted_date + "]";
}

class Logger {
    constructor() {
        this.level = Levels.Debug;
        this.DbConnected = false;
    }

    async SetLevel(level) {
        if(Levels[level.Text] == null)
            throw(new Error(`Unknown logger level ${level}`));
        try {
            let configuration = await Configuration.findOne();
            configuration.LoggerLevel = level;
            configuration.save();
            this.level = level;
        }
        catch (error) {
            console.log(error);
        }
    }

    GetLevel() {
        return this.level;
    }

    async SetDbConnected(status) {
        if(status == null) {
            throw(new Error(`Unknown status`));
        }
        try {
            if(status) { // Lee Log Level de la BD
                this.DbConnected = true;
                let configuration = await Configuration.findOne();
                if(configuration) {
                    this.level = configuration.LoggerLevel;
                }
                else {
                    configuration = new Configuration();
                    configuration.LoggerLevel = this.level;
                    await configuration.save();
                }
            }
            else {
                this.DbConnected = false;
            }
        }
        catch(error)
        {
            console.log(error);
        }
    }

    async Save(level, process, message, userId, ip, data) {
        if(Levels[level.Text] == null)
            throw(new Error(`Unknown logger level`));
        
        if(level.Value >= this.level.Value) {

            const timestamp = new Date(Date.now());

            // Log a consola
            let logCon = "";
            logCon += GetUtcString(timestamp);
            if(level.Text == 'Trace')
                logCon += "\x1b[34m"; // Blue
            if(level.Text == 'Debug')
                logCon += "\x1b[36m"; // Cyan
            if(level.Text == 'Info')
                logCon += "\x1b[32m"; // Green
            if(level.Text == 'Warning')
                logCon += "\x1b[33m"; // Yellow
            if(level.Text == 'Error')
                logCon += "\x1b[31m"; // Red
            if(level.Text == 'Fatal')
                logCon += "\x1b[35m"; // Nagenta
            logCon += ` [${level.Text}]`;
            logCon += ` ${process} |`;
            logCon += ` ${message}`;
            logCon += "\x1b[0m";
            console.log(logCon);

            // Log a base de datos
            if(this.DbConnected) {
                try {
                    let logDb = new Log();
                    logDb.Timestamp = timestamp;
                    logDb.Level = level.Text;
                    logDb.Process = process;
                    logDb.Message = message;
                    logDb.UserId = userId;
                    logDb.Ip = ip;
                    logDb.Data = data;
                    await logDb.save();
                }
                catch(error)
                {
                    console.log(error);
                }
            }
        }
    }
}

exports.Levels = Levels;
exports.Logger = new Logger();
