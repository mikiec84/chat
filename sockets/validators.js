var Validator = require('jsonschema').Validator;

var textMessageSchema = {
    id: '/TextMessage',
    type: 'object',
    properties: {
        'room': { 'type': 'string', 'minLength':1 },
        'text': { 'type': 'string', 'minLength':1 },
        'clientId': { 'type': 'string' }
    },
    'required': ['room', 'text']
};

var imageMessageSchema = {
    id: '/ImageMessage',
    type: 'object',
    properties: {
        'room': { 'type': 'string', 'minLength':1 },
        'url': { 'type': 'string', 'pattern': /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/ },
        'clientId': { 'type': 'string' }
    },
    'required': ['room', 'url']
};

module.exports = {
    validateTextMessage: (message) => {
        var v = new Validator();

        return v.validate(message, textMessageSchema).errors.length == 0;
    },
    validateImageMessage: (message) => {
        var v = new Validator();

        return v.validate(message, imageMessageSchema).errors.length == 0;
    }
};