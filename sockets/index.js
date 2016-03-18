var logger = require('winston'),
    redis = require('redis'),
    config = require('../config'),
    jwt = require('jsonwebtoken'),
    controller = require('./controller');

var createRedisClient =
    () => redis.createClient(config.redisPort, config.redisHost);

var redisPublisher = createRedisClient();
module.exports = function (conn) {
    var rpc = {}, userData, redisSubscriber;

    rpc.authenticate = function (data) {
        if (!data.token) {
            conn.close(403, 'Invalid token');
        }
        try {
            authenticateUser(jwt.verify(data.token, config.jwtSecret));
        } catch(err) {
            conn.close(403, 'Invalid token');
        }
    };

    function authenticateUser(data) {
        userData = data;
        redisSubscriber = createRedisClient();
        logger.info('User ' + userData.username + ' is authenticated');
        redisSubscriber.subscribe.apply(redisSubscriber, ['user:' + userData.id]);

        redisSubscriber.on('message', function (channel, message) {
            conn.write(message);
        });

        Object.assign(rpc, controller(redisPublisher, userData));
    }

    conn.on('data', message => {
        var msg = JSON.parse(message);
        if (rpc[msg.method]) {
            rpc[msg.method](msg.arg);
        } else {
            logger.warn(`Unknown rpc method${msg.method}`);
        }
    });

    conn.on('close', () => {
        if (redisSubscriber) {
            redisSubscriber.quit();
        }
    });
};