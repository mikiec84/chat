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

module.exports = {
    validateTextMessage: (message) => {
        var v = new Validator();

        return v.validate(message, textMessageSchema).errors.length == 0;
    }
};