var logger = require('winston'),
    redis = require('redis'),
    nconf = require('nconf'),
    jwt = require('jsonwebtoken'),
    controller = require('./controller');

var createRedisClient =
    () => redis.createClient(nconf.get('REDIS_PORT'), nconf.get('REDIS_HOST'));

var redisPublisher = createRedisClient();

module.exports = function (conn) {
    var rpc = {}, userData, redisSubscriber;

    rpc.authenticate = function (data) {
        if (!data.token) {
            conn.close(403, 'Invalid token');
        }
        try {
            authenticateUser(jwt.verify(data.token, nconf.get('JWT_SECRET')));
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
            logger.error(['Unknown rpc method'.red, msg.method]);
        }
    });

    conn.on('close', () => {
        if (redisSubscriber) {
            redisSubscriber.quit();
        }
    });
};