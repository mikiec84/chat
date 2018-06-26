import { Component, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { UserProvider } from '@providers/user/user';
import { WebsocketProvider } from '@providers/websocket/websocket';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage implements OnInit {

    constructor(
        public navCtrl: NavController,
        private formBuilder: FormBuilder,
        private userProvider: UserProvider,
        private websocketProvider: WebsocketProvider,
    ) {
        this.userForm = this.formBuilder.group({
            id: [''],
            username: ['']
        });
        this.urlFormControl = new FormControl(this.websocketProvider.getSocketUrl());
    }

    public userForm: FormGroup;
    public urlFormControl: FormControl;

    ngOnInit() {
        const user = this.userProvider.getUser();
        this.userForm.controls.id.setValue(user.id);
        this.userForm.controls.username.setValue(user.username);
    }

    public saveCredentials() {
        this.userProvider.updateUser(this.userForm.value);
    }

    public saveUrl() {
        this.websocketProvider.updateSocketUrl(this.urlFormControl.value);
    }

}
