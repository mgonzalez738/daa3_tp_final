import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TempHumLayoutComponent } from './temphum-layout.component';
import { TempHumComponent } from './temphum.component';
import { TempHumDataComponent } from './temphum-data.component';
import { TempHumEventComponent } from './temphum-event.component';

const routes: Routes = [
  {
    path: '',
    component: TempHumLayoutComponent,
    data: {
      title: 'Temperatura Humedad'
    },
    children : [
      {
        path: 'data/:sensorid',
        component: TempHumDataComponent,
        data: {
          title: 'Datos'
        }
      },
      {
        path: 'event/:sensorid',
        component: TempHumEventComponent,
        data: {
          title: 'Eventos'
        }
      },
      {
        path: '',
        component: TempHumComponent,
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
export class TempHumRoutingModule {}
