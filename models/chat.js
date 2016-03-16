var mongoose = require('mongoose');
var constants = require('../helpers/constants');
var Schema = mongoose.Schema;

var ModelInterval = new Schema({
    from: Date,
    to: Date
});

var ModelChatUsers = new Schema({
    'userId': Number,
    'username': String,
    'userAvatar': String,
    'userFirstName': String,
    'userLastName': String,
    'status': String,
    'intervals': [ModelInterval],
    'unreadCount': Number,
    'lastReadAt': Date
});

var ModelChat = new Schema({
    type: String,
    createdAt: Date,
    lastMessageAt: Date,
    ownerId: Number,
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
