var mongoose = require('mongoose');
var constants = require('../helpers/constants');
var Schema = mongoose.Schema;

var ModelInterval = new Schema({
    from: Date,
    to: Date
});

var ModelChatUsers = new Schema({
    'id': String,
    'username': String,
    'avatar': String,
    'firstName': String,
    'lastName': String,
    'status': String,
    'intervals': [ModelInterval],
    'unreadCount': Number,
    'lastReadAt': Date
});

var ModelChat = new Schema({
    type: String,
    createdAt: Date,
    lastMessageAt: Date,
    ownerId: String,
    chatUsers: [ModelChatUsers]
}, {
    versionKey: false,
    collection: 'chat'
});

ModelChat.methods.findChatByUserAndMessage = function(id, userId) {
    return this.model('Chat').findOne({
        '_id': id,
        'chatUsers': {
            '$elemMatch': {
                'chatUsers.userId': userId,
                'chatUsers.status': constants.chatStatuses.ACTIVE
            }
        }
    })
};

module.exports = {
    Chat: mongoose.model('Chat', ModelChat)
};
