import { Injectable } from '@angular/core';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { WebsocketProvider } from '@providers/websocket/websocket';

@Injectable()
export class UserProvider {

    constructor(
        private websocketProvider: WebsocketProvider
    ) {
        if (this.isUserSaved()) {
            this.user = JSON.parse(localStorage.user);
        }
        else {
            let id = `${Date.now()}-${this.getRandomInt(1, 1000)}`;
            let username = 'new-user';
            this.user = { id, username };
            localStorage.setItem('user', JSON.stringify(this.user));
        }

        this.websocketProvider.emitEvent('new-user', this.getUser());

        this.websocketProvider.onEvent('usersList').map((data: Array<User>) => {
            const ownUserIndex = data.findIndex(user => user.id === this.user.id);
            data.splice(ownUserIndex, 1);
            return data;
        }).subscribe((users) => {
            console.log('usersList', users);
            this.activeUsers.next(users);
        });
    }

    private user: User;
    public readonly activeUsers = new BehaviorSubject<Array<User>>([]);

    public getUser(): User {
        return this.user;
    }

    private isUserSaved(): boolean {
        return !!localStorage.user;
    }

    public getRandomInt(min: number, max: number) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    public updateUser(user: User) {
        this.user = user;
        localStorage.setItem('user', JSON.stringify(this.user));
        this.websocketProvider.emitEvent('update-user', this.user);
    }

}

export class User {
    id: string;
    username: string;
}
