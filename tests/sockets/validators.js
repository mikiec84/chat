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
        var emptyText = {
            'room': '56e944a27db4c671afd4d375',
            'text': ''
        };
        validator.validateTextMessage(emptyText).should.eql(false);

        var emptyRoom = {
            'room': '',
            'text': 'hello'
        };
        validator.validateTextMessage(emptyRoom).should.eql(false);
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
        var emptyUrl = {
            'room': '56e944a27db4c671afd4d375',
            'url': ''
        };
        validator.validateImageMessage(emptyUrl).should.eql(false);

        var emptyRoom = {
            'room': '',
            'url': 'http://vk.com/example.jpg'
        };
        validator.validateImageMessage(emptyRoom).should.eql(false);
    });
});

describe('validateImageMessage', () => {
    it('should be valid', () => {
        var valid = {
            'id': '56e944a27db4c671afd4d375',
            'text': 'hello'
        };
        validator.validateEditMessage(valid).should.eql(true);
    });

    it('should be invalid', () => {
        var emptyText = {
            'id': '56e944a27db4c671afd4d375',
            'text': ''
        };
        validator.validateEditMessage(emptyText).should.eql(false);

        var emptyRoom = {
            'room': '',
            'text': 'hello'
        };
        validator.validateEditMessage(emptyRoom).should.eql(false);
    });
});