import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

import { environment } from '../../../environments/environment';
import { UserPopulated } from '../../models/userModel'

@Injectable({ providedIn: 'root' })
export class AuthService {

  private urlApi = environment.backendApiUrl;
  private token: string = null;
  private authStatus: boolean = false;
  private authStatusListener = new Subject<boolean>();
  private authUser: UserPopulated = null;

  constructor(
    private http: HttpClient,
    private router: Router
    ) { }

  getToken(): string {
    return this.token;
  }

  getAuthStatus(): boolean {
    return this.authStatus;
  }

  getAuthUser(): UserPopulated {
    return this.authUser;
  }

  async setAuthUser(): Promise<void> {
    try {
      this.authUser = (await this.http.get<{Data: UserPopulated}>(this.urlApi + "/users/me?populate=true").toPromise()).Data;
    } catch (error) {
      console.log(error);
    }
  }

  // Actualiza el cliente seleccionado
  async setAuthUserSelectedClient(clientId: string): Promise<void> {
    try {
      await this.http.put(this.urlApi + "/users/" + this.authUser._id, { ClientId: clientId }).toPromise();
      this.authUser = (await this.http.get<{Data: UserPopulated}>(this.urlApi + "/users/me?populate=true").toPromise()).Data;
    } catch (error) {
      console.log(error);
    }
  }

  // Actualiza el proyecto seleccionado
  async updateUserSelectedProject(projectId: string): Promise<void> {
    try {
      await this.http.put(this.urlApi + "/users/" + this.authUser._id, { ProjectId: projectId }).toPromise();
      this.authUser = (await this.http.get<{Data: UserPopulated}>(this.urlApi + "/users/me?populate=true").toPromise()).Data;
    } catch (error) {
      console.log(error);
    }
  }

  async login(username: string, password: string):Promise<boolean> {
    let data = { UserId: username, Password: password };
    try {
      let res = await this.http.post<{Success: boolean; Token: string }>(this.urlApi + "/auth/login", data).toPromise();
      this.token = res.Token;
      if(this.token) {
        this.authStatus = true;
        this.authStatusListener.next(true);
        this.saveAuthData(this.token);
        this.router.navigate(['/']);
      }
      return this.authStatus;
    }
    catch (error) {
      this.token = null;
      this.authStatus = false;
      this.authStatusListener.next(false);
      this.authUser = null;
      throw error;
    }
  }

  async autoAuthUser() {
    const authInformation = this.getAuthData();
    if(authInformation) {
      this.token = authInformation.token;
      this.authStatus = true;
      this.authStatusListener.next(true);
    }
  }

  logout() {
    this.token = null;
    this.authStatus = false;
    this.authStatusListener.next(false);
    this.authUser = null;
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  private saveAuthData(token: string,) {
    localStorage.setItem('token', token);
  }

  private getAuthData() {
    const token = localStorage.getItem('token');
    if(!token) {
      return null;
    }
    return {
      token: token
    }
  }

  private clearAuthData() {
    localStorage.removeItem('token');
  }
}
