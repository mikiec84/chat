var Validator = require('jsonschema').Validator;

var TextMessageSchema = {
    id: '/TextMessage',
    type: 'object',
    properties: {
        'room': { 'type': 'string', 'minLength':1 },
        'text': { 'type': 'string', 'minLength':1 },
        'clientId': { 'type': 'string' }
    },
    'required': ['room', 'text']
};

var ImageMessageSchema = {
    id: '/ImageMessage',
    type: 'object',
    properties: {
        'room': { 'type': 'string', 'minLength':1 },
        'url': { 'type': 'string', 'pattern': /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/ },
        'clientId': { 'type': 'string' }
    },
    'required': ['room', 'url']
};

var EditMessageSchema = {
    id: '/EditMessage',
    type: 'object',
    properties: {
        'id': { 'type': 'string', 'minLength':1 },
        'text': { 'type': 'string', 'minLength':1 }
    },
    'required': ['id', 'text']
};

module.exports = {
    validateTextMessage: (message) => {
        var v = new Validator();

        return v.validate(message, TextMessageSchema).errors.length == 0;
    },
    validateImageMessage: (message) => {
        var v = new Validator();

        return v.validate(message, ImageMessageSchema).errors.length == 0;
    },
    validateEditMessage: (message) => {
        var v = new Validator();

        return v.validate(message, EditMessageSchema).errors.length == 0;
    }
};