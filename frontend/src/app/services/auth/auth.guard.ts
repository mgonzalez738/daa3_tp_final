import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor( private authService: AuthService, private router: Router) {}

  canActivate (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const authStatus = this.authService.getAuthStatus();
    if(!authStatus) {
      this.router.navigate(['/login']);
      return false;
    } else {
      return true;
    }
  }
}
