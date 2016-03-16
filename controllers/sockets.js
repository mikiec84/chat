var logger = require('winston');

module.exports = function (conn) {
    logger.info('New socket connection');

    conn.on('data', message => {
        logger.info(message);
    });

    conn.on('close', () => {
        logger.info('close');
    });
};