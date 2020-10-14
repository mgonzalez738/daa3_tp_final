import { NgModule } from '@angular/core';
import {CommonModule} from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ModalModule } from 'ngx-bootstrap/modal';

import { DevicesRoutingModule } from './devices-routing.module';
import { DevicesLayoutComponent } from './devices-layout.component';
import { DeviceListComponent } from './device-list.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ModalModule.forRoot(),
    DevicesRoutingModule
  ],
  declarations: [
    DevicesLayoutComponent,
    DeviceListComponent
  ]
})

export class DevicesModule { }
