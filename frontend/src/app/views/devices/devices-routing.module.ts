import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DevicesLayoutComponent } from './devices-layout.component';
import { DeviceListComponent } from './device-list.component';

const routes: Routes = [
  {
    path: '',
    component: DevicesLayoutComponent,
    data: {
      title: 'Dispositivos'
    },
    children : [
      {
        path: 'temphum',
        loadChildren: () => import('./temphum/temphum.module').then(m => m.TempHumModule)
      },
      {
        path: '',
        component: DeviceListComponent,
        data: {
          title: ''
        }
      }
    ]
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DevicesRoutingModule {}
