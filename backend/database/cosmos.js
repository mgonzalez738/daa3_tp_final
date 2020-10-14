// CosmosDb connection string and options

exports.DbName = "CosmosDb";
exports.DbConnectionString = "mongodb://"+process.env.COSMO_DB_HOST+":"+process.env.COSMO_DB_PORT+"/"+process.env.COSMO_DB_NAME+"?ssl=true&replicaSet=globaldb";
exports.DbConnectionOptions = {
    auth: {
        user: process.env.COSMO_DB_USER,
        password: process.env.COSMO_DB_PASSWORD
    },
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    retryWrites: false
};
        