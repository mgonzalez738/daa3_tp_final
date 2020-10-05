import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UserLayoutComponent } from './user-layout.component';
import { UsersComponent } from './users.component';
import { NewUserComponent } from './new-user.component';
import { EditUserComponent } from './edit-user.component';

const routes: Routes = [
  {
    path: '',
    component: UserLayoutComponent,
    data: {
      title: 'Usuarios'
    },
    children : [
      {
        path: '',
        component: UsersComponent,
        data: {
          title: ''
        }
      },
      {
        path: 'newuser',
        component: NewUserComponent,
        data: {
          title: 'Nuevo'
        }
      },
      {
        path: ':userid',
        component: EditUserComponent,
        data: {
          title: 'Editar Usuario'
        }
      }
    ]
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule {}
