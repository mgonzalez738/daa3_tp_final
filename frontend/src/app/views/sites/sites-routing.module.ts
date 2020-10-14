import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SiteComponent } from './sites.component';

const routes: Routes = [
  {
    path: '',
    component: SiteComponent,
    data: {
      title: 'Vista Ejemplo'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SiteRoutingModule {}
