import { Injectable } from '@angular/core';
import io from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable()
export class WebsocketProvider {

    constructor() {
        this.socket = io.connect(this.getSocketUrl());
    }
    private socket;


    public disconnect() {
        this.socket.disconnect();
    }

    public emitEvent(emitEventName: string, data: any) {
        this.socket.emit(emitEventName, data);
    }

    public onEvent(eventName: string): Observable<any> {
        return new Observable<any>(observer => {
            this.socket.on(eventName, data => {
                observer.next(data);
            });
        });
    }

    public getSocketUrl(): string {
        return !!localStorage.url ? localStorage.url: 'http://bot.lazy-ants.com:5000';
    }

    public updateSocketUrl(url: string) {
        this.socket = io.connect(url);
        localStorage.setItem('url', url);
    }
}
