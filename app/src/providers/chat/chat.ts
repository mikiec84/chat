import { Injectable } from '@angular/core';
import { WebsocketProvider } from '@providers/websocket/websocket';
import { UserProvider, User } from '@providers/user/user';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ChatProvider {

    public readonly publicChatMessages = new BehaviorSubject<any>(null);
    public currentRoomId: string;
    private messagesHistory = {
        public: [],
        private: {}
    };

    constructor(
        private websocketProvider: WebsocketProvider,
        private userProvider: UserProvider,
    ) {
        this.websocketProvider.onEvent('public-chat-updated')
        .subscribe((chatMessage) => {
            this.publicChatMessages.next(chatMessage);
        });
    }

    public sendMessage(messageText: string, receiverId?: string) {
        const user = this.userProvider.getUser();
        this.websocketProvider.emitEvent('chat-message', {
            text: messageText,
            senderId: user.id,
            time: Date.now(),
            username: user.username
        });
    }

    public joinRoom(roomId: string) {
        this.currentRoomId = roomId;
        this.websocketProvider.emitEvent('join-room', roomId);
    }

    public leaveRoom(roomId: string) {
        this.currentRoomId = null;
        this.websocketProvider.emitEvent('leave-room', roomId);
    }

    public getRoomId(user1: User, user2: User) {
        if (
            Number(user1.id.replace('-', '')) > Number(user2.id.replace('-', ''))
        ) {
            return user1.username + user1.id + '' + user2.username + user2.id;
        } else {
            return user2.username + user2.id + '' + user1.username + user1.id;
        }
    }

    public saveMessages(messages: Array<any>) {
        if (this.currentRoomId) {
            this.saveMessageInRoom(messages, this.currentRoomId);
        } else {
            this.messagesHistory.public = [...messages];
        }
    }

    private saveMessageInRoom(messages: Array<any>, roomId: string) {
        if (!this.messagesHistory.private[roomId]) {
            this.messagesHistory.private[roomId] = [];
        }
        this.messagesHistory.private[roomId] = [...messages];
    }

    public getMessagesHistory(roomId?: string) {
        return roomId ? this.messagesHistory.private[roomId] : this.messagesHistory.public;
    }
}
