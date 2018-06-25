const WebsocketUserService = require('../websocket-user/websocket-user.service');

class WebsocketChatService {
    constructor(io) {
        this.listenForConnections(io);
        this.wsUserService = new WebsocketUserService();
    }

    listenForConnections(io) {
        io.on('connection', (socket) => {
            console.log('a device connected');
            let userId, roomId;

            socket.on('chat-message', (msg) => {
                if (roomId) {
                    io.to(roomId).emit('public-chat-updated', msg);
                } else {
                    io.emit('public-chat-updated', msg);
                }

            });

            socket.on('new-user', (user) => {
                console.log(`new user with id: ${user.id}`);
                this.wsUserService.addUser(user);
                userId = user.id;
                console.log(this.wsUserService.getUsers());
                io.emit('usersList', this.wsUserService.getUsers());
            });

            socket.on('update-user', (user) => {
                console.log(`update user with id: ${user.id}`);
                this.wsUserService.updateUser(user);
                io.emit('usersList', this.wsUserService.getUsers());
            });

            socket.on('join-room', (roomIdToJoin) => {
                console.log('Join room', roomIdToJoin);
                roomId = roomIdToJoin;
                socket.join(roomIdToJoin);
            });

            socket.on('leave-room', (roomIdToLeave) => {
                console.log('leave room', roomIdToLeave);
                roomId = null;
                socket.leave(roomIdToLeave);
            });

            socket.on('disconnect', () => {
                console.log('device disconnected');
                const id = userId;
                this.wsUserService.removeUser({ id });
                io.emit('usersList', this.wsUserService.getUsers());
            });
        });


    }
}

module.exports = WebsocketChatService;
