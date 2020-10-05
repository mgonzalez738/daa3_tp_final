import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  usernameEmpty = false;
  passwordEmpty = false;
  loginError = false;
  isLoading = false;

  constructor(private authService: AuthService) { }

  ngOnInit(): void { }

  async OnLogin(form: NgForm) {
    this.isLoading = true;
    if(form.value.username === ""){
      this.usernameEmpty = true;
    } else {
      this.usernameEmpty = false;
    }
    if(form.value.password === ""){
      this.passwordEmpty = true;
    } else {
      this.passwordEmpty = false;
    }
    if(this.usernameEmpty || this.passwordEmpty) {
      this.isLoading = false;
      return;
    }

    try {
      await this.authService.login(form.value.username, form.value.password);
      this.loginError = false;
    }
    catch (error) {
      this.loginError = true;
      this.isLoading = false;
    }

    return;
  }

}
