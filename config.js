var mongoose = require('mongoose'),
    nconf = require('nconf'),
    logger = require('winston');

nconf
    .argv()
    .env()
    .file({file: './config.json'})
    .defaults({
        "SERVER_PORT": "8080",
        "DATABASE_HOST": "db",
        "DATABASE_PORT": 27017,
        "DATABASE_USER": "root",
        "DATABASE_PASSWORD": "app",
        "DATABASE_DB": "chat",
        "DATABASE_AUTH_DB": "admin",
        "REDIS_HOST": "redis",
        "REDIS_PORT": 6379,
        "JWT_SECRET": "secret",
        "LOG_LEVEL": "debug"
    });

logger.level = nconf.get('LOG_LEVEL');
mongoose.Promise = require('bluebird');

var mongoUrl = `mongodb://${nconf.get('DATABASE_USER')}:${nconf.get('DATABASE_PASSWORD')}@${nconf.get('DATABASE_HOST')}:${nconf.get('DATABASE_PORT')}/${nconf.get('DATABASE_DB')}?authSource=${nconf.get('DATABASE_AUTH_DB')}`;

module.exports = {
    mongoUrl: mongoUrl,
    jwtSecret: nconf.get('JWT_SECRET'),
    serverPort: nconf.get('SERVER_PORT'),
    redisPort: nconf.get('REDIS_PORT'),
    redisHost: nconf.get('REDIS_HOST')
};