import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { UserProvider, User } from '@providers/user/user';
import { Subscription } from 'rxjs';

@Component({
    selector: 'page-chat-list',
    templateUrl: 'chat-list.html'
})
export class ChatListPage {
    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private userProvider: UserProvider
    ) {
        this.usersSubscription = this.userProvider.activeUsers.subscribe(users => {
            this.users = users;
        });
    }

    public users: Array<User> = [];
    private usersSubscription: Subscription;

    public chatWith(user: User) {
        this.navCtrl.push('chat-page', user);
    }

    ionViewWillLeave() {
        this.usersSubscription && this.usersSubscription.unsubscribe();
    }
}
