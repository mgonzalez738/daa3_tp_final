import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BuildingComponent } from './building.component';

const routes: Routes = [
  {
    path: '',
    component: BuildingComponent,
    data: {
      title: 'En construccion'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BuildingRoutingModule {}
