import { NgModule } from '@angular/core';

import { SiteComponent } from './sites.component';
import { SiteRoutingModule } from './sites-routing.module';

@NgModule({
  imports: [
    SiteRoutingModule,
  ],
  declarations: [ SiteComponent ]
})
export class SiteModule { }
