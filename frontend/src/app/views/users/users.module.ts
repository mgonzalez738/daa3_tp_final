import { NgModule } from '@angular/core';
import {CommonModule} from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ModalModule } from 'ngx-bootstrap/modal';

import { UsersRoutingModule } from './users-routing.module';
import { UserLayoutComponent } from './user-layout.component';
import { UsersComponent } from './users.component';
import { NewUserComponent } from './new-user.component';
import { EditUserComponent } from './edit-user.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ModalModule.forRoot(),
    UsersRoutingModule
  ],
  declarations: [
    UserLayoutComponent,
    UsersComponent,
    NewUserComponent,
    EditUserComponent
  ]
})

export class UsersModule { }
