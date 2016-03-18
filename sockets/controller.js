var modelChat = require('../models/chat'),
    modelMessage = require('../models/message'),
    logger = require('winston'),
    constants = require('../helpers/constants'),
    validators = require('./validators');

var userChannel = (id) => 'user:' + id;

var stripTags = (str) => str.replace(/<\/?[^>]+>/g, '');

var sendMessage = (redisPublisher, message, mongoMessage) => {
    var socketMessage = {
        method: 'message',
        arg: message
    };

    return modelChat.Chat
        .findOne({
            '_id': message.room,
            'chatUsers': {
                '$elemMatch': {
                    'id': message.userId,
                    'status': constants.chatStatuses.ACTIVE
                }
            }
        }).exec()
        .then((data) => {
            if (!data) {
                throw new Error(`Room ${mongoMessage.room} not found`)
            }
            var messagePromise = mongoMessage.save();

            return [messagePromise, data];
        })
        .spread((messagePromise, room) => {
            socketMessage.arg.id = messagePromise._id;
            room.lastMessageAt = new Date();
            room.chatUsers
                .filter(x => x.status == constants.chatStatuses.ACTIVE)
                .forEach(function (entry) {
                    if (entry.id != message.userId) {
                        entry.unreadCount += 1;
                    }

                    redisPublisher.publish(userChannel(entry.id), JSON.stringify(socketMessage));
                });

            return room.save();
        })
        .then(data => logger.info(`Message ${data.id}: ${message.text}`))
        .catch(error => logger.warn(error.message));
};

module.exports = function (redisPublisher, userData) {
    return {
        message: (data) => {
            if (!validators.validateTextMessage(data)) {
                logger.warn('Message invalid: ', data);
                return;
            }

            var message = {
                avatar: userData.avatar,
                createdAt: new Date(),
                room: data.room,
                userId: userData.id,
                name: userData.username,
                clientId: data.clientId,
                text: stripTags(data.text)
            };

            return sendMessage(redisPublisher, message, new modelMessage.TextMessage(message));
        }
    }
};