import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { UserPopulated } from '../../models/userModel';
import { Router } from '@angular/router';

@Component({
  selector: 'dashboard-button',
  inputs: ['enabled'],
  templateUrl: './dashboard-button.component.html'
})
export class DashboardButtonComponent {

  private authUser: UserPopulated;

  public enabled = false;

  constructor(
    private router: Router,
    private authService: AuthService
   ) {}

  public onClick(event) {
    this.authUser = this.authService.getAuthUser();
    this.router.navigate([`dashboard`, this.authUser.Project._id]);
  }

}
