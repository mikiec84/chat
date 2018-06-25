import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { MyApp } from './app.component';
import { HomePage } from '@pages/home/home';
import { ChatListPage } from '@pages/chat-list/chat-list';
//import { ChatPage } from '@pages/chat/chat';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { WebsocketProvider } from '@providers/websocket/websocket';
import { ChatProvider } from '@providers/chat/chat';
import { UserProvider } from '@providers/user/user';

@NgModule({
    declarations: [
        MyApp,
        HomePage,
        ChatListPage
    ],
    imports: [
        BrowserModule,
        IonicModule.forRoot(MyApp),
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
        HomePage,
        ChatListPage,
        //ChatPage
    ],
    providers: [
        StatusBar,
        SplashScreen,
        { provide: ErrorHandler, useClass: IonicErrorHandler },
        WebsocketProvider,
        ChatProvider,
        UserProvider,
    ]
})
export class AppModule { }
