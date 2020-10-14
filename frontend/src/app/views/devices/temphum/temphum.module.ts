import { NgModule } from '@angular/core';
import {CommonModule} from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ModalModule } from 'ngx-bootstrap/modal';
import { CollapseModule  } from 'ngx-bootstrap/collapse';
import { ButtonsModule  } from 'ngx-bootstrap/buttons';
import { PaginationModule  } from 'ngx-bootstrap/pagination';

import { ChartsModule } from 'ng2-charts';

import { TempHumRoutingModule } from './temphum-routing.module';
import { TempHumLayoutComponent } from './temphum-layout.component';
import { TempHumComponent } from './temphum.component';
import { TempHumDataComponent } from './temphum-data.component';
import { TempHumEventComponent } from './temphum-event.component';
import { NewTempHumComponent } from './temphum-new.component';



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ModalModule.forRoot(),
    CollapseModule.forRoot(),
    ButtonsModule.forRoot(),
    PaginationModule.forRoot(),
    ChartsModule,
    TempHumRoutingModule
  ],
  declarations: [
    TempHumLayoutComponent,
    TempHumComponent,
    TempHumDataComponent,
    TempHumEventComponent,
    NewTempHumComponent
  ]
})

export class TempHumModule { }
