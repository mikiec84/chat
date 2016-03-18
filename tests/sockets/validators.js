var validator = require('../../sockets/validators'),
    should = require('should');

describe('validateTextMessage', () => {
    it('should be valid', () => {
        var valid = {
            'room': '56e944a27db4c671afd4d375',
            'text': 'hello'
        };
        validator.validateTextMessage(valid).should.eql(true);
    });

    it('should be invalid', () => {
        var emptyRoom = {
            'room': '56e944a27db4c671afd4d375',
            'text': ''
        };
        validator.validateTextMessage(emptyRoom).should.eql(false);

        var emptyText = {
            'room': '',
            'text': 'hello'
        };
        validator.validateTextMessage(emptyText).should.eql(false);
    });
});

describe('validateImageMessage', () => {
    it('should be valid', () => {
        var valid = {
            'room': '56e944a27db4c671afd4d375',
            'url': 'http://vk.com/example.jpg'
        };
        validator.validateImageMessage(valid).should.eql(true);
    });

    it('should be invalid', () => {
        var emptyRoom = {
            'room': '56e944a27db4c671afd4d375',
            'url': ''
        };
        validator.validateImageMessage(emptyRoom).should.eql(false);

        var emptyText = {
            'room': '',
            'url': 'http://vk.com/example.jpg'
        };
        validator.validateImageMessage(emptyText).should.eql(false);
    });
});