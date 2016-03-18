var controller = require('../../sockets/controller'),
    constants = require('../../helpers/constants'),
    users = require('../../models/users'),
    modelChat = require('../../models/chat'),
    modelMessage = require('../../models/message'),
    config = require('../../config'),
    should = require('should');

var clearDB = require('mocha-mongoose')(config.mongoUrl),
    mongoose = require('mongoose');

function RedisPublisherMock() {
    this.messages = {};
    this.publish = (channel, message) => {
        this.messages[channel] = message;
    }
}

function generateChatUser(user, status) {
    return {
        'id': user.id,
        'username': user.username,
        'avatar': user.avatar,
        'firstName': user.firstName,
        'lastName': user.lastName,
        'status': status,
        'intervals': [],
        'unreadCount': 0
    };
}

describe('text message sending', () => {
    beforeEach(function (done) {
        if (mongoose.connection.db) return done();

        mongoose.connect(config.mongoUrl, done);
    });

    context('private chat', () => {
        var publisher = new RedisPublisherMock();
        it('2 participants should receive message', (done) => {
            var sender = users[0],
                receiver = users[1];

            new modelChat.Chat({
                type: constants.chatTypes.PRIVATE,
                createdAt: new Date(),
                chatUsers: [generateChatUser(sender, constants.chatStatuses.ACTIVE), generateChatUser(receiver, constants.chatStatuses.ACTIVE)]
            }).save().then((data) => {
                var socketController = controller(publisher, sender);
                var startDate = new Date();
                socketController.message({
                    room: data._id.toString(),
                    text: 'hello',
                    clientId: 'testid'
                }).then(() => {
                    //2 participants receive message
                    Object.keys(publisher.messages).length.should.eql(2);

                    //messages are equal
                    var values = Object.keys(publisher.messages).map((key) => publisher.messages[key]);
                    new Set(values).size.should.eql(1);
                    var message = JSON.parse(values[0]);

                    //message should be valid json
                    message.method.should.eql('message');
                    message.arg.should.have.property('id');
                    (new Date(message.arg.createdAt) > startDate).should.be.ok;
                    message.arg.avatar.should.eql(sender.avatar);
                    message.arg.room.should.eql(data._id.toString());
                    message.arg.clientId.should.eql('testid');
                    message.arg.userId.should.eql(sender.id);
                    message.arg.text.should.eql('hello');
                    message.arg.name.should.eql(sender.username);
                    message.arg.type.should.eql('text');

                    //message should exists in database and in chat unreadCount and lastMessageAt should be updated
                    modelMessage.TextMessage.findOne({'_id': message.arg.id}).exec().then((data) => {
                        data.should.be.type('object');

                        return modelChat.Chat.findOne({'_id': message.arg.room}).exec();
                    }).then((data) => {
                        data.chatUsers.forEach((entry) => {
                            if (entry.id != message.arg.userId) {
                                entry.unreadCount.should.eql(1);
                            }
                        });
                        (data.lastMessageAt > startDate).should.be.ok;
                        done()
                    });
                })
            });
        });
    });

    context('group chat', () => {
        var publisher = new RedisPublisherMock();
        it('only active users should receive message', (done) => {
            var sender = users[0];

            new modelChat.Chat({
                type: constants.chatTypes.GROUP,
                createdAt: new Date(),
                ownerId: users[1].id,
                chatUsers: [
                    generateChatUser(sender, constants.chatStatuses.ACTIVE),
                    generateChatUser(users[1], constants.chatStatuses.ACTIVE),
                    generateChatUser(users[2], constants.chatStatuses.ACTIVE),
                    generateChatUser(users[3], constants.chatStatuses.DELETED),
                    generateChatUser(users[4], constants.chatStatuses.EXITED),
                    generateChatUser(users[5], constants.chatStatuses.KICKED)
                ]
            }).save().then((data) => {
                var socketController = controller(publisher, sender);
                var startDate = new Date();
                socketController.message({
                    room: data._id.toString(),
                    text: 'hello'
                }).then(() => {
                    //2 participants receive message
                    var keys = Object.keys(publisher.messages);
                    (keys.indexOf(`user:${sender.id}`) >= 0).should.be.ok;
                    (keys.indexOf(`user:${users[1].id}`) >= 0).should.be.ok;
                    (keys.indexOf(`user:${users[2].id}`) >= 0).should.be.ok;
                    keys.length.should.be.eql(3);

                    //messages are equal
                    var values = Object.keys(publisher.messages).map((key) => publisher.messages[key]);
                    new Set(values).size.should.eql(1);
                    var message = JSON.parse(values[0]);

                    //message should exists in database and in chat unreadCount and lastMessageAt should be updated
                    modelMessage.TextMessage.findOne({'_id': message.arg.id}).exec().then((data) => {
                        data.should.be.type('object')

                        return modelChat.Chat.findOne({'_id': message.arg.room}).exec();
                    }).then((data) => {
                        data.chatUsers.forEach((entry) => {
                            if (entry.id != message.arg.userId && entry.status == constants.chatStatuses.ACTIVE) {
                                entry.unreadCount.should.eql(1);
                            } else {
                                entry.unreadCount.should.eql(0);
                            }
                        });
                        (data.lastMessageAt > startDate).should.be.ok;
                        done()
                    });
                })
            });
        });
    });

    var generateMessageShouldNotSendTest = (status) => {
        return (done) => {
            var sender = users[0],
                active = users[1],
                publisher = new RedisPublisherMock();

            new modelChat.Chat({
                type: constants.chatTypes.PRIVATE,
                createdAt: new Date(),
                chatUsers: [
                    generateChatUser(active, constants.chatStatuses.ACTIVE),
                    generateChatUser(sender, status)
                ]
            }).save().then((data) => {
                controller(publisher, sender).message({
                    room: data._id.toString(),
                    text: 'hello'
                }).then(() => {
                    Object.keys(publisher.messages).length.should.be.eql(0);

                    modelMessage.TextMessage.count({}).exec().then((data) => {
                        data.should.eql(0);
                        done();
                    });
                })
            });
        }
    };

    context('inactive user', () => {
        it('message should not send from deleted user', generateMessageShouldNotSendTest(constants.chatStatuses.DELETED));
        it('message should not send from kicked user', generateMessageShouldNotSendTest(constants.chatStatuses.EXITED));
        it('message should not send from exited user', generateMessageShouldNotSendTest(constants.chatStatuses.KICKED));
    });
});

describe('image message sending', () => {
    beforeEach(function (done) {
        if (mongoose.connection.db) return done();

        mongoose.connect(config.mongoUrl, done);
    });

    var publisher = new RedisPublisherMock();
    it('should receive message', (done) => {
        var sender = users[0],
            receiver = users[1];

        new modelChat.Chat({
            type: constants.chatTypes.PRIVATE,
            createdAt: new Date(),
            chatUsers: [generateChatUser(sender, constants.chatStatuses.ACTIVE), generateChatUser(receiver, constants.chatStatuses.ACTIVE)]
        }).save().then((data) => {
            var socketController = controller(publisher, sender);
            var startDate = new Date();
            socketController.image({
                room: data._id.toString(),
                url: 'http://vk.com/example.jpg',
                clientId: 'testid'
            }).then(() => {
                //2 participants receive message
                Object.keys(publisher.messages).length.should.eql(2);

                //messages are equal
                var values = Object.keys(publisher.messages).map((key) => publisher.messages[key]);
                new Set(values).size.should.eql(1);
                var message = JSON.parse(values[0]);

                //message should be valid json
                message.method.should.eql('message');
                message.arg.should.have.property('id');
                (new Date(message.arg.createdAt) > startDate).should.be.ok;
                message.arg.avatar.should.eql(sender.avatar);
                message.arg.room.should.eql(data._id.toString());
                message.arg.clientId.should.eql('testid');
                message.arg.userId.should.eql(sender.id);
                message.arg.url.should.eql('http://vk.com/example.jpg');
                message.arg.name.should.eql(sender.username);
                message.arg.type.should.eql('image');

                //message should exists in database and in chat unreadCount and lastMessageAt should be updated
                modelMessage.ImageMessage.findOne({'_id': message.arg.id}).exec().then((data) => {
                    data.should.be.type('object');

                    return modelChat.Chat.findOne({'_id': message.arg.room}).exec();
                }).then((data) => {
                    data.chatUsers.forEach((entry) => {
                        if (entry.id != message.arg.userId) {
                            entry.unreadCount.should.eql(1);
                        }
                    });
                    (data.lastMessageAt > startDate).should.be.ok;
                    done()
                });
            })
        });
    });
});

describe('edit message', () => {
    beforeEach(function (done) {
        if (mongoose.connection.db) return done();

        mongoose.connect(config.mongoUrl, done);
    });

    it('should receive updating', (done) => {
        var publisher = new RedisPublisherMock();
        var sender = users[0],
            receiver = users[1];

        new modelChat.Chat({
            type: constants.chatTypes.PRIVATE,
            createdAt: new Date(),
            chatUsers: [generateChatUser(sender, constants.chatStatuses.ACTIVE), generateChatUser(receiver, constants.chatStatuses.ACTIVE)]
        }).save().then((data) => {
            return new modelMessage.TextMessage({
                text: 'hello',
                createdAt: new Date(),
                room: data._id.toString(),
                userId: sender.id
            }).save();
        }).then((data) => {
            var socketController = controller(publisher, sender);
            var beforeEdit = new Date();

            socketController.editMessage({
                id: data._id.toString(),
                text: 'edited'
            }).then(() => {
                //2 participants receive message
                Object.keys(publisher.messages).length.should.eql(2);

                //messages are equal
                var values = Object.keys(publisher.messages).map((key) => publisher.messages[key]);
                new Set(values).size.should.eql(1);
                var message = JSON.parse(values[0]);

                //message should be valid json
                message.method.should.eql('editMessage');
                message.arg.should.have.property('id');
                (new Date(message.arg.createdAt) < beforeEdit).should.be.ok;
                (new Date(message.arg.updatedAt) > beforeEdit).should.be.ok;
                message.arg.text.should.eql('edited');

                //message should be edited in database
                modelMessage.TextMessage.findOne({'_id': message.arg.id}).exec().then((data) => {
                    data.text.should.eql('edited');
                    done();
                });
            })
        });
    });


    it('after 30 minutes message should not be updated', (done) => {
        var publisher = new RedisPublisherMock();
        var sender = users[0],
            receiver = users[1];

        new modelChat.Chat({
            type: constants.chatTypes.PRIVATE,
            createdAt: new Date(),
            chatUsers: [generateChatUser(sender, constants.chatStatuses.ACTIVE), generateChatUser(receiver, constants.chatStatuses.ACTIVE)]
        }).save().then((data) => {
            return new modelMessage.TextMessage({
                text: 'hello',
                createdAt: new Date(new Date().getTime() - 1000 * 60 * 60),
                room: data._id.toString(),
                userId: sender.id
            }).save();
        }).then((data) => {
            var socketController = controller(publisher, sender);
            socketController.editMessage({
                id: data._id.toString(),
                text: 'edited'
            }).then(() => {
                Object.keys(publisher.messages).length.should.eql(0);

                //message should be edited in database
                modelMessage.TextMessage.findOne({'_id': data._id.toString()}).exec().then((data) => {
                    data.text.should.eql('hello');
                    done();
                });
            })
        });
    });
});