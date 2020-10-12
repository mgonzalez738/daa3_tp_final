import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../../environments/environment'
import { SensorTempHum, DataTempHum } from '../../models/sensorTempHumModel'
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

}
