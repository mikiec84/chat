var express = require('express'),
    sockjs = require('sockjs'),
    mongoose = require('mongoose'),
    app = express(),
    bodyParser = require('body-parser'),
    config = require('./config'),
    logger = require('winston'),
    chatController = require('./sockets/index'),
    expressJwt = require('express-jwt'),
    controllers = require('./controllers');

mongoose.connect(config.mongoUrl);
mongoose.connection.on('open', function () {
    logger.info('mongoose connected: ', config.mongoUrl);
});

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/api', expressJwt({secret: config.jwtSecret}));
app.use(controllers);

var server = app.listen(config.serverPort, function () {
    logger.info('Listening on port ' + config.serverPort)
});

var service = sockjs.createServer();
service.installHandlers(server, {prefix: '/chat'});
service.on('connection', chatController);