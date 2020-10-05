import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'
import { NgForm, PatternValidator } from '@angular/forms';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth/auth.service';
import { UsersService } from '../../services/users/users.service';
import { ClientsService } from '../../services/clients/clients.service';
import { ProjectsService } from '../../services/projects/projects.service';

import { User, UserPopulated } from '../../models/userModel';
import { Client } from '../../models/clientModel';
import { Project } from '../../models/projectModel';

@Component({
  templateUrl: 'new-user.component.html'
})
export class NewUserComponent implements OnInit {

  authUser: UserPopulated;
  roleSelected: string = "guest";
  public clients: Client[];
  projects: Project[];
  user: User;

  usernameError = false;
  usernameErrorMessage = "";
  passwordError = false;
  passwordErrorMessage = "";
  passwordRepeatError = false;
  passwordRepeatErrorMessage = "";
  firstnameError = false;
  firstnameErrorMessage = "";
  lastnameError = false;
  lastnameErrorMessage = "";
  emailError = false;
  emailErrorMessage = "";

  isLoading = false;
  storeError = false;
  storeErrorMessage = "";

  constructor(
    private usersService: UsersService,
    private clientsService: ClientsService,
    private projectsService: ProjectsService,
    private authService: AuthService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {

    try {
      this.authUser = await this.authService.getAuthUser();
    } catch (error) {
      console.log(error);
    }

    if(this.authUser.Role === 'super') {
      try {
        this.clients = await this.clientsService.getClients();
      } catch (error) {
        console.log(error);
        return;
      }
    }

    try {
      if(this.authUser.Role !== 'super') {
        this.projects = await this.projectsService.getProjects();
      }
    } catch (error) {
      console.log(error);
    }

  }

  async onClientSelectChange(selected) {
    this.projects = await this.projectsService.getProjectsByClientId(selected);
  }

  async OnOk(form: NgForm) {
    let error = false;
    this.isLoading = true;
    const passwordPattern = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}");
    const whitespacePattern = new RegExp("^(?=.*\\s)");
    const letterNumberPattern = new RegExp("^(?=.*[^A-Za-z0-9])");
    const emailPattern = new RegExp("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$");

    if(form.value.username === "") {
      this.usernameError = true;
      this.usernameErrorMessage = "Usuario requerido.";
      error = true;
    } else if (whitespacePattern.test(form.value.username)){
      this.usernameError = true;
      this.usernameErrorMessage = "Espacios en blanco no permitidos.";
      error = true;
    } else if (letterNumberPattern.test(form.value.username)){
      this.usernameError = true;
      this.usernameErrorMessage = "Solo letras y numeros permitidos.";
      error = true;
    } else {
      const user = await this.usersService.getUserByUsername(form.value.username);
      if(user) {
        this.usernameError = true;
        this.usernameErrorMessage = "Nombre de usuario existente.";
        error = true;
      } else {
        this.usernameError = false;
      }
    }

    if(form.value.password === ""){
      this.passwordError = true;
      this.passwordErrorMessage = "Contraseña requerida.";
      error = true;
    } else if (!passwordPattern.test(form.value.password)){
      this.passwordError = true;
      this.passwordErrorMessage = "Requiere 8 o más caracteres con al menos una mayúscula, una minúscula y un número.";
      error = true;
    } else {
      this.passwordError = false;
    }

    if(form.value.passwordRepeat === ""){
      this.passwordRepeatError = true;
      this.passwordRepeatErrorMessage = "Repetir contraseña requerido.";
      error = true;
    } else if (form.value.passwordRepeat !== form.value.password){
      this.passwordRepeatError = true;
      this.passwordRepeatErrorMessage = "Las contraseñas no coinciden.";
      error = true;
    } else {
      this.passwordRepeatError = false;
    }

    if(form.value.firstname === ""){
      this.firstnameError = true;
      this.firstnameErrorMessage = "Nombre requerido.";
      error = true;
    } else {
      this.firstnameError = false;
    }

    if(form.value.lastname === ""){
      this.lastnameError = true;
      this.lastnameErrorMessage = "Apellido requerido.";
      error = true;
    } else {
      this.lastnameError = false;
    }

    if(form.value.email === ""){
      this.emailError = true;
      this.emailErrorMessage = "Email requerido.";
      error = true;
    } else if (!emailPattern.test(form.value.email)) {
      this.emailError = true;
      this.emailErrorMessage = "Email inválido.";
      error = true;
    } else {
      this.emailError = false;
    }

    if(error) {
      this.isLoading = false;
      return;
    }
    this.user = new User();
    this.user.UserId = form.value.username;
    this.user.Password = form.value.password;
    this.user.FirstName = form.value.firstname;
    this.user.LastName = form.value.lastname;
    this.user.Email = form.value.email;
    this.user.Role = form.value.role;
    if(this.authUser.Role !== 'super') {
      this.user.ClientId = this.authUser.Client._id;
    } else {
      this.user.ClientId = form.value.client;
    }
    if((form.value.role !== 'super') && (form.value.role !== 'administrator')) {
      if(form.value.projects.length > 0) {
        this.user.ProjectsId = form.value.projects;
      }
    }
    this.user.ProjectId = null;

    try {
      let res = await this.usersService.storeUser(this.user);
      this.storeError = false;
      this.storeErrorMessage = "";
      this.isLoading = false;
      this.router.navigate(['/users']);
    }
    catch (error) {
      this.storeError = true;
      this.storeErrorMessage = error.message;
      this.isLoading = false;
    }

    return;
  }

}
