import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../../environments/environment'
import { User, UserPopulated } from '../../models/userModel'

@Injectable({ providedIn: 'root' })
export class UsersService {

  private urlApi = environment.backendApiUrl;

  constructor(private http: HttpClient) { }

  // Obtiene el listado de usuarios
  async getUsers(): Promise<User[]> {
    let res = await this.http.get<{Data: User[]}>(this.urlApi + "/users").toPromise();
    return res.Data;
  }

  // Obtiene un usuario por Username
  async getUserByUsername(username: string): Promise<User> {
    let res = await this.http.get<{Data: User[]}>(this.urlApi + "/users?userid=" + username).toPromise();
    return res.Data[0];
  }

  // Guarda un usuario
  async storeUser(user:User): Promise<string> {
    let res = await this.http.post<{'Data._id': string }>(this.urlApi + "/users", user).toPromise();
    return res["Data._id"];
  }

  // Elimina un usuario
  async deleteUser(id:string): Promise<void> {
    await this.http.delete(this.urlApi + "/users/" + id).toPromise();
    return;
  }

  // Actualiza un usuario
  async updateUser(user:User): Promise<void> {
    await this.http.put(this.urlApi + "/users/" + user._id, user).toPromise();
    return;
  }

}
