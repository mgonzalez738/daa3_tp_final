import { NgModule } from '@angular/core';

import { MapComponent } from './map.component';
import { MapRoutingModule } from './map-routing.module';
import { AngularResizedEventModule } from 'angular-resize-event';

@NgModule({
  imports: [
    MapRoutingModule,
    AngularResizedEventModule
  ],
  declarations: [ MapComponent ],
})
export class MapModule { }
