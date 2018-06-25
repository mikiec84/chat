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
    ) {
        this.userForm = this.formBuilder.group({
            id: [''],
            username: ['']
        });
        this.urlFormControl = new FormControl('');
    }

    public userForm: FormGroup;
    public urlFormControl: FormControl;

    ngOnInit() {
        const user = this.userProvider.getUser();
        this.userForm.controls.id.setValue(user.id);
        this.userForm.controls.username.setValue(user.username);

        this.urlFormControl.setValue(
            !!localStorage.url ? localStorage.url : 'https://websocket-chat.pp.ua/'
        );
    }

    public saveCredentials() {
        this.userProvider.updateUser(this.userForm.value);
    }

    public saveUrl() {
        localStorage.setItem('url', this.urlFormControl.value);
    }

}
