import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../../environments/environment'
import { SensorTempHum, DataTempHum, EventTempHum } from '../../models/sensorTempHumModel'
import { PaginationData } from '../../models/paginationDataModel'

@Injectable({ providedIn: 'root' })
export class SensorTempHumService {

  private urlApi = environment.backendApiUrl;

  constructor(private http: HttpClient) { }

  // Obtiene el listado de sensores
  async getSensors(): Promise<SensorTempHum[]> {
    let res = await this.http.get<{Data: SensorTempHum[]}>(this.urlApi + "/sensors/temphum").toPromise();
    return res.Data;
  }

  // Obtiene un sensor por Id
  async getSensorById(id: string): Promise<SensorTempHum> {
    let res = await this.http.get<{Data: SensorTempHum}>(this.urlApi + "/sensors/temphum/" + id).toPromise();
    return res.Data;
  }

  // Obtiene un sensor por Name
  async getSensorsByName(sensorname: string): Promise<SensorTempHum> {
    let res = await this.http.get<{Data: SensorTempHum[]}>(this.urlApi + "/sensors/temphum?name=" + sensorname).toPromise();
    return res.Data[0];
  }

  // Obtiene un sensores por Project
  async getSensorsByProjectId(projectid: string): Promise<SensorTempHum[]> {
    let res = await this.http.get<{Data: SensorTempHum[]}>(this.urlApi + "/sensors/temphum?projectid=" + projectid).toPromise();
    return res.Data;
  }

  // Guarda un sensor
  async storeSensor(sensor:SensorTempHum): Promise<string> {
    let res = await this.http.post<{'Data._id': string }>(this.urlApi + "/sensors/temphum", sensor).toPromise();
    return res["Data._id"];
  }

  // Elimina un sensor
  async deleteSensor(id:string): Promise<void> {
    await this.http.delete(this.urlApi + "/sensors/temphum/" + id).toPromise();
    return;
  }

  // Actualiza un sensor
  async updateSensor(sensor:SensorTempHum): Promise<void> {
    await this.http.put(this.urlApi + "/sensors/temphum/" + sensor._id, sensor).toPromise();
    return;
  }

  // Obtiene los datos de un sensor
  async getSensorsData(id: string, from: Date, to: Date, limit?: number, skip?: number): Promise<{Pagination: PaginationData, Data: DataTempHum[]}> {
    let query = `?from=${from}&to=${to}`;
    if(limit) {
      query += `&limit=${limit}`;
    }
    if(skip) {
      query += `&skip=${skip}`;
    }
    let res = await this.http.get<{Pagination: PaginationData, Data: DataTempHum[]}>(this.urlApi + "/sensors/temphum/" + id + '/data' + query).toPromise();
    return res;
  }

  // Obtiene los datos de un sensor
  async getSensorsLastData(id: string): Promise<DataTempHum> {
    let res = await this.http.get<{Data: DataTempHum}>(this.urlApi + "/sensors/temphum/" + id + '/data/last').toPromise();
    return res.Data;
  }

  // Obtiene los eventos de un sensor
  async getSensorsEvent(id: string, from: Date, to: Date, limit?: number, skip?: number): Promise<{Pagination: PaginationData, Data: EventTempHum[]}> {
    let query = `?from=${from}&to=${to}`;
    if(limit) {
      query += `&limit=${limit}`;
    }
    if(skip) {
      query += `&skip=${skip}`;
    }
    let res = await this.http.get<{Pagination: PaginationData, Data: EventTempHum[]}>(this.urlApi + "/sensors/temphum/" + id + '/event' + query).toPromise();
    return res;
  }

  // Obtiene el ultimo evento del sensor
  async getSensorLastEvent(id: string): Promise<EventTempHum> {
    let res = await this.http.get<{Data: EventTempHum}>(this.urlApi + "/sensors/temphum/" + id + '/event/last').toPromise();
    return res.Data;
  }

  async setLedStatus(id: string, status: boolean): Promise<void> {
    if(status) {
      await this.http.post(this.urlApi + "/sensors/temphum/" + id + "/method/ledOn", {}).toPromise();
    } else {
      await this.http.post(this.urlApi + "/sensors/temphum/" + id + "/method/ledOff", {}).toPromise();
    }
    return;
  }

  async getLedStatus(id: string): Promise<boolean> {
    let res = await this.http.post<{Data: string}>(this.urlApi + "/sensors/temphum/" + id + "/method/ledStatus", {}).toPromise();
    if(res.Data == "true")
      return true;
    else
      return false;
  }

}
