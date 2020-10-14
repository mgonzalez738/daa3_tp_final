import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../../environments/environment'
import { Project } from '../../models/projectModel'

@Injectable({ providedIn: 'root' })
export class ProjectsService {

  private urlApi = environment.backendApiUrl;

  constructor(private http: HttpClient) { }

  // Obtiene el listado de proyectos
  async getProjects(): Promise<Project[]> {
    let res = await this.http.get<{Data: Project[]}>(this.urlApi + "/projects").toPromise();
    return res.Data;
  }

  // Obtiene el listado de proyectos por ClientId
  async getProjectsByClientId(id: string): Promise<Project[]> {
    let res = await this.http.get<{Data: Project[]}>(this.urlApi + "/projects?clientid=" + id).toPromise();
    return res.Data;
  }

  // Obtiene un proyecto por id
  async getProjectById(id: string): Promise<Project> {
    let res = await this.http.get<{Data: Project}>(this.urlApi + "/projectss/" + id).toPromise();
    return res.Data;
  }
}
