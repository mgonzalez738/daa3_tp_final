import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import * as io from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { DataTempHum, EventTempHum } from '../../models/sensorTempHumModel'

@Injectable({ providedIn: 'root' })
export class SocketioService {

  socket;
  private data: DataTempHum;
  private event: EventTempHum;
  private dataListener = new Subject<DataTempHum>();
  private eventListener = new Subject<EventTempHum>();

  constructor() { }

  setupSocketConnection() {
    // Conecta al backend
    this.socket = io(environment.socketEndpoint);
    // Suscribe eventos
    this.socket.on('event', (et: EventTempHum) => {
      this.event = et;
      this.eventListener.next(this.event);
    });
    // Suscribe datos
    this.socket.on('data', (dt: DataTempHum) => {
      this.data = dt;
      this.dataListener.next(this.data);
    });
  }

  getData(): DataTempHum {
    return this.data;
  }

  getEvent(): EventTempHum {
    return this.event;
  }

  getDataListener() {
    return this.dataListener.asObservable();
  }

  getEventListener() {
    return this.eventListener.asObservable();
  }

}
