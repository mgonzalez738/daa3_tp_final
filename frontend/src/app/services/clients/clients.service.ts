import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../../environments/environment'
import { Client } from '../../models/clientModel'

@Injectable({ providedIn: 'root' })
export class ClientsService {

  private urlApi = environment.backendApiUrl;

  constructor(private http: HttpClient) { }

  // Obtiene el listado de clientes
  async getClients(): Promise<Client[]> {
    let res = await this.http.get<{Data: Client[]}>(this.urlApi + "/clients").toPromise();
    return res.Data;
  }

  // Obtiene un cliente por id
  async getClientById(id: string): Promise<Client> {
    let res = await this.http.get<{Data: Client}>(this.urlApi + "/clients/" + id).toPromise();
    return res.Data;
  }

}
