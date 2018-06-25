import { Injectable } from '@angular/core';
import io from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable()
export class WebsocketProvider {

    constructor() {
        this.socket = io.connect(this.url);
        (window as any).ws = this;
    }
    private readonly url: string = !!localStorage.url ? localStorage.url: 'localhost:3000';
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
}
