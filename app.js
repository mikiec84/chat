var express = require('express'),
    sockjs = require('sockjs'),
    app = express(),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    nconf = require('nconf'),
    logger = require('winston'),
    chatController = require('./sockets/controller'),
    expressJwt = require('express-jwt'),
    controllers = require('./controllers');

nconf.env()
    .file({file: './config.json'});

mongoose.Promise = require('bluebird');
var mongoUrl = `mongodb://${nconf.get('DATABASE_USER')}:${nconf.get('DATABASE_PASSWORD')}@${nconf.get('DATABASE_HOST')}:${nconf.get('DATABASE_PORT')}/${nconf.get('DATABASE_DB')}?authSource=${nconf.get('DATABASE_AUTH_DB')}`;

mongoose.connect(mongoUrl);
mongoose.connection.on('open', function () {
    logger.info('mongoose connected: ', mongoUrl);
});

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var jwtMiddleware = expressJwt({secret: nconf.get('JWT_SECRET')});

app.use('/api', jwtMiddleware);
app.use('/chat', jwtMiddleware);

app.use(controllers);

var port = nconf.get("SERVER_PORT");
var server = app.listen(port, function () {
    logger.info('Listening on port ' + port)
});

var service = sockjs.createServer();
service.installHandlers(server, {prefix: '/chat'});
service.on('connection', chatController);