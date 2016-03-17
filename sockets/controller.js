var modelChat = require('../models/chat'),
    logger = require('winston'),
    constants = require('../helpers/constants');

var userChannel = (id) => 'user:' + id;

var sendMessage = (redisPublisher, message, mongoMessage) => {
    var socketMessage = {
        method: 'message',
        args: [message]
    };

    modelChat.Chat
        .findOne({_id: mongoMessage.room}).exec()
        .then((data) => {
            if (!data) {
                throw new Error(`Room ${mongoMessage.room} not found`)
            }
            var messagePromise = mongoMessage.save();

            return [messagePromise, data];
        })
        .spread((messagePromise, room) => {
            room.lastUpdatedAt = new Date();
            room.chatUsers
                .filter(x => x.status == constants.chatStatuses.ACTIVE)
                .forEach(function (entry) {
                    if (entry.userId != message.userId) {
                        entry.unreadCount += 1;
                    }

                    redisPublisher.publish(userChannel(entry.userId), JSON.stringify(socketMessage));
                });

            return room.save();
        })
        .then(data => logger.info(`${data.id} sent to room ${data.room}`))
        .catch(logger.error);
};

module.exports = function (redisPublisher, userData) {
    return {
        message: (data) => {
            if (!text || !room) {
                debug(['invalid parameters text or room'.red, text, room]);
                return;
            }

            var message = {
                avatar: clientSocket.avatar,
                created_at: new Date(),
                room: room,
                user_id: clientSocket.user_id,
                name: clientSocket.username,
                client_id: id,
                type: modelMessage.types.TEXT,
                text: stripTags(text)
            };

            sendMessage(message, new modelMessage.TextMessage(message));
        }
    }
};