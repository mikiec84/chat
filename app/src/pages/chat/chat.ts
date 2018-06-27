import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { ChatProvider } from '@providers/chat/chat';
import { UserProvider } from '@providers/user/user';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

@IonicPage({
    name: 'chat-page',
})
@Component({
    selector: 'page-chat',
    templateUrl: 'chat.html',
})
export class ChatPage {

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private userProvider: UserProvider,
        private chatProvider: ChatProvider,
        private formBuilder: FormBuilder,
    ) {
        navParams.data.username ? this.isPublicChat = false : this.isPublicChat = true;
        this.chatWithUsername = !this.isPublicChat ? navParams.data.username : 'all';
        this.roomId = !this.isPublicChat ? this.chatProvider.getRoomId(this.userProvider.getUser(), navParams.data) : null;

        if (this.isPublicChat) {
            this.chatProvider.sendMessage('joined this chat');
        } else {
            this.chatProvider.joinRoom(this.roomId);
            this.chatProvider.sendMessage('joined this chat', navParams.data.roomId);
        }

        this.chatMessagesSubscription = this.chatProvider.publicChatMessages.subscribe(message => {
            if (message) {
                this.messages.push(message);
            }
        });

        this.messageForm = this.formBuilder.group({
            messageInput: ['']
        });

        const messagesHistory = this.chatProvider.getMessagesHistory(this.roomId);
        console.log(messagesHistory);

        this.messages = messagesHistory ? messagesHistory : [];
    }

    public chatWithUsername: string;
    public messages: Array<any> = [];
    public isPublicChat: boolean;
    public roomId: string;
    public messageForm: FormGroup;
    private chatMessagesSubscription: Subscription;

    public onSendClick() {
        const message = this.messageForm.controls.messageInput.value;
        if (this.isPublicChat) {
            this.chatProvider.sendMessage(message);
        } else {
            this.chatProvider.sendMessage(message, this.roomId);
        }
        this.messageForm.controls.messageInput.setValue('');
    }

    ionViewWillLeave() {
        this.chatProvider.saveMessages(this.messages);
        this.roomId && this.chatProvider.leaveRoom(this.roomId);
        this.chatMessagesSubscription && this.chatMessagesSubscription.unsubscribe();
    }

}
