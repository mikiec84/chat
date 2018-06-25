const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const WebsocketChatService = require('./services/websocket-chat/websocket-chat.service');

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (req, res) => {
    res.send('<h1>Websockets chat</h1>');
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});

const ws = new WebsocketChatService(io);
