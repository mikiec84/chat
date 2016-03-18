var mongoose = require('mongoose'),
    constants = require('../helpers/constants');

var options = {
    discriminatorKey: 'type',
    versionKey: false,
    collection: 'message'
};

var MessageSchema = new mongoose.Schema({
    room: String,
    createdAt: Date
}, options);

var Message = mongoose.model('Message', MessageSchema);

var TextMessage = Message.discriminator(constants.messageTypes.TEXT, new mongoose.Schema({
    text: { type: String, trim: true },
    updatedAt: Date,
    deletedAt: Date,
    userId: String,
    readed: Boolean
}, options));

var ImageMessage = Message.discriminator(constants.messageTypes.IMAGE, new mongoose.Schema({
    imageUrl: { type: String, trim: true },
    updatedAt: Date,
    deletedAt: Date,
    userId: String,
    readed: Boolean
}, options));

var ExitMessage = Message.discriminator(constants.messageTypes.EXIT, new mongoose.Schema({
    userId: String
}, options));

var KickMessage = Message.discriminator(constants.messageTypes.KICK, new mongoose.Schema({
    kicking: String, //user who kick
    kicked: String // kicked user
}, options));

module.exports = {
    TextMessage: TextMessage,
    ImageMessage: ImageMessage,
    KickMessage: KickMessage,
    ExitMessage: ExitMessage
};

//
//var TextMessageRepository = {
//    getUnreadMessagesCountInRoom(room, userId, date) {
//        return TextMessage.count({
//            'room': room,
//            'userId': {
//                '$ne': parseInt(userId)
//            },
//            'createdAt': {
//                '$gte': date
//            }
//        })
//    },
//    updateReadedMessages(room, userId, date) {
//        return TextMessage.update(
//            {
//                'room': room,
//                'readed': {
//                    '$ne': true
//                },
//                'userId': {
//                    '$ne': userId
//                },
//                'createdAt': {
//                    '$lt': date
//                }
//            },
//            {
//                '$set': {
//                    'readed': true
//                }
//            },
//            {
//                'multi': true
//            }
//        )
//    }
//};
