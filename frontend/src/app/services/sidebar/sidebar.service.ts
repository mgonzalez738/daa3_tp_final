import { Injectable } from '@angular/core';
import { INavData } from '@coreui/angular';
import { Subject, Subscription } from 'rxjs';

import { UserPopulated } from '../../models/userModel';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class SidebarService {

  private navItems: INavData[];
  private navItemsListener = new Subject<INavData[]>();

  public authUser: UserPopulated;

  constructor( private authService: AuthService ) { }

  getNavItems(): INavData[] {
    return this.navItems;
  }

  getNavItemsListener() {
    return this.navItemsListener.asObservable();
  }

  generateNavItems(): INavData[] {

    let navItems: INavData[] = [];
    let item: INavData;

    this.authUser =this.authService.getAuthUser();

    // Vistas
    item = { name: 'Vistas', url: '/sites', icon: 'icon-puzzle', children: [] };
    item.children.push( { name: 'Vista Ejemplo', url: '/sites' } );
    navItems.push(item);

    // Graficas
    item = { name: 'Gráficas', url: '/charts', icon: 'icon-puzzle', children: [] };
    item.children.push( { name: 'Gráficas Ejemplo', url: '/charts' } );
    navItems.push(item);

    // Alarmas
    item = { name: 'Alarmas', url: '/alarms', icon: 'icon-puzzle' };
    navItems.push(item);

    // Mapa
    item = { name: 'Mapa', url: '/map', icon: 'icon-location-pin' };
    navItems.push(item);

    // Dispositivos
    item = { name: 'Dispositivos', url: '/devices', icon: 'icon-puzzle', children: [] };
    item.children.push( { name: 'Temperatura', url: '/devices' } );
    navItems.push(item);

    // Configuracion
    if(this.authUser && (this.authUser.Role==='super' || this.authUser.Role==='administrator')) {
      item = { name: 'Configuración', url: '/config', icon: 'icon-puzzle', children: [] };
      item.children.push( { name: 'Usuarios', url: '/users' } );
      navItems.push(item);
    }

    return navItems;

  }

}
