var logger = require('winston'),
    redis = require('redis'),
    nconf = require('nconf');

var createRedisClient =
    () => redis.createClient(nconf.get('REDIS_PORT'), nconf.get('REDIS_HOST'));

var redisPublisher = createRedisClient();

module.exports = function (conn) {
    var subscriberRedis;
    var createRedisSubscriber = () => {
        subscriberRedis = createRedisClient();
        subscriberRedis.subscribe.apply(subscriberRedis, [clientSocket.channel()]);
        debug(['subscriberRedis:'.yellow, 'subscribe channel: ' + clientSocket.channel()]);

        subscriberRedis.on('message', function (channel, message) {
            clientSocket.connection.write(message);

            debug(['message:'.yellow, ', message: ' + message]);
        });
    };

    var publishToChat = (chat, message) => {
        chat.chatUsers
            .filter(entry => entry.status == modelChat.statuses.ACTIVE)
            .forEach(entry => clientRedis.publish(userChannel(entry.userId), JSON.stringify(message)))
    };

    var exitMessage = (chatId, chatUser) => {
        return {
            created_at: new Date(),
            room: chatId,
            userId: clientSocket.user_id,
            type: modelMessage.types.EXIT,
            name: fullName(chatUser)
        };
    };

    var sendMessage = (message, mongoMessage) => {
        var socketMessage = {
            method: 'message',
            args: [message]
        };

        modelChat.Chat.findOne({ _id: mongoMessage.room }).exec().then((data) => {
            if (!data) {
                throw new Error(`Room ${mongoMessage.room} not found`)
            }
            var messagePromise = mongoMessage.save();

            return [messagePromise, data];
        }).spread((messagePromise, room) => {
            message.chat_type = data.type;
            room.lastUpdatedAt = new Date();
            room.chatUsers
                .filter(x => x.status != modelChat.statuses.ACTIVE)
                .forEach(function (entry) {
                    if (entry.userId != clientSocket.user_id) {
                        entry.unreadCount += 1;
                    }

                    if (entry.lastReadAt) {
                        message.notification = 'chats_with_new_messages';
                    } else if (data.requests && data.requests.length > 0) {
                        message.notification = 'new_requests';
                    } else {
                        message.notification = 'new_chats';
                    }

                    clientRedis.publish(userChannel(entry.userId), JSON.stringify(socketMessage));
                });

            return room.save();
        }).then(
            data => debug(['send:'.yellow, `${data.id} sent to room ${data.room}`])
        ).catch(logError);
    };

    var rpc = {
        message: (text, room, id) => {
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
        },
        image: (url, room, id) => {
            if (!url || !room) {
                debug(['invalid parameters url or room'.red, text, room]);
                return;
            }

            var message = {
                avatar: clientSocket.avatar,
                created_at: new Date(),
                room: room,
                user_id: clientSocket.user_id,
                name: clientSocket.username,
                client_id: id,
                type: modelMessage.types.IMAGE,
                url: url
            };

            sendMessage(message, new modelMessage.ImageMessage(message));
        },
        edit_message: (messageId, text, url) => {
            modelMessage.TextMessage.findOne({_id: messageId, user_id: clientSocket.user_id}).exec()
                .then((data) => {
                    if (!data || data.devared_at) {
                        throw new Error('message not found');
                    }

                    //if it's older than 30 minutes
                    if (data.created_at.getTime() + 60000 * 30 < (new Date()).getTime()) {
                        throw new Error('you cannot edit message older than 30 minutes');
                    }

                    data.text = stripTags(text);
                    data.updatedAt = new Date();

                    return [modelChat.Chat.findOne({_id: data.room}).exec(), data.save()];
                })
                .spread((chat, message) => {
                    var redisMessage = {
                        id: message._id,
                        text: message.text,
                        avatar: clientSocket.avatar,
                        created_at: message.createdAt,
                        edited_at: message.updatedAt,
                        room: message.room,
                        user_id: clientSocket.user_id,
                        name: clientSocket.username
                    };

                    var socketMessage = {
                        method: 'edit_message',
                        args: [redisMessage]
                    };

                    publishToChat(chat, socketMessage);
                })
                .catch(logError)
        },
        devare_message: (messageId) => {
            modelMessage.TextMessage.findOne({_id: messageId, user_id: clientSocket.user_id}).exec()
                .then((data) => {
                    if (!data) {
                        throw new Error('message not found');
                    }

                    //if it's older than 30 minutes
                    if (data.createdAt.getTime() + 60000 * 30 < (new Date()).getTime()) {
                        throw new Error('you cannot devare message older than 30 minutes');
                    }

                    data.devaredAt = new Date();

                    return [modelChat.Chat.findOne({_id: data.room}).exec(), data.save()];
                })
                .spread((chat, message) => {
                    var socketMessage = {
                        method: 'devare_message',
                        args: [
                            {
                                id: message._id,
                                avatar: clientSocket.avatar,
                                created_at: message.createdAt,
                                room: message.room,
                                devared_at: message.devaredAt,
                                user_id: clientSocket.user_id,
                                name: clientSocket.username
                            }
                        ]
                    };

                    chat.chatUsers.forEach(
                        entry => clientRedis.publish(userChannel(entry.userId), JSON.stringify(socketMessage))
                    )
                })
                .catch(logError)
        },
        exit_chat: (chatId) => {
            modelChat.Chat.findOne({"_id": chatId, "chatUsers.userId": clientSocket.user_id}).exec()
                .then((data) => {
                    if (!data) {
                        throw new Error('chat ' + chatId + ' for user ' + clientSocket.user_id + ' not found');
                    }
                    var chatUser = data.chatUsers.find(chatUser => chatUser.userId == clientSocket.user_id);
                    if (chatUser.status != modelChat.statuses.ACTIVE) {
                        throw new Error('chat ' + chatId + ' for user ' + chatUser.user_id + ' is not active');
                    }

                    chatUser.status = modelChat.statuses.EXITED;
                    chatUser.unreadCount = 0;
                    chatUser.intervals[chatUser.intervals.length - 1].to = new Date();

                    var message = exitMessage(chatId, chatUser);

                    return [data.save(), (new modelMessage.ExitMessage(message)).save(), message];
                })
                .spread((chat, savedMessage, message) => {
                    message.id = savedMessage._id;

                    publishToChat(chat, {
                        method: 'message',
                        args: [message]
                    });

                    clientRedis.publish(userChannel(clientSocket.user_id), JSON.stringify({
                        method: 'exit_chat',
                        args: [message]
                    }));
                })
                .catch(logError)
        },
        devare_chat: (chatId) => {
            modelChat.Chat.findOne({"_id": chatId, "chatUsers.userId": clientSocket.user_id}).exec()
                .then((data) => {
                    if (!data) {
                        throw new Error('chat ' + chatId + ' for user ' + clientSocket.user_id + ' not found');
                    }
                    var chatUser = data.chatUsers.find(chatUser => chatUser.userId == clientSocket.user_id);
                    if (chatUser.status == modelChat.statuses.DEvarED) {
                        throw new Error('chat ' + chatId + ' for user ' + chatUser.user_id + ' already devared');
                    }

                    var messageData = exitMessage(chatId, chatUser);
                    var message = null;
                    if (chatUser.status == modelChat.statuses.ACTIVE) {
                        message = (new modelMessage.ExitMessage(messageData)).save();
                    }

                    chatUser.status = modelChat.statuses.DEvarED;
                    chatUser.unreadCount = 0;
                    chatUser.intervals = [];

                    return [data.save(), message, messageData];
                })
                .spread((chat, savedMessage, message) => {
                    if (savedMessage) {
                        message.id = savedMessage._id;
                        publishToChat(chat, {
                            method: 'message',
                            args: [message]
                        });
                    }

                    clientRedis.publish(userChannel(clientSocket.user_id), JSON.stringify({
                        method: 'devare_chat',
                        args: [message]
                    }))
                })
                .catch(logError)
        },
        kick_user: (chatId, userId) => {
            modelChat.Chat.findOne({"_id": chatId, "owner_id": clientSocket.user_id, "chatUsers.userId": userId}).exec()
                .then((data) => {
                    if (!data) {
                        throw new Error('chat ' + chatId + ' for user ' + userId + ' not found');
                    }
                    var chatUser = data.chatUsers.find(chatUser => chatUser.userId == userId);
                    if (chatUser.status != modelChat.statuses.ACTIVE) {
                        throw new Error('chat ' + chatId + ' for user ' + userId + ' is not active');
                    }

                    chatUser.status = modelChat.statuses.KICKED;
                    chatUser.unreadCount = 0;
                    chatUser.intervals[chatUser.intervals.length - 1].to = new Date();

                    var message = {
                        "created_at": new Date(),
                        "room": chatId,
                        "kicked": userId,
                        "kicked_name": fullName(chatUser),
                        "kicking": clientSocket.user_id,
                        "type": modelMessage.types.KICK,
                        "kicking_name": fullName(data.chatUsers.find(chatUser => chatUser.userId == clientSocket.user_id))
                    };

                    return [data.save(), (new modelMessage.KickMessage(message)).save(), message];
                })
                .spread((chat, savedMessage, message) => {
                    message.id = savedMessage._id;

                    publishToChat(chat, {
                        method: 'message',
                        args: [message]
                    });

                    clientRedis.publish(userChannel(message.kicked), JSON.stringify({
                        method: 'kick_user',
                        args: [message]
                    }));
                })
                .catch(logError)
        },
        set_user: (userData) => {
            if (!userData.username || !userData.user_id) {
                clientSocket.connection.close(403, 'You have insufficient data');

                return false;
            }

            clientSocket.username = userData.username;
            clientSocket.avatar = userData.avatar;
            clientSocket.user_id = userData.user_id;

            createRedisSubscriber();
        },
        read_all: (room, date) => {
            date = new Date(date);
            modelMessage.TextMessageRepository.getUnreadMessagesCountInRoom(room, clientSocket.user_id, date).exec()
                .then((data) => {
                    return modelChat.Chat.findOneAndUpdate(
                        {_id: room, 'chatUsers.userId': parseInt(clientSocket.user_id)},
                        {$set: {'chatUsers.$.unreadCount': data, 'chatUsers.$.lastReadAt': date}}
                    )
                })
                .then((data) => {
                    if (!data) {
                        throw new Error('room ' + room + ' for user ' + clientSocket.user_id + ' not found');
                    }
                    if (data.type == modelChat.types.PRIVATE) {
                        var opponentId = data.chatUsers
                            .filter((data) => data.userId != clientSocket.user_id)
                            .pop().userId;

                        clientRedis.publish(userChannel(opponentId), JSON.stringify({
                            method: 'read_message',
                            args: [room, date]
                        }));

                        return modelMessage.TextMessageRepository.updateReadedMessages(data.id, parseInt(clientSocket.user_id), date).exec();
                    }
                }).then((data) => {
                if (!data) {
                    debug(['all messsages in room are readed'.green, 'room: ' + room, 'user: ' + clientSocket.user_id]);
                } else {
                    debug([(data.nModified + ' messsages in room are readed').green, 'room: ' + room, 'user: ' + clientSocket.user_id]);
                }
            }).catch(logError);
        },
        ping: function () {
            debug(['ping user:', clientSocket.user_id]);
        }
    };

    logger.info('New socket connection');

    conn.on('data', message => {
        logger.info(message);
    });

    conn.on('close', () => {
        logger.info('close');
    });
};