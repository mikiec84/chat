function SocketChat(chatUrl, token) {
    var sockjs = initSock();
    var that = this;
    var connected = false;
    var connectable = true;

    var listeners = {
        'connected': [],
        'break': [],
        'recover': [],
        'auth_error': []
    };

    this.addListener = function (type, listener) {
        if (Object.keys(listeners).indexOf(type) == -1) {
            listeners[type] = [];
        }
        listeners[type].push(listener);
    };

    function dispatch(event, data) {
        if (Object.keys(listeners).indexOf(event) != -1) {
            listeners[event].forEach(function(listener) {
                listener(data);
            })
        }
    }

    this.isConnected = function () {
        return connected;
    };

    this.addListener('auth_error', function () {
        connectable = false;
    });

    this.reconnect = function () {
        if (connectable) {
            sockjs = initSock();
        }
    };

    this.tryConnect = function () {
        setTimeout(function () {
            that.reconnect();
        }, 5000)
    };

    var pingInterval;
    this.refreshPing = function () {
        if (pingInterval) {
            clearInterval(pingInterval);
        }

        var ticker = function() {
            sockjs.send(JSON.stringify({
                method: 'ping',
                args: []
            }));
        };
        var intervalTime = 540000;
        pingInterval = setInterval(ticker, intervalTime);
    };

    this.sendedMessages = {};

    this.refreshPing();

    this.sendObject = function (obj) {
        that.refreshPing();
        console.log(obj);
        sockjs.send(JSON.stringify(obj));
    };

    this.sendMessage = function (text, activeRoom) {
        var identifier = generateRandomIdentifier();
        that.sendedMessages[identifier] = {
            type: 'text',
            room: activeRoom,
            text: text
        };

        this.sendObject({
            method: 'message',
            args: [text, activeRoom, identifier]
        });

        setTimeout(function () {
            if (that.sendedMessages[identifier]) {
                that.connected = false;
            }
            showHideConnecting();
        }, 3000);
        $('#send-message').attr('data-sended', identifier)
    };

    this.addListener('auth_error', function () {
        connectable = false;
    });

    function initSock() {
        var result = new SockJS(chatUrl);

        result.onopen = function () {

            that.sendObject({
                method: 'authenticate',
                arg: {
                    token: token
                }
            });
        };

        result.onclose = function (e) {
            that.connected = false;
            that.tryConnect();
        };

        result.onmessage = function (e) {
            var msg = JSON.parse(e.data);
            that.connected = true;
            dispatch(msg.method)
        };

        return result;
    }
}

var chat = new SocketChat('http://localhost:8080/chat', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjEiLCJ1c2VybmFtZSI6InVzZXIxIiwicGFzc3dvcmQiOiJ1c2VyMSIsImF2YXRhciI6Imh0dHBzOi8vYXZhdGFyczEuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3UvMTA2MjUyMD92PTMmcz0yMDAiLCJmaXJzdE5hbWUiOiJKb2huIiwibGFzdE5hbWUiOiJEb2UiLCJpYXQiOjE0NTgyMTI1NTMsImV4cCI6MTQ1ODIzMDU1M30.qNWcpySmcDYEUOVYm9fUOJaqM5WSiT8zVFO9mm5Is4g');

chat.addListener('message', function (data) {
    console.log('message');
    console.log(data);
});

var rpc = {
    message: function (data) {
        delete that.sendedMessages[data.client_id];
        showHideConnecting();
        var sendMessageButton = $('#send-message');
        if (sendMessageButton.attr('data-sended') == data.client_id) {
            sendMessageButton.removeClass('disabled').removeAttr('data-sended');
            $('.upload-for-sidebar-chat').removeClass('disabled');
            if (data.text) {
                $('.send-post textarea').val('');
            } else {
                $('.send-post #chat-image-url').val('');
            }
        }

        if (activeRoom != data.room) {
            addMessageToNotifications(data);
        }
        addMessage(data, false, false);
        if (messageStorage[data.room]) {
            messageStorage[data.room].unshift(data);
        } else {
            messageStorage[data.room] = [data];
        }
        var roomBlock = $('.first-chat[data-room="' + data.room + '"]');
        if (roomBlock.hasClass('leaved')) {
            roomBlock.removeClass('leaved');
        }
    },
    edit_message: function (data) {
        changeMessageInNotifications(data);
        if (messageStorage[data.room]) {
            $.each(messageStorage[data.room], function (key, value) {
                if (value.id == data.id) {
                    value.text = data.text;
                }
            });
        }
        $('.message-text[data-id="' + data.id + '"]').html(data.text);
        $('.chat-message[data-id="' + data.id + '"] .text').html(data.text);
    },
    delete_message: function (data) {
        deleteMessageInNotifications(data);
        if (messageStorage[data.room]) {
            $.each(messageStorage[data.room], function (key, value) {
                if (value.id == data.id) {
                    value.text = data.text;
                }
            });
        }
        var messageDeletedText = 'Message was deleted';
        $('.message-text[data-id="' + data.id + '"]').html(messageDeletedText);
        $('.chat-message[data-id="' + data.id + '"] .text').html(messageDeletedText);
    },
    delete_chat: function (data) {
        $('.first-chat[data-room="' + data.room + '"]').remove();
    },
    exit_chat: function (data) {
        $('.first-chat[data-room="' + data.room + '"]').addClass('leaved');
    },
    kick_user: function (data) {
        $('.first-chat[data-room="' + data.room + '"]')
            .addClass('leaved')
            .find('.leaved-chat-alert')
            .html(data.kicking_name + ' kicked you out!');
    },
    read_message: function (room, date) {
        date = new Date(date);
        $.each(messageStorage[room], function (index, value) {
            if (date > new Date(value.created_at)) {
                value.readed = true;
            }
        });
        if (activeRoom == room) {
            activateChat(room);
        }
    }
};
