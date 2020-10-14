import { NgModule } from '@angular/core';

import { BuildingComponent } from './building.component';
import { BuildingRoutingModule } from './building-routing.module';

@NgModule({
  imports: [
    BuildingRoutingModule,
  ],
  declarations: [ BuildingComponent ]
})
export class BuildingModule { }
