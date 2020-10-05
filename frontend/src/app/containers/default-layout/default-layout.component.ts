import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from '../../services/auth/auth.service';
import { ClientsService } from '../../services/clients/clients.service';
import { ProjectsService } from '../../services/projects/projects.service';
import { SidebarService } from '../../services/sidebar/sidebar.service';

import { UserPopulated } from '../../models/userModel';
import { Client } from '../../models/clientModel';
import { Project } from '../../models/projectModel';

import { Subscription } from 'rxjs';
import { INavData } from '@coreui/angular';

@Component({
  selector: 'app-dashboard',
  templateUrl: './default-layout.component.html'
})
export class DefaultLayoutComponent implements OnInit, OnDestroy {

  public sidebarMinimized = false;

  public navItems: INavData[];
  private navItemsSubscription: Subscription;

  public authUser: UserPopulated;

  public clients: Client[];
  public projects: Project[];

  public clientIsLoading = false;
  public projectIsLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private clientsService: ClientsService,
    private projectsService: ProjectsService,
    private sidebarService: SidebarService
   ) { }

  async ngOnInit(): Promise<void> {

    // Autenticacion
    try {
      await this.authService.setAuthUser();
      this.authUser = this.authService.getAuthUser();
    }
    catch (error) {
      console.log(error);
    }

    // Genera Items sidebar
    this.navItems = this.sidebarService.generateNavItems();

    // Suscribe a los cambios de items
    this.navItemsSubscription = this.sidebarService
      .getNavItemsListener()
      .subscribe(items => { this.navItems = items });

    // Obtiene los clientes si el usuario es super
    if(this.authUser && this.authUser.Role === 'super') {
      await this.loadClients();
    }

    // Carga los proyectos si el cliente ya esta seleccionado
    if(this.authUser && this.authUser.Client) {
      await this.loadProjects();
      // Genera el sidebar
      this.sidebarService.generateNavItems();
     }
  };

  ngOnDestroy(): void {
    this.navItemsSubscription.unsubscribe();
  };

  toggleMinimize(e) {
    this.sidebarMinimized = e;
  }

  onLogout() {
    this.authService.logout();
  }

  public async onClientSelectedChanged(client: Client) {
    this.clientIsLoading = true;
    this.authUser.Project = null; // Evita que se vea que vuelve al dashboard al cambiar cliente -> revisar
    try {
      // Actualiza el cliente y el usuario autorizado
      await this.authService.setAuthUserSelectedClient(client._id);
      await this.authService.updateUserSelectedProject(null);
      this.authUser = this.authService.getAuthUser();
      this.clientIsLoading = false;
      await this.loadProjects();
    } catch (error) {
      this.clientIsLoading = false;
      console.log(error);
    }
  }

  public async onProjectSelectedChanged(project: Project) {
    this.projectIsLoading = true;
    try {
      // Actualiza el proyecto y el usuario autorizado
      await this.authService.updateUserSelectedProject(project._id);
      this.authUser = this.authService.getAuthUser();
      // Actualiza el sidebar
      this.sidebarService.generateNavItems();
      this.projectIsLoading = false;
    } catch (error) {
      this.projectIsLoading = false;
      console.log(error);
    }
  }

  private async loadClients() {
    try {
      this.clients = await this.clientsService.getClients();
    } catch (error) {
      console.log(error);
    }
  }

  private async loadProjects() {
    try {
      this.projects = await this.projectsService.getProjects();
    } catch (error) {
      console.log(error);
    }
  }
}
